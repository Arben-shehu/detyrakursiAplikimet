-- =====================================================================
-- IQ Tester - Skema e Databazes
-- Ekzekutoje kete file ne pgAdmin (Query Tool) pasi te kesh krijuar
-- nje databaze te re (p.sh. "iq_tester") dhe te jesh lidhur ne te.
-- =====================================================================

DROP TABLE IF EXISTS answers     CASCADE;
DROP TABLE IF EXISTS attempts    CASCADE;
DROP TABLE IF EXISTS options     CASCADE;
DROP TABLE IF EXISTS questions   CASCADE;
DROP TABLE IF EXISTS categories  CASCADE;
DROP TABLE IF EXISTS users       CASCADE;

-- ---------------------------------------------------------------------
-- users: perdoruesit e sistemit (admin + user normal)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id             SERIAL PRIMARY KEY,
  username       VARCHAR(50)  UNIQUE NOT NULL,
  email          VARCHAR(120) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20)  NOT NULL DEFAULT 'user',
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_role CHECK (role IN ('user', 'admin'))
);

-- ---------------------------------------------------------------------
-- categories: kategoria e nje pyetjeje (p.sh. Logjike, Matematike)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(80) UNIQUE NOT NULL,
  description  TEXT
);

-- ---------------------------------------------------------------------
-- questions: vete pyetjet
-- ---------------------------------------------------------------------
CREATE TABLE questions (
  id           SERIAL PRIMARY KEY,
  category_id  INT REFERENCES categories(id) ON DELETE CASCADE,
  text         TEXT NOT NULL,
  difficulty   INT  NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_difficulty CHECK (difficulty BETWEEN 1 AND 5)
);

-- ---------------------------------------------------------------------
-- options: opsionet per cdo pyetje (1 ose me shume sakte)
-- ---------------------------------------------------------------------
CREATE TABLE options (
  id           SERIAL PRIMARY KEY,
  question_id  INT  REFERENCES questions(id) ON DELETE CASCADE,
  text         TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE
);

-- ---------------------------------------------------------------------
-- attempts: nje tentative testi nga nje user
-- ---------------------------------------------------------------------
CREATE TABLE attempts (
  id               SERIAL PRIMARY KEY,
  user_id          INT REFERENCES users(id) ON DELETE CASCADE,
  started_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at      TIMESTAMP,
  score            INT,
  total_questions  INT NOT NULL DEFAULT 20
);

-- ---------------------------------------------------------------------
-- answers: pergjigjet konkrete per cdo pyetje brenda nje tentative
-- ---------------------------------------------------------------------
CREATE TABLE answers (
  id                  SERIAL PRIMARY KEY,
  attempt_id          INT REFERENCES attempts(id) ON DELETE CASCADE,
  question_id         INT REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id  INT REFERENCES options(id)   ON DELETE SET NULL,
  is_correct          BOOLEAN,
  UNIQUE (attempt_id, question_id)
);

-- ---------------------------------------------------------------------
-- Indekse per performance
-- ---------------------------------------------------------------------
CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_options_question   ON options(question_id);
CREATE INDEX idx_attempts_user      ON attempts(user_id);
CREATE INDEX idx_answers_attempt    ON answers(attempt_id);
