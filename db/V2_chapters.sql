CREATE TABLE chapters
(
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    title          VARCHAR(255) NOT NULL,
    content        TEXT         NOT NULL,
    chapter_number INT          NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_chapter_per_book UNIQUE (book_id, chapter_number)
);
