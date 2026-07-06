-- Таблица промокодов
CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    reward_type VARCHAR(20) NOT NULL DEFAULT 'balance', -- balance | discount
    reward_value INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Активированные промокоды пользователями
CREATE TABLE IF NOT EXISTS promo_redemptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    promo_id INTEGER NOT NULL REFERENCES promo_codes(id),
    redeemed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, promo_id)
);

-- Ежедневные бесплатные спины рулетки (за подписку на ТГ)
CREATE TABLE IF NOT EXISTS daily_spins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    spin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    prize_amount INTEGER NOT NULL DEFAULT 0,
    prize_label VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, spin_date)
);

-- Флаг подтверждения подписки на телеграм-канал
ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_subscribed BOOLEAN NOT NULL DEFAULT FALSE;

-- Флаг выдачи приветственного бонуса (на случай старых пользователей)
ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_bonus_given BOOLEAN NOT NULL DEFAULT FALSE;

-- Стартовые промокоды
INSERT INTO promo_codes (code, reward_type, reward_value)
SELECT 'irrilevanttop', 'balance', 7000
WHERE NOT EXISTS (SELECT 1 FROM promo_codes WHERE code = 'irrilevanttop');

INSERT INTO promo_codes (code, reward_type, reward_value)
SELECT 'plazmacoin', 'balance', 9000
WHERE NOT EXISTS (SELECT 1 FROM promo_codes WHERE code = 'plazmacoin');

INSERT INTO promo_codes (code, reward_type, reward_value)
SELECT 'freeirrilevant', 'discount', 50
WHERE NOT EXISTS (SELECT 1 FROM promo_codes WHERE code = 'freeirrilevant');

-- Обнуление статистики (ставок, выплат, крупного выигрыша) — очищаем историю игр
UPDATE users SET total_wagered = 0, total_won = 0;
UPDATE game_history SET bet = 0, payout = 0 WHERE 1=1;