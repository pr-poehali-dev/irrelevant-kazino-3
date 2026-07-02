CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    balance BIGINT NOT NULL DEFAULT 1000,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    vip_level INTEGER NOT NULL DEFAULT 0,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    total_wagered BIGINT NOT NULL DEFAULT 0,
    total_won BIGINT NOT NULL DEFAULT 0,
    games_played INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

CREATE TABLE IF NOT EXISTS game_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    game VARCHAR(50) NOT NULL,
    bet BIGINT NOT NULL,
    payout BIGINT NOT NULL,
    result VARCHAR(20) NOT NULL,
    multiplier NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_history_user ON game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created ON game_history(created_at);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id);

CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    code VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, code)
);

CREATE TABLE IF NOT EXISTS daily_quests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    code VARCHAR(50) NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    goal INTEGER NOT NULL,
    reward INTEGER NOT NULL,
    claimed BOOLEAN NOT NULL DEFAULT FALSE,
    quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(user_id, code, quest_date)
);

CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    prize_pool BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tournament_players (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    score BIGINT NOT NULL DEFAULT 0,
    UNIQUE(tournament_id, user_id)
);

INSERT INTO users (email, password_hash, nickname, role, is_owner, balance)
SELECT 'irrilevanta@gmail.com', 'PENDING_FIRST_LOGIN', 'Owner', 'admin', TRUE, 100000
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'irrilevanta@gmail.com');

INSERT INTO tournaments (title, description, prize_pool, status)
SELECT 'Неоновый Кубок', 'Крутите слоты и набирайте очки', 50000, 'active'
WHERE NOT EXISTS (SELECT 1 FROM tournaments WHERE title = 'Неоновый Кубок');
INSERT INTO tournaments (title, description, prize_pool, status)
SELECT 'Crash Мастера', 'Максимальный множитель побеждает', 30000, 'active'
WHERE NOT EXISTS (SELECT 1 FROM tournaments WHERE title = 'Crash Мастера');
INSERT INTO tournaments (title, description, prize_pool, status)
SELECT 'Ночь Минёра', 'Больше всего выигрышей в Минёре', 20000, 'active'
WHERE NOT EXISTS (SELECT 1 FROM tournaments WHERE title = 'Ночь Минёра');