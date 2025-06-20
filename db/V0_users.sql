CREATE TABLE users
(
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email         VARCHAR(255) UNIQUE                              NOT NULL,
    password_hash TEXT                                             NOT NULL,
    role          VARCHAR(10) CHECK (role IN ('reader', 'writer')) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
