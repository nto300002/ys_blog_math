-- フォルダ
CREATE TABLE IF NOT EXISTS folders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  parent_id  INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 記事
CREATE TABLE IF NOT EXISTS articles (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  folder_id  INTEGER REFERENCES folders(id) ON DELETE SET NULL,
  title      TEXT    NOT NULL,
  slug       TEXT    UNIQUE NOT NULL,
  content    TEXT    NOT NULL DEFAULT '',
  status     TEXT    NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- updated_at 自動更新トリガー
CREATE TRIGGER IF NOT EXISTS articles_updated_at
AFTER UPDATE ON articles
BEGIN
  UPDATE articles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
