INSERT OR IGNORE INTO users (id, email, role, password_hash)
VALUES ('u_admin', 'admin@example.com', 'admin', 'REPLACE_WITH_BCRYPT_HASH');

INSERT OR IGNORE INTO authors (id, name, bio)
VALUES ('a_default', '기본 작성자', '초기 마이그레이션용 작성자');

INSERT OR IGNORE INTO categories (id, slug, name)
VALUES
  ('c_news', 'news', '메인 뉴스'),
  ('c_photo', 'photo-news', '포토 뉴스');

INSERT OR IGNORE INTO pages (id, slug, title, content_html, published_at)
VALUES
  ('p_about', 'about', 'About', '<p>About 페이지 내용을 입력하세요.</p>', CURRENT_TIMESTAMP),
  ('p_contact', 'contact', 'Contact', '<p>Contact 페이지 내용을 입력하세요.</p>', CURRENT_TIMESTAMP);
