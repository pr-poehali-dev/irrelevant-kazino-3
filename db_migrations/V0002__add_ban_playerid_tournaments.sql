-- Бан игрока
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

-- Уникальный игровой ID (6-значный)
ALTER TABLE users ADD COLUMN IF NOT EXISTS player_id VARCHAR(10) UNIQUE;

-- Проставим player_id для уже существующих пользователей
UPDATE users SET player_id = LPAD(id::text, 6, '0') WHERE player_id IS NULL;

-- Новые турниры по Blackjack и Crash
INSERT INTO tournaments (title, description, prize_pool, status)
SELECT 'Blackjack Чемпионат', 'Набирай очки в блэкджеке', 40000, 'active'
WHERE NOT EXISTS (SELECT 1 FROM tournaments WHERE title = 'Blackjack Чемпионат');

INSERT INTO tournaments (title, description, prize_pool, status)
SELECT 'Crash Лига', 'Самые высокие множители', 35000, 'active'
WHERE NOT EXISTS (SELECT 1 FROM tournaments WHERE title = 'Crash Лига');