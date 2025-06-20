// repository/BooksRepository.ts

import Book from "../model/Book";
import DatabaseService from "../service/DatabaseService";
import { RowDataPacket } from "mysql2";

interface ReadingList extends RowDataPacket {
  book_id: number;
  last_read_chapter_id: number;
  last_read_chapter_title: string;
  last_read_chapter_number: number;
  last_chapter_id: number;
  last_chapter_title: string;
  last_chapter_number: number;
  last_chapter_created_at: string;
}

export interface IBooksRepository {
  searchBooks(): Promise<Book[]>;

  createChapter(
    bookId: number,
    title: string,
    content: string,
    chapterNumber?: number
  ): Promise<void>;

  fetchReadingList(userId: string): Promise<
    {
      bookId: number;
      lastReadChapter: {
        id: number;
        title: string;
        chapterNumber: number;
      };
      lastChapter: {
        id: number;
        title: string;
        chapterNumber: number;
        createdAt: string;
      };
    }[]
  >;

  userExists(userId: string): Promise<boolean>;
}

export default class BooksRepositoryImpl implements IBooksRepository {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async createChapter(
    bookId: number,
    title: string,
    content: string,
    chapterNumber?: number
  ): Promise<void> {
    if (!bookId || !title || !content) {
      return Promise.reject(
        new Error("bookId, title, and content are required to create a chapter")
      );
    }
    const connection = this.db.getConnection();

    if (!chapterNumber) {
      interface MaxChapterNumberResult extends RowDataPacket {
        maxChapterNumber: number | null;
      }
      // If chapterNumber is not provided, set it to the next available number
      const [rows] = await connection.query<MaxChapterNumberResult[]>(
        `
          SELECT MAX(chapter_number) AS maxChapterNumber
          FROM chapters
          WHERE book_id = ?
      `,
        [bookId]
      );

      const maxChapterNumber = rows[0].maxChapterNumber || 0;
      chapterNumber = maxChapterNumber + 1;
    } else {
      // update all chapters after the given chapterNumber if they exists
      await connection.execute(
        `
          UPDATE chapters
          SET chapter_number = chapter_number + 1
          WHERE book_id = ?
            AND chapter_number >= ?
      `,
        [bookId, chapterNumber]
      );
    }

    await connection.execute(
      `
        INSERT INTO chapters (book_id, title, content, chapter_number)
        VALUES (?, ?, ?, ?)
    `,
      [bookId, title, content, chapterNumber]
    );
  }

  async searchBooks(): Promise<Book[]> {
    const [results] = await this.db.getConnection().query<Book[]>(`
        SELECT books.*,
               COALESCE(json_agg(DISTINCT tags.*), '[]')     AS tags,
               COALESCE(json_agg(DISTINCT chapters.*), '[]') AS chapters
        FROM books
        LEFT JOIN book_tags
                      ON book_tags.book_id = books.id
        LEFT JOIN tags
                      ON tags.id = book_tags.tag_id
        LEFT JOIN chapters
                      ON chapters.book_id = books.id
        GROUP BY books.*
    `);
    return results as Book[];
  }

  async fetchReadingList(userId: string) {
    const [rows] = await this.db.getConnection().query<ReadingList[]>(
      `
        SELECT rp.book_id,
               last_read_chapter.id             AS last_read_chapter_id,
               last_read_chapter.title          AS last_read_chapter_title,
               last_read_chapter.chapter_number AS last_read_chapter_number,
               last_chapter.id                  AS last_chapter_id,
               last_chapter.title               AS last_chapter_title,
               last_chapter.chapter_number      AS last_chapter_number,
               last_chapter.created_at          AS last_chapter_created_at
        FROM reading_progress rp
        LEFT JOIN chapters    last_read_chapter
                      ON rp.last_read_chapter_id = last_read_chapter.id
        LEFT JOIN (
                      SELECT c1.*
                      FROM chapters    c1
                      INNER JOIN (
                                     SELECT book_id, MAX(created_at) AS max_created
                                     FROM chapters
                                     GROUP BY book_id
                                     ) c2
                                     ON c1.book_id = c2.book_id AND c1.created_at = c2.max_created
                      )       last_chapter
                      ON rp.book_id = last_chapter.book_id
        WHERE rp.user_id = ?
        ORDER BY last_chapter.created_at DESC
    `,
      [userId]
    );

    return rows.map((row) => ({
      bookId: row.book_id,
      lastReadChapter: {
        id: row.last_read_chapter_id,
        title: row.last_read_chapter_title,
        chapterNumber: row.last_read_chapter_number,
      },
      lastChapter: {
        id: row.last_chapter_id,
        title: row.last_chapter_title,
        chapterNumber: row.last_chapter_number,
        createdAt: row.last_chapter_created_at,
      },
    }));
  }

  async userExists(userId: string): Promise<boolean> {
    if (!userId) {
      return Promise.reject(
        new Error("userId is required to check user existence")
      );
    }

    const connection = this.db.getConnection();
    interface Result extends RowDataPacket {
      count: number;
    }
    const [rows] = await connection.query<Result[]>(
      `
        SELECT COUNT(*) AS count
        FROM users
        WHERE id = ?
    `,
      [userId]
    );

    return rows[0].count > 0;
  }
}
