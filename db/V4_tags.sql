-- TAGS TABLE (distinct tag names)
CREATE TABLE tags
(
    id   BIGINT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- BOOK-TAGS RELATIONSHIP TABLE (many-to-many)
CREATE TABLE book_tags
(
    book_id BIGINT REFERENCES books (id) ON DELETE CASCADE,
    tag_id  BIGINT REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, tag_id)
);
