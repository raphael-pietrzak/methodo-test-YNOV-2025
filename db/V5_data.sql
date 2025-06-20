-- 1 Writer
INSERT INTO users (id, email, password_hash, role)
VALUES (1, 'writer1@example.com', 'hashedpassword123', 'writer');

-- 2 Readers
INSERT INTO users (id, email, password_hash, role)
VALUES (2, 'reader1@example.com', 'hashedpassword123', 'reader'),
       (3, 'reader2@example.com', 'hashedpassword123', 'reader');
-- 2 Books created by writer1
INSERT INTO books (id, title, description, author_id)
VALUES (1, 'The Rise of the Phoenix', 'An epic tale of rebirth and vengeance.', 1),
       (2, 'Fanfic: Hogwarts Reborn', 'A modern take on the magical world.', 1);
-- Chapters for Book 1
INSERT INTO chapters (id, book_id, title, content, chapter_number)
VALUES (1, 1, 'Chapter 1: Ashes', 'Content of chapter 1...', 1),
       (2, 1, 'Chapter 2: Embers', 'Content of chapter 2...', 2);

-- Chapters for Book 2
INSERT INTO chapters (id, book_id, title, content, chapter_number)
VALUES (3, 2, 'Chapter 1: Sorting Again', 'Content of chapter 1...', 1),
       (4, 2, 'Chapter 2: Secrets of the Castle', 'Content of chapter 2...', 2),
       (5, 2, 'Chapter 3: Let it go', 'Content of chapter 3...', 2);

-- Reader1 is reading Book 1 and stopped at Chapter 2
INSERT INTO reading_progress (id, user_id, book_id, last_read_chapter_id)
VALUES (1, 2, 1, 2);

-- Reader2 is reading Book 2 and stopped at Chapter 1
INSERT INTO reading_progress (id, user_id, book_id, last_read_chapter_id)
VALUES (2, 3, 2, 3);

-- Insert tags (avoid duplicates using ON CONFLICT)
INSERT INTO tags (name)
VALUES ('magic'),
       ('adventure'),
       ('drama');

-- Link tags to the book
INSERT INTO book_tags (book_id, tag_id)
SELECT 1, id
FROM tags
WHERE name IN ('magic', 'adventure', 'drama');
