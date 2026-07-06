import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
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


def hash_pw(pw: str) -> str:
    return hashlib.sha256(('irk_salt_' + pw).encode()).hexdigest()


LEVELS = [
    (0,      0,   'Новобранец'), (500,    0,   'Игрок'), (1500,   2,   'Опытный'),
    (3000,   3,   'Ветеран'), (6000,   5,   'Мастер'), (10000,  7,   'Элита'),
    (18000,  8,   'Чемпион'), (30000,  10,  'Легенда'), (50000,  12,  'Эксперт'),
    (80000,  13,  'Профессионал'), (120000, 15,  'Гроссмейстер'), (180000, 16,  'Вице-король'),
    (260000, 17,  'Король'), (360000, 18,  'Граф'), (500000, 19,  'Герцог'),
    (700000, 20,  'Принц'), (1000000,21,  'Элитный'), (1500000,22,  'Премиум'),
    (2200000,23,  'VIP-Про'), (3000000,25,  'Бессмертный'),
]


def get_level_idx(xp):
    idx = 0
    for i, (threshold, _, _) in enumerate(LEVELS):
        if xp >= threshold:
            idx = i
    return idx


def user_public(u: dict) -> dict:
    lvl_info = LEVELS[get_level_idx(u['xp'])]
    return {
        'id': u['id'], 'player_id': u.get('player_id') or str(u['id']),
        'email': u['email'], 'nickname': u['nickname'],
        'balance': u['balance'], 'xp': u['xp'], 'level': u['level'],
        'level_name': lvl_info[2], 'level_discount': lvl_info[1],
        'vip_level': u['vip_level'], 'role': u['role'], 'is_owner': u['is_owner'],
        'total_wagered': u['total_wagered'], 'total_won': u['total_won'],
        'games_played': u['games_played'],
    }


def get_user_by_token(cur, token: str):
    cur.execute(
        "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id "
        "WHERE s.token = %s AND s.expires_at > NOW()", (token,))
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    '''Регистрация, вход и получение профиля игрока Irrelevant Kazino'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        headers = event.get('headers', {})
        token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
        params = event.get('queryStringParameters') or {}
        action = params.get('action', '')

        if method == 'GET' and action == 'me':
            if not token:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'no token'})}
            u = get_user_by_token(cur, token)
            if not u:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'invalid token'})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user_public(u)})}

        body = json.loads(event.get('body') or '{}')
        act = body.get('action')

        if act == 'register':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            nickname = (body.get('nickname') or '').strip() or email.split('@')[0]
            if not email or len(password) < 4:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Некорректные данные'})}

            cur.execute("SELECT id, password_hash, is_owner FROM users WHERE email = %s", (email,))
            existing = cur.fetchone()
            if existing and existing['password_hash'] != 'PENDING_FIRST_LOGIN':
                return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Email уже занят'})}

            if existing:
                cur.execute(
                    "UPDATE users SET password_hash = %s, nickname = %s, last_login = NOW(), "
                    "balance = balance + 50000, welcome_bonus_given = TRUE WHERE id = %s RETURNING *",
                    (hash_pw(password), nickname, existing['id']))
            else:
                cur.execute(
                    "INSERT INTO users (email, password_hash, nickname, last_login, balance, welcome_bonus_given) "
                    "VALUES (%s, %s, %s, NOW(), 51000, TRUE) RETURNING *",
                    (email, hash_pw(password), nickname))
            u = cur.fetchone()
            cur.execute(
                "INSERT INTO transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                (u['id'], 50000, 'welcome_bonus', 'Приветственный бонус за регистрацию'))

            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                        (u['id'], new_token, datetime.utcnow() + timedelta(days=30)))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'token': new_token, 'user': user_public(u)})}

        if act == 'login':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            u = cur.fetchone()
            if not u or u['password_hash'] != hash_pw(password):
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный email или пароль'})}
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                        (u['id'], new_token, datetime.utcnow() + timedelta(days=30)))
            cur.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (u['id'],))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'token': new_token, 'user': user_public(u)})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown action'})}
    finally:
        cur.close()
        conn.close()