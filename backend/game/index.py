import json
import os
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

SLOT_SYMBOLS = ['seven', 'diamond', 'star', 'cherry', 'bell', 'coin']


def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user(cur, token):
    cur.execute(
        "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id "
        "WHERE s.token = %s AND s.expires_at > NOW()", (token,))
    return cur.fetchone()


def rnd():
    return secrets.randbelow(10000) / 10000.0


def user_public(u):
    return {
        'id': u['id'], 'email': u['email'], 'nickname': u['nickname'],
        'balance': u['balance'], 'xp': u['xp'], 'level': u['level'],
        'vip_level': u['vip_level'], 'role': u['role'], 'is_owner': u['is_owner'],
        'total_wagered': u['total_wagered'], 'total_won': u['total_won'],
        'games_played': u['games_played'],
    }


def settle(cur, u, game, bet, payout, result, mult):
    xp_gain = max(1, bet // 10)
    new_xp = u['xp'] + xp_gain
    new_level = 1 + new_xp // 1000
    new_balance = u['balance'] - bet + payout
    cur.execute(
        "UPDATE users SET balance=%s, xp=%s, level=%s, total_wagered=total_wagered+%s, "
        "total_won=total_won+%s, games_played=games_played+1 WHERE id=%s RETURNING *",
        (new_balance, new_xp, new_level, bet, payout, u['id']))
    updated = cur.fetchone()
    cur.execute(
        "INSERT INTO game_history (user_id, game, bet, payout, result, multiplier) VALUES (%s,%s,%s,%s,%s,%s)",
        (u['id'], game, bet, payout, result, mult))
    cur.execute("INSERT INTO transactions (user_id, amount, type, description) VALUES (%s,%s,%s,%s)",
                (u['id'], payout - bet, 'game', game))
    # прогресс ежедневного задания "сыграй"
    cur.execute(
        "UPDATE daily_quests SET progress = LEAST(progress+1, goal) "
        "WHERE user_id=%s AND code='play' AND quest_date=CURRENT_DATE", (u['id'],))
    return updated


def handler(event: dict, context) -> dict:
    '''Игровой движок: слот 777, минёр, crash, case, mine drop. Все ставки и выигрыши в Plazma Coin.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        headers = event.get('headers', {})
        token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
        params = event.get('queryStringParameters') or {}

        if method == 'GET':
            u = get_user(cur, token)
            if not u:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'auth required'})}
            action = params.get('action')
            if action == 'history':
                cur.execute("SELECT game, bet, payout, result, multiplier, created_at FROM game_history "
                            "WHERE user_id=%s ORDER BY id DESC LIMIT 30", (u['id'],))
                rows = cur.fetchall()
                for r in rows:
                    r['created_at'] = r['created_at'].isoformat()
                    r['multiplier'] = float(r['multiplier'])
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'history': rows})}
            if action == 'leaderboard':
                cur.execute("SELECT nickname, total_won, level, games_played FROM users "
                            "ORDER BY total_won DESC LIMIT 20")
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'leaders': cur.fetchall()})}
            if action == 'stats':
                cur.execute("SELECT COUNT(*) c FROM users")
                players = cur.fetchone()['c']
                cur.execute("SELECT COALESCE(SUM(payout),0) s FROM game_history WHERE created_at::date = CURRENT_DATE")
                paid = cur.fetchone()['s']
                cur.execute("SELECT COALESCE(MAX(payout),0) m FROM game_history")
                big = cur.fetchone()['m']
                cur.execute("SELECT COUNT(*) c FROM tournaments WHERE status='active'")
                trn = cur.fetchone()['c']
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                    {'players': players, 'paid_today': int(paid), 'biggest_win': int(big), 'tournaments': trn})}
            if action == 'quests':
                seed_quests(cur, u['id'])
                conn.commit()
                cur.execute("SELECT code, progress, goal, reward, claimed FROM daily_quests "
                            "WHERE user_id=%s AND quest_date=CURRENT_DATE ORDER BY id", (u['id'],))
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'quests': cur.fetchall()})}
            if action == 'tournaments':
                cur.execute("SELECT id, title, description, prize_pool, status FROM tournaments ORDER BY id")
                trs = cur.fetchall()
                for t in trs:
                    cur.execute("SELECT u.nickname, tp.score FROM tournament_players tp "
                                "JOIN users u ON u.id=tp.user_id WHERE tp.tournament_id=%s "
                                "ORDER BY tp.score DESC LIMIT 10", (t['id'],))
                    t['players'] = cur.fetchall()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'tournaments': trs})}
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown'})}

        body = json.loads(event.get('body') or '{}')
        u = get_user(cur, token)
        if not u:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'auth required'})}
        act = body.get('action')

        if act == 'claim_quest':
            code = body.get('code')
            cur.execute("SELECT * FROM daily_quests WHERE user_id=%s AND code=%s AND quest_date=CURRENT_DATE",
                        (u['id'], code))
            q = cur.fetchone()
            if not q or q['claimed'] or q['progress'] < q['goal']:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Задание не выполнено'})}
            cur.execute("UPDATE daily_quests SET claimed=TRUE WHERE id=%s", (q['id'],))
            cur.execute("UPDATE users SET balance=balance+%s WHERE id=%s RETURNING *", (q['reward'], u['id']))
            updated = cur.fetchone()
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user_public(updated)})}

        bet = int(body.get('bet', 0))
        if bet <= 0 or bet > u['balance']:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Недостаточно Plazma Coin'})}

        if act == 'slot':
            reels = [SLOT_SYMBOLS[secrets.randbelow(len(SLOT_SYMBOLS))] for _ in range(3)]
            if reels[0] == reels[1] == reels[2]:
                mult = 15.0 if reels[0] == 'seven' else 8.0
            elif reels[0] == reels[1] or reels[1] == reels[2] or reels[0] == reels[2]:
                mult = 2.0
            else:
                mult = 0.0
            payout = int(bet * mult)
            updated = settle(cur, u, 'slot', bet, payout, 'win' if payout > 0 else 'lose', mult)
            add_tournament_score(cur, u['id'], 'Неоновый Кубок', payout)
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'reels': reels, 'payout': payout, 'multiplier': mult, 'user': user_public(updated)})}

        if act == 'crash':
            # клиент присылает cashout множитель, сервер честно генерит точку краха
            r = rnd()
            crash_point = round(max(1.0, (1.0 / (1.0 - r * 0.98))), 2)
            cashout = float(body.get('cashout', 0))
            if cashout > 1.0 and cashout <= crash_point:
                payout = int(bet * cashout)
                res = 'win'
                mult = cashout
            else:
                payout = 0
                res = 'lose'
                mult = 0.0
            updated = settle(cur, u, 'crash', bet, payout, res, mult)
            add_tournament_score(cur, u['id'], 'Crash Мастера', payout)
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'crash_point': crash_point, 'payout': payout, 'user': user_public(updated)})}

        if act == 'case':
            # 5 наград с весами
            prizes = [(0, 40), (int(bet * 0.5), 25), (bet, 15), (int(bet * 2.5), 12),
                      (int(bet * 5), 6), (int(bet * 20), 2)]
            total_w = sum(w for _, w in prizes)
            pick = secrets.randbelow(total_w)
            acc = 0
            payout = 0
            for val, w in prizes:
                acc += w
                if pick < acc:
                    payout = val
                    break
            mult = round(payout / bet, 2) if bet else 0
            updated = settle(cur, u, 'case', bet, payout, 'win' if payout > 0 else 'lose', mult)
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'payout': payout, 'multiplier': mult, 'user': user_public(updated)})}

        if act == 'miner':
            # клиент открыл N безопасных ячеек, сервер решает попал ли на мину
            mines = int(body.get('mines', 3))
            opened = int(body.get('opened', 0))
            cashout = bool(body.get('cashout', False))
            mines = max(1, min(20, mines))
            safe = 25 - mines
            if cashout:
                mult = 1.0
                for i in range(opened):
                    mult *= (25 - i) / (safe - i) if (safe - i) > 0 else 1
                mult = round(mult, 2)
                payout = int(bet * mult)
                updated = settle(cur, u, 'miner', bet, payout, 'win', mult)
                add_tournament_score(cur, u['id'], 'Ночь Минёра', payout)
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                    {'payout': payout, 'multiplier': mult, 'user': user_public(updated)})}
            # открытие одной ячейки — сервер решает мина или нет
            hit = secrets.randbelow(25 - opened) < mines
            if hit:
                updated = settle(cur, u, 'miner', bet, 0, 'lose', 0.0)
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                    {'hit': True, 'payout': 0, 'user': user_public(updated)})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'hit': False})}

        if act == 'minedrop':
            # шар падает и попадает в слот с множителем
            slots = [0.2, 0.5, 1.0, 1.5, 3.0, 1.5, 1.0, 0.5, 0.2, 5.0, 0.3]
            idx = secrets.randbelow(len(slots))
            mult = slots[idx]
            payout = int(bet * mult)
            updated = settle(cur, u, 'minedrop', bet, payout, 'win' if payout > 0 else 'lose', mult)
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'slot': idx, 'multiplier': mult, 'payout': payout, 'user': user_public(updated)})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown game'})}
    finally:
        cur.close()
        conn.close()


def seed_quests(cur, user_id):
    defaults = [
        ('play', 5, 200), ('win', 3, 300), ('bet_big', 1, 150),
    ]
    for code, goal, reward in defaults:
        cur.execute(
            "INSERT INTO daily_quests (user_id, code, goal, reward, quest_date) "
            "VALUES (%s,%s,%s,%s,CURRENT_DATE) ON CONFLICT (user_id, code, quest_date) DO NOTHING",
            (user_id, code, goal, reward))


def add_tournament_score(cur, user_id, title, payout):
    if payout <= 0:
        return
    cur.execute("SELECT id FROM tournaments WHERE title=%s AND status='active'", (title,))
    t = cur.fetchone()
    if not t:
        return
    cur.execute(
        "INSERT INTO tournament_players (tournament_id, user_id, score) VALUES (%s,%s,%s) "
        "ON CONFLICT (tournament_id, user_id) DO UPDATE SET score = tournament_players.score + %s",
        (t['id'], user_id, payout, payout))
