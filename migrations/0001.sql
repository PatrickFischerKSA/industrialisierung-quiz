PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS classes (
 code TEXT PRIMARY KEY,
 label TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 closed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS attempts (
 id TEXT PRIMARY KEY,
 class_code TEXT NOT NULL REFERENCES classes(code) ON DELETE CASCADE,
 alias TEXT NOT NULL,
 token_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS attempts_class ON attempts(class_code);
CREATE TABLE IF NOT EXISTS answers (
 attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
 question INTEGER NOT NULL CHECK(question BETWEEN 0 AND 7),
 choice INTEGER NOT NULL CHECK(choice BETWEEN 0 AND 3),
 answered_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(attempt_id, question)
);
