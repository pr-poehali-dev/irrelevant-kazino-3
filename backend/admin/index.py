import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_admin(cur, token):
    if not token:
        return None
    cur.execute(
        "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id "
        "WHERE s.token = %s AND s.expires_at > NOW()", (token,))
    u = cur.fetchone()
    if not u or u['role'] != 'admin':
        return None
    return u


def handler(event: dict, context) -> dict:
    '''Административная панель Irrelevant Kazino: бан, баланс, роли, турниры, статистика.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        headers = event.get('headers', {})
        token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
        admin = get_admin(cur, token)
        if not admin:
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Доступ запрещён'})}

        params = event.get('queryStringParameters') or {}

        if method == 'GET':
            action = params.get('action', 'users')
            if action == 'users':
                q = (params.get('q') or '').strip().lower()
                if q:
                    like = '%' + q + '%'
                    cur.execute(
                        "SELECT id, player_id, email, nickname, balance, role, is_owner, is_banned, "
                        "vip_level, level, total_wagered, total_won, games_played, created_at FROM users "
                        "WHERE LOWER(email) LIKE %s OR LOWER(nickname) LIKE %s OR player_id LIKE %s "
                        "ORDER BY id LIMIT 100",
                        (like, like, like))
                else:
                    cur.execute(
                        "SELECT id, player_id, email, nickname, balance, role, is_owner, is_banned, "
                        "vip_level, level, total_wagered, total_won, games_played, created_at "
                        "FROM users ORDER BY id LIMIT 100")
                rows = cur.fetchall()
                for r in rows:
                    r['created_at'] = r['created_at'].isoformat() if r['created_at'] else None
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': rows})}

            if action == 'overview':
                cur.execute("SELECT COUNT(*) c FROM users")
                total = cur.fetchone()['c']
                cur.execute("SELECT COUNT(*) c FROM users WHERE is_banned=TRUE")
                banned = cur.fetchone()['c']
                cur.execute("SELECT COALESCE(SUM(balance),0) s FROM users WHERE is_banned=FALSE")
                circ = cur.fetchone()['s']
                cur.execute("SELECT COUNT(*) c FROM game_history")
                games = cur.fetchone()['c']
                cur.execute("SELECT COALESCE(SUM(bet),0) b, COALESCE(SUM(payout),0) p FROM game_history")
                gg = cur.fetchone()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                    'total_users': total, 'banned_users': banned,
                    'circulating': int(circ), 'total_games': games,
                    'total_bet': int(gg['b']), 'total_payout': int(gg['p'])})}

            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown'})}

        body = json.loads(event.get('body') or '{}')
        act = body.get('action')
        target_id = body.get('user_id')

        if act == 'add_balance':
            amount = int(body.get('amount', 0))
            cur.execute("UPDATE users SET balance=balance+%s WHERE id=%s RETURNING balance, nickname", (amount, target_id))
            row = cur.fetchone()
            cur.execute("INSERT INTO transactions (user_id, amount, type, description) VALUES (%s,%s,%s,%s)",
                        (target_id, amount, 'topup', 'Начисление Plazma (обмен в ТГ)'))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'ok': True, 'balance': row['balance'], 'nickname': row['nickname']})}

        if act == 'sub_balance':
            amount = int(body.get('amount', 0))
            cur.execute("SELECT balance FROM users WHERE id=%s", (target_id,))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Не найден'})}
            new_bal = max(0, row['balance'] - amount)
            cur.execute("UPDATE users SET balance=%s WHERE id=%s RETURNING balance", (new_bal, target_id))
            nb = cur.fetchone()
            cur.execute("INSERT INTO transactions (user_id, amount, type, description) VALUES (%s,%s,%s,%s)",
                        (target_id, -amount, 'admin_sub', 'Снятие баланса админом'))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'balance': nb['balance']})}

        if act == 'set_ban':
            if admin['is_owner'] is False and not admin['role'] == 'admin':
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет прав'})}
            cur.execute("SELECT is_owner FROM users WHERE id=%s", (target_id,))
            tgt = cur.fetchone()
            if tgt and tgt['is_owner']:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нельзя банить владельца'})}
            banned = bool(body.get('banned', True))
            cur.execute("UPDATE users SET is_banned=%s WHERE id=%s", (banned, target_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'banned': banned})}

        if act == 'set_role':
            if not admin['is_owner']:
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Только владелец выдаёт админку'})}
            role = body.get('role')
            if role not in ('user', 'admin'):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'bad role'})}
            cur.execute("SELECT is_owner FROM users WHERE id=%s", (target_id,))
            tgt = cur.fetchone()
            if tgt and tgt['is_owner']:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нельзя менять роль владельца'})}
            cur.execute("UPDATE users SET role=%s WHERE id=%s", (role, target_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if act == 'set_vip':
            vip = int(body.get('vip_level', 0))
            cur.execute("UPDATE users SET vip_level=%s WHERE id=%s", (max(0, min(5, vip)), target_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if act == 'create_tournament':
            cur.execute("INSERT INTO tournaments (title, description, prize_pool, status) VALUES (%s,%s,%s,'active')",
                        (body.get('title'), body.get('description'), int(body.get('prize_pool', 0))))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown action'})}
    finally:
        cur.close()
        conn.close()
