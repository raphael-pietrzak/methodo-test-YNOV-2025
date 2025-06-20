import BooksRepositoryImpl from "../../src/repository/BooksRepository";
import DatabaseService from "../../src/service/DatabaseService";
import Book from "../../src/model/Book";
import {jest, expect, describe, it, beforeEach} from "@jest/globals";

jest.mock("../../src/service/DatabaseService");

const mockQuery = jest.fn<(...args: any) => Promise<[any, any]>>();
const mockExecute = jest.fn<(...args: any) => Promise<[any, any]>>();

const MockedDabataseService = DatabaseService as jest.MockedClass<typeof DatabaseService>;

describe("BooksRepositoryImpl", () => {
  let repo: BooksRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    MockedDabataseService.prototype.getConnection.mockReturnValue({
      query: mockQuery,
      execute: mockExecute,
      config: undefined,
      threadId: 0,
      connect: jest.fn<(...args) => any>(),
      ping: jest.fn<(...args) => any>(),
      beginTransaction: jest.fn<(...args) => any>(),
      commit: jest.fn<(...args) => any>(),
      rollback: jest.fn<(...args) => any>(),
      changeUser: jest.fn<(...args) => any>(),
      prepare: jest.fn<(...args) => any>(),
      unprepare: jest.fn<(...args) => any>(),
      end: jest.fn<(...args) => any>(),
      destroy: jest.fn<(...args) => any>(),
      pause: jest.fn<(...args) => any>(),
      resume: jest.fn<(...args) => any>(),
      escape: jest.fn<(...args) => any>(),
      escapeId: jest.fn<(...args) => any>(),
      format: jest.fn<(...args) => any>(),
      addListener: jest.fn<(...args) => any>(),
      on: jest.fn<(...args) => any>(),
      once: jest.fn<(...args) => any>(),
      removeListener: jest.fn<(...args) => any>(),
      off: jest.fn<(...args) => any>(),
      removeAllListeners: jest.fn<(...args) => any>(),
      setMaxListeners: jest.fn<(...args) => any>(),
      getMaxListeners: jest.fn<(...args) => any>(),
      listeners: jest.fn<(...args) => any>(),
      rawListeners: jest.fn<(...args) => any>(),
      emit: jest.fn<(...args) => any>(),
      listenerCount: jest.fn<(...args) => any>(),
      prependListener: jest.fn<(...args) => any>(),
      prependOnceListener: jest.fn<(...args) => any>(),
      eventNames: jest.fn<(...args) => any>()
    });
    repo = new BooksRepositoryImpl(new DatabaseService() as any);
  });

  describe("createChapter", () => {
    it("should insert a chapter with next chapter number if not provided", async () => {
      mockQuery.mockResolvedValueOnce([[{maxChapterNumber: 2}],[]]);
      mockExecute.mockResolvedValueOnce(undefined);

      await repo.createChapter(1, "Title", "Content");

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT MAX(chapter_number)"),
        [1]
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO chapters"),
        [1, "Title", "Content", 3]
      );
    });
  });

  it("searchBooks", async () => {
    const books: Book[] = [
      {id: 1, title: "Book", author: "A", tags: [], chapters: []} as any,
    ];
    mockQuery.mockResolvedValueOnce([books,[]]);

    const result = await repo.searchBooks();
    expect(result).toEqual(books);
    expect(mockQuery).toHaveBeenCalled();
  });

});
