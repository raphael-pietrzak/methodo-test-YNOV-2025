// router.ts

import * as express from "express";
import BooksRepositoryImpl, {
  IBooksRepository,
} from "./repository/BooksRepository";

import DatabaseService from "./service/DatabaseService";
import { RowDataPacket } from "mysql2";
import Chapter from "./model/Chapter";

export default class Router {
  private booksRepository: IBooksRepository;
  private app: express.Express;

  constructor(app: express.Express) {
    const db = new DatabaseService();
    this.booksRepository = new BooksRepositoryImpl(db);
    this.app = app;
  }

  init() {
    this.app.use(express.json());
    return this;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // remove punctuation
      .split(/\s+/) // split on whitespace
      .filter(Boolean); // remove empty tokens
  }

  private scoreTokenizedMatch(
    text: string,
    tokenizedSearchText: string[]
  ): number {
    const textTokens = this.tokenize(text);

    let score = 0;

    for (const queryToken of tokenizedSearchText) {
      for (const textToken of textTokens) {
        if (queryToken === textToken) {
          score += 3; // exact match
          break; // skip to next queryToken
        } else if (textToken.includes(queryToken)) {
          score += 1; // partial match
        }
      }
    }

    return score;
  }

  setupRoutes() {
    this.app.get(
      "/books/search",
      async (req: express.Request, res: express.Response) => {
        const searchText = ((req.query.query as string) || "")
          .toLowerCase()
          .trim();

        const tokenizedSearchText = this.tokenize(searchText);

        if (!searchText) {
          res.status(400).json({ error: "Missing search query" });
          return;
        }

        try {
          // 1. Load books with tags and chapters
          const rawBooks = await this.booksRepository.searchBooks();

          // 2. Process and score each book
          const scoredBooks = rawBooks.map((book) => {
            const tags = Array.isArray(book.tags)
              ? book.tags
              : JSON.parse(book.tags);
            const chapters = Array.isArray(book.chapters)
              ? book.chapters
              : JSON.parse(book.chapters);

            let score =
              this.scoreTokenizedMatch(book.title, tokenizedSearchText) * 4 +
              this.scoreTokenizedMatch(book.description, tokenizedSearchText) *
                3 +
              tags.reduce((acc, tag) => {
                return (
                  acc +
                  this.scoreTokenizedMatch(tag.name, tokenizedSearchText) * 5
                );
              }, 0) +
              chapters.reduce((acc, chapter) => {
                return (
                  acc +
                  this.scoreTokenizedMatch(chapter.title, tokenizedSearchText) *
                    2 +
                  this.scoreTokenizedMatch(chapter.content, tokenizedSearchText)
                );
              }, 0);

            return { ...book, relevanceScore: score };
          });

          // 3. Filter and sort
          const filtered = scoredBooks
            .filter((b) => b.relevanceScore > 0)
            .sort((a, b) => b.relevanceScore - a.relevanceScore);

          // 4. Return top 50 results
          res.json(filtered.slice(0, 50)); // limit top 50
        } catch (err) {
          console.error("Search error:", err);
          res.status(500).json({ error: "Failed to search books" });
        }
      }
    );

    this.app.post(
      "/book/:bookId/chapter",
      async (req: express.Request, res: express.Response) => {
        const bookId = Number.parseInt(req.params.bookId);
        let { title, content, chapterNumber } = req.body;

        try {
          await this.booksRepository.createChapter(
            bookId,
            title,
            content,
            chapterNumber
          );
          res.status(201).json({ message: "Chapter added successfully" });
        } catch (err) {
          console.error("Error adding chapter:", err);
          res.status(500).json({ error: "Failed to add chapter" });
        }
      }
    );

    this.app.get(
      "books/:bookId/last-read-chapter",
      async (req: express.Request, res: express.Response) => {
        const bookId = req.params.bookId;

        const { userId } = req.body;

        if (!bookId) {
          res.status(400).json({ error: "Missing book ID" });
          return;
        }

        try {
          const db = new DatabaseService();
          const connection = db.getConnection();

          interface LastChapterReadResult extends RowDataPacket {
            maxChapterNumber: number | null;
          }

          const [readingProgressRows] = await connection.query<
            LastChapterReadResult[]
          >(
            `
            SELECT last_read_chapter_id
            FROM reading_progress
            WHERE book_id = ?
              AND user_id = ?
        `,
            [bookId, userId]
          );

          if (readingProgressRows.length === 0) {
            // fetch the first chapter if no last read chapter is found
            const [firstChapterRows] = await connection.query<Chapter[]>(
              `
              SELECT chapters.*
              FROM chapters
              WHERE book_id = ?
              ORDER BY chapter_number ASC
              LIMIT 1
          `,
              [bookId]
            );
            res.json(firstChapterRows[0]);
            return;
          }

          // Fetch the last read chapter details
          const [lastChapterReadRow] = await connection.query<Chapter[]>(
            `
            SELECT chapters.*
            FROM chapters
            WHERE id = ?
        `,
            [readingProgressRows[0].last_read_chapter_id]
          );

          if (lastChapterReadRow.length === 0) {
            res.status(404).json({ error: "No chapters found for this book" });
            return;
          }

          res.json(lastChapterReadRow[0]);
        } catch (err) {
          console.error("Error fetching last read chapter:", err);
          res.status(500).json({ error: "Failed to fetch last read chapter" });
        }
      }
    );

    this.app.get(
      "users/:userId/reading-list",
      async (req: express.Request, res: express.Response) => {
        const userId = req.params.userId;
        try {
          const readingList = await this.booksRepository.fetchReadingList(
            userId
          );
          res.json(readingList);
        } catch (err) {
          console.error("Error fetching reading progress:", err);
          res.status(500).json({ error: "Failed to fetch reading progress" });
        }
      }
    );

    this.app.get(
      "/books/:bookId/chapter/:chapterId",
      async (req: express.Request, res: express.Response) => {
        const bookId = req.params.bookId;
        const chapterId = req.params.chapterId;
        const userId = req.query.userId as string;

        if (!bookId || !chapterId || !userId) {
          res
            .status(400)
            .json({ error: "Missing book ID or chapter ID or user ID" });
          return;
        }

        try {
          const db = new DatabaseService();
          const connection = db.getConnection();

          const [chapterRows] = await connection.query<Chapter[]>(
            `
            SELECT *
            FROM chapters
            WHERE book_id = ?
              AND id = ?
        `,
            [bookId, chapterId]
          );

          if (chapterRows.length === 0) {
            res.status(404).json({ error: "Chapter not found" });
            return;
          }

          await connection.execute(
            `
            INSERT INTO reading_progress (user_id, book_id, last_read_chapter_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE last_read_chapter_id = ?, updated_at = CURRENT_TIMESTAMP()
        `,
            [userId, bookId, chapterId, chapterId]
          );

          res.json(chapterRows[0]);
        } catch (err) {
          console.error("Error fetching chapter:", err);
          res.status(500).json({ error: "Failed to fetch chapter" });
        }
      }
    );
  }
}
