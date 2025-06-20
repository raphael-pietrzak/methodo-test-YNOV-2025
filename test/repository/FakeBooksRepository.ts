// test/repository/FakeBooksRepository.ts

import Book from "../../src/model/Book";
import {IBooksRepository} from "../../src/repository/BooksRepository";
import Chapter from "../../src/model/Chapter";

export default class FakeBooksRepository implements IBooksRepository {
  private books: Book[] = [];
  private chapters: Chapter[] = [];
  private readingList: any[] = [];

  async searchBooks(): Promise<Book[]> {
    return Promise.resolve(this.books);
  }

  async createChapter(bookId: number, title: string, content: string, chapterNumber?: number): Promise<void> {
    this.chapters.push({
      // Simulating a RowDataPacket structure
      constructor: {
        name: 'RowDataPacket'
      },
      book_id: bookId,
      title,
      content,
      chapter_number: chapterNumber,
      id: Math.floor(Math.random() * 1000) + 1,
      created_at: new Date().toISOString()
    });
  }

  async fetchReadingList(userId: string): Promise<any[]> {
    return this.readingList.filter(item => item.userId === userId);
  }

  async userExists(userId: string): Promise<boolean> {
    return this.readingList.some(item => item.userId === userId);
  }
}
