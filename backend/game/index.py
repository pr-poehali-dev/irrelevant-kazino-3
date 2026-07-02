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

# Слот: 8 символов с весами (чем реже — тем жирнее)
# seven: 2%, diamond: 5%, star: 8%, cherry: 15%, bell: 20%, coin: 25%, lemon: 15%, bar: 10%
SLOT_WEIGHTS = [
    ('seven',   2),
    ('diamond', 5),
    ('star',    8),
    ('cherry',  15),
    ('bell',    20),
    ('coin',    25),
    ('lemon',   15),
    ('bar',     10),
]
SLOT_TOTAL = sum(w for _, w in SLOT_WEIGHTS)

# Уровни: порог XP, скидка на покупку Plazma (%)
LEVELS = [
    (0,      0,   'Новобранец'),
    (500,    0,   'Игрок'),
    (1500,   2,   'Опытный'),
    (3000,   3,   'Ветеран'),
    (6000,   5,   'Мастер'),
    (10000,  7,   'Элита'),
    (18000,  8,   'Чемпион'),
    (30000,  10,  'Легенда'),
    (50000,  12,  'Эксперт'),
    (80000,  13,  'Профессионал'),
    (120000, 15,  'Гроссмейстер'),
    (180000, 16,  'Вице-король'),
    (260000, 17,  'Король'),
    (360000, 18,  'Граф'),
    (500000, 19,  'Герцог'),
    (700000, 20,  'Принц'),
    (1000000,21,  'Элитный'),
    (1500000,22,  'Премиум'),
    (2200000,23,  'VIP-Про'),
    (3000000,25,  'Бессмертный'),
]


def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user(cur, token):
    if not token:
        return None
    cur.execute(
        "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id "
        "WHERE s.token = %s AND s.expires_at > NOW()", (token,))
    u = cur.fetchone()
    if u and u.get('is_banned'):
        return None
    return u


def spin_slot():
    pick = secrets.randbelow(SLOT_TOTAL)
    acc = 0
    for sym, w in SLOT_WEIGHTS:
        acc += w
        if pick < acc:
            return sym
    return 'bar'


def user_public(u):
    lvl_idx = get_level_idx(u['xp'])
    lvl_info = LEVELS[lvl_idx]
    return {
        'id': u['id'], 'player_id': u.get('player_id') or str(u['id']),
        'email': u['email'], 'nickname': u['nickname'],
        'balance': u['balance'], 'xp': u['xp'], 'level': u['level'],
        'level_name': lvl_info[2], 'level_discount': lvl_info[1],
        'vip_level': u['vip_level'], 'role': u['role'], 'is_owner': u['is_owner'],
        'total_wagered': u['total_wagered'], 'total_won': u['total_won'],
        'games_played': u['games_played'],
    }


def get_level_idx(xp):
    idx = 0
    for i, (threshold, _, _) in enumerate(LEVELS):
        if xp >= threshold:
            idx = i
    return idx


def settle(cur, u, game, bet, payout, result, mult):
    xp_gain = max(1, bet // 20)
    new_xp = u['xp'] + xp_gain
    # уровень по таблице
    new_level = get_level_idx(new_xp) + 1
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
    cur.execute(
        "UPDATE daily_quests SET progress = LEAST(progress+1, goal) "
        "WHERE user_id=%s AND code='play' AND quest_date=CURRENT_DATE", (u['id'],))
    if payout > bet:
        cur.execute(
            "UPDATE daily_quests SET progress = LEAST(progress+1, goal) "
            "WHERE user_id=%s AND code='win' AND quest_date=CURRENT_DATE", (u['id'],))
    return updated


def handler(event: dict, context) -> dict:
    '''Игровой движок Irrelevant Kazino: слот, минёр, краш, кейс, mine drop, блэкджек, перевод Plazma.'''
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
                            "WHERE user_id=%s ORDER BY id DESC LIMIT 50", (u['id'],))
                rows = cur.fetchall()
                for r in rows:
                    r['created_at'] = r['created_at'].isoformat()
                    r['multiplier'] = float(r['multiplier'])
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'history': rows})}

            if action == 'leaderboard':
                cur.execute("SELECT nickname, player_id, total_won, level, games_played FROM users "
                            "WHERE is_banned=FALSE ORDER BY total_won DESC LIMIT 20")
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'leaders': cur.fetchall()})}

            if action == 'stats':
                cur.execute("SELECT COUNT(*) c FROM users WHERE is_banned=FALSE")
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
                    cur.execute("SELECT u.nickname, u.player_id, tp.score FROM tournament_players tp "
                                "JOIN users u ON u.id=tp.user_id WHERE tp.tournament_id=%s "
                                "ORDER BY tp.score DESC LIMIT 10", (t['id'],))
                    t['players'] = cur.fetchall()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'tournaments': trs})}

            if action == 'levels':
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'levels': [
                    {'idx': i+1, 'xp': lvl[0], 'discount': lvl[1], 'name': lvl[2]} for i, lvl in enumerate(LEVELS)
                ]})}

            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown'})}

        body = json.loads(event.get('body') or '{}')
        u = get_user(cur, token)
        if not u:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'auth required'})}
        act = body.get('action')

        # ── Перевод Plazma ──────────────────────────────────────────
        if act == 'transfer':
            to_pid = str(body.get('to_player_id', '')).strip()
            amount = int(body.get('amount', 0))
            if amount <= 0 or amount > u['balance']:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Недостаточно Plazma'})}
            cur.execute("SELECT * FROM users WHERE player_id=%s AND is_banned=FALSE", (to_pid,))
            target = cur.fetchone()
            if not target:
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Игрок не найден'})}
            if target['id'] == u['id']:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нельзя переводить себе'})}
            cur.execute("UPDATE users SET balance=balance-%s WHERE id=%s RETURNING *", (amount, u['id']))
            sender = cur.fetchone()
            cur.execute("UPDATE users SET balance=balance+%s WHERE id=%s", (amount, target['id']))
            cur.execute("INSERT INTO transactions (user_id, amount, type, description) VALUES (%s,%s,%s,%s)",
                        (u['id'], -amount, 'transfer_out', f'Перевод → {target["nickname"]}'))
            cur.execute("INSERT INTO transactions (user_id, amount, type, description) VALUES (%s,%s,%s,%s)",
                        (target['id'], amount, 'transfer_in', f'Перевод от {u["nickname"]}'))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'ok': True, 'to': target['nickname'], 'user': user_public(sender)})}

        # ── Забрать задание ─────────────────────────────────────────
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

        # ── Слот 777 (честный, с низкой дисперсией) ────────────────
        if act == 'slot':
            reels = [spin_slot() for _ in range(3)]
            s0, s1, s2 = reels
            if s0 == s1 == s2 == 'seven':
                mult = 50.0   # джекпот: very rare (~0.04%)
            elif s0 == s1 == s2 == 'diamond':
                mult = 20.0
            elif s0 == s1 == s2:
                # тройня прочих: ~0.3-1.5%
                mults = {'star': 12.0, 'cherry': 7.0, 'bell': 5.0, 'coin': 4.0, 'lemon': 3.5, 'bar': 6.0}
                mult = mults.get(s0, 4.0)
            elif s0 == s1 or s1 == s2 or s0 == s2:
                # пара: ~30% — платим 1.5x только для дорогих пар
                pair_sym = s0 if s0 == s1 or s0 == s2 else s1
                if pair_sym in ('seven', 'diamond', 'bar'):
                    mult = 2.0
                else:
                    mult = 0.0  # пара дешёвых — не выигрыш
            else:
                mult = 0.0
            payout = int(bet * mult)
            updated = settle(cur, u, 'slot', bet, payout, 'win' if payout > 0 else 'lose', mult)
            add_tournament_score(cur, u['id'], 'Неоновый Кубок', payout)
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'reels': reels, 'payout': payout, 'multiplier': mult, 'user': user_public(updated)})}

        # ── Crash ────────────────────────────────────────────────────
        if act == 'crash':
            r = secrets.randbelow(10000) / 10000.0
            crash_point = round(max(1.01, (1.0 / (1.0 - r * 0.97))), 2)
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
            add_tournament_score(cur, u['id'], 'Crash Лига', payout)
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'crash_point': crash_point, 'payout': payout, 'user': user_public(updated)})}

        # ── Кейс (улучшенные шансы) ──────────────────────────────────
        if act == 'case':
            prizes = [
                (0,            20),   # пусто
                (int(bet*0.5), 18),   # 0.5x
                (bet,          22),   # 1x (возврат)
                (int(bet*1.5), 15),   # 1.5x
                (int(bet*2),   12),   # 2x
                (int(bet*3),   7),    # 3x
                (int(bet*5),   4),    # 5x
                (int(bet*10),  1.5),  # 10x
                (int(bet*25),  0.4),  # 25x
                (int(bet*50),  0.1),  # 50x
            ]
            total_w = sum(w for _, w in prizes)
            pick = secrets.randbelow(int(total_w * 100))
            acc = 0.0
            payout = 0
            for val, w in prizes:
                acc += w * 100
                if pick < acc:
                    payout = val
                    break
            mult = round(payout / bet, 2) if bet else 0
            updated = settle(cur, u, 'case', bet, payout, 'win' if payout > 0 else 'lose', mult)
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'payout': payout, 'multiplier': mult, 'user': user_public(updated)})}

        # ── Минёр ────────────────────────────────────────────────────
        if act == 'miner':
            mines = int(body.get('mines', 3))
            opened = int(body.get('opened', 0))
            cashout = bool(body.get('cashout', False))
            mines = max(1, min(20, mines))
            safe = 25 - mines
            if cashout:
                mult = 1.0
                for i in range(opened):
                    mult *= (25 - i) / max(1, (safe - i))
                mult = round(mult, 2)
                payout = int(bet * mult)
                updated = settle(cur, u, 'miner', bet, payout, 'win', mult)
                add_tournament_score(cur, u['id'], 'Ночь Минёра', payout)
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                    {'payout': payout, 'multiplier': mult, 'user': user_public(updated)})}
            hit = secrets.randbelow(25 - opened) < mines
            if hit:
                updated = settle(cur, u, 'miner', bet, 0, 'lose', 0.0)
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                    {'hit': True, 'payout': 0, 'user': user_public(updated)})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'hit': False})}

        # ── Mine Drop ────────────────────────────────────────────────
        if act == 'minedrop':
            slots = [0.2, 0.5, 1.0, 1.5, 3.0, 1.5, 1.0, 0.5, 0.2, 5.0, 0.3]
            idx = secrets.randbelow(len(slots))
            mult = slots[idx]
            payout = int(bet * mult)
            updated = settle(cur, u, 'minedrop', bet, payout, 'win' if payout > 0 else 'lose', mult)
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'slot': idx, 'multiplier': mult, 'payout': payout, 'user': user_public(updated)})}

        # ── Блэкджек ────────────────────────────────────────────────
        if act == 'blackjack_deal':
            deck = list(range(52))
            cards = [secrets.choice(deck) for _ in range(4)]
            player = [cards[0], cards[2]]
            dealer = [cards[1], cards[3]]
            p_val = bj_value(player)
            d_val = bj_value(dealer)
            if p_val == 21:
                payout = int(bet * 2.5)  # blackjack 3:2
                updated = settle(cur, u, 'blackjack', bet, payout, 'blackjack', 2.5)
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                    'player': player, 'dealer': dealer, 'player_val': p_val, 'dealer_val': d_val,
                    'done': True, 'result': 'blackjack', 'payout': payout, 'user': user_public(updated)})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'player': player, 'dealer': dealer, 'player_val': p_val, 'dealer_val': bj_value([dealer[0]]),
                'done': False})}

        if act == 'blackjack_hit':
            player = body.get('player', [])
            new_card = secrets.randbelow(52)
            player.append(new_card)
            p_val = bj_value(player)
            if p_val > 21:
                updated = settle(cur, u, 'blackjack', bet, 0, 'bust', 0.0)
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                    'player': player, 'player_val': p_val, 'done': True,
                    'result': 'bust', 'payout': 0, 'user': user_public(updated)})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'player': player, 'player_val': p_val, 'done': False})}

        if act == 'blackjack_stand':
            player = body.get('player', [])
            dealer = body.get('dealer', [])
            p_val = bj_value(player)
            # дилер добирает до 17
            while bj_value(dealer) < 17:
                dealer.append(secrets.randbelow(52))
            d_val = bj_value(dealer)
            if d_val > 21 or p_val > d_val:
                payout = bet * 2
                res = 'win'
            elif p_val == d_val:
                payout = bet
                res = 'push'
            else:
                payout = 0
                res = 'lose'
            mult = payout / bet if bet else 0
            updated = settle(cur, u, 'blackjack', bet, payout, res, mult)
            add_tournament_score(cur, u['id'], 'Blackjack Чемпионат', payout)
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'player': player, 'dealer': dealer, 'player_val': p_val, 'dealer_val': d_val,
                'done': True, 'result': res, 'payout': payout, 'user': user_public(updated)})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown game'})}
    finally:
        cur.close()
        conn.close()


def bj_value(cards):
    RANKS = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]
    total = 0
    aces = 0
    for c in cards:
        rank = c % 13
        if rank == 0:
            aces += 1
            total += 11
        else:
            total += RANKS[rank] if rank < len(RANKS) else 10
    while total > 21 and aces:
        total -= 10
        aces -= 1
    return total


def seed_quests(cur, user_id):
    defaults = [('play', 5, 200), ('win', 3, 300), ('bet_big', 1, 150)]
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
