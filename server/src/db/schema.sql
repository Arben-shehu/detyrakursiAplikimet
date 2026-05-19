-- =====================================================================
-- IQ Tester - Skema e Databazes (idempotente)
-- Mund te ekzekutohet shume here pa humbur te dhenat ekzistuese.
-- Per nje reset te plote (humbet te gjitha te dhenat) perdor reset.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  username       VARCHAR(50)  UNIQUE NOT NULL,
  email          VARCHAR(120) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20)  NOT NULL DEFAULT 'user',
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(80) UNIQUE NOT NULL,
  description  TEXT
);

CREATE TABLE IF NOT EXISTS questions (
  id           SERIAL PRIMARY KEY,
  category_id  INT REFERENCES categories(id) ON DELETE CASCADE,
  text         TEXT NOT NULL,
  difficulty   INT  NOT NULL DEFAULT 1,
  image_svg    TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS options (
  id           SERIAL PRIMARY KEY,
  question_id  INT  REFERENCES questions(id) ON DELETE CASCADE,
  text         TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE,
  image_svg    TEXT
);

CREATE TABLE IF NOT EXISTS attempts (
  id               SERIAL PRIMARY KEY,
  user_id          INT REFERENCES users(id) ON DELETE CASCADE,
  started_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at      TIMESTAMP,
  score            INT,
  total_questions  INT NOT NULL DEFAULT 20,
  mode             VARCHAR(20) NOT NULL DEFAULT 'real'
);

CREATE TABLE IF NOT EXISTS answers (
  id                  SERIAL PRIMARY KEY,
  attempt_id          INT REFERENCES attempts(id) ON DELETE CASCADE,
  question_id         INT REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id  INT REFERENCES options(id)   ON DELETE SET NULL,
  is_correct          BOOLEAN
);

-- Migrations idempotente: kolonat e reja para constraints
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_svg TEXT;
ALTER TABLE options   ADD COLUMN IF NOT EXISTS image_svg TEXT;
ALTER TABLE attempts  ADD COLUMN IF NOT EXISTS mode VARCHAR(20) NOT NULL DEFAULT 'real';

-- Riemertim i kategorise 'Verbale' -> 'Gjuhesore' (idempotent)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM categories WHERE name = 'Verbale')
     AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Gjuhesore') THEN
    UPDATE categories SET name = 'Gjuhesore' WHERE name = 'Verbale';
  END IF;
END $$;

-- Idempotent constraints (vetem nese mungojne)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'answers_attempt_question_unique') THEN
    ALTER TABLE answers ADD CONSTRAINT answers_attempt_question_unique UNIQUE (attempt_id, question_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_role') THEN
    ALTER TABLE users ADD CONSTRAINT chk_role CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_difficulty') THEN
    ALTER TABLE questions ADD CONSTRAINT chk_difficulty CHECK (difficulty BETWEEN 1 AND 5);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_mode') THEN
    ALTER TABLE attempts ADD CONSTRAINT chk_mode CHECK (mode IN ('real', 'practice'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_options_question   ON options(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user      ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_mode      ON attempts(mode);
CREATE INDEX IF NOT EXISTS idx_answers_attempt    ON answers(attempt_id);
