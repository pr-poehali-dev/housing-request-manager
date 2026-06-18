
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('resident', 'dispatcher', 'master')),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE requests (
  id SERIAL PRIMARY KEY,
  resident_id INTEGER NOT NULL REFERENCES users(id),
  master_id INTEGER REFERENCES users(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'done', 'waiting')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE request_history (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id),
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: диспетчер по умолчанию (пароль: dispatcher123)
INSERT INTO users (name, phone, password_hash, role)
VALUES ('Диспетчер', '+70000000001', 'ef92b778bafe771207e01c3d0db879f2b9c38eec76dc61a5ee2b3c2b29e4f59e', 'dispatcher');

-- Seed: мастер по умолчанию (пароль: master123)
INSERT INTO users (name, phone, password_hash, role)
VALUES ('Петров Иван', '+70000000002', '482c811da5d5b4bc6d497ffa98491e38b85e56cbcb75eb06eb9e6b8b9cfef82f', 'master');
