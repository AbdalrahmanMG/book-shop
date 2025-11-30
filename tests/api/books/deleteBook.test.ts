import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { deleteBook } from "@/api/books/actions";
import { readJson } from "@/lib/helper/readJson";
import { writeJson } from "@/lib/helper/writeJson";
import type { Book } from "@/types";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/helper/readJson", () => ({
  readJson: vi.fn(),
}));

vi.mock("@/lib/helper/writeJson", () => ({
  writeJson: vi.fn(),
}));

describe("deleteBook", () => {
  const mockCookieStore = {
    get: vi.fn(),
  } as unknown as ReadonlyRequestCookies;

  const mockBooks: Book[] = [
    {
      id: 1,
      title: "Book One",
      description: "Description 1",
      price: 20,
      author: "Author 1",
      category: "Technology",
      ownerId: 1,
      thumbnail: "",
    },
    {
      id: 2,
      title: "Book Two",
      description: "Description 2",
      price: 30,
      author: "Author 2",
      category: "Science",
      ownerId: 1,
      thumbnail: "",
    },
    {
      id: 3,
      title: "Book Three",
      description: "Description 3",
      price: 40,
      author: "Author 3",
      category: "History",
      ownerId: 2,
      thumbnail: "",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
    vi.mocked(readJson<Book[]>).mockResolvedValue([...mockBooks]);
    vi.mocked(writeJson).mockResolvedValue(undefined);
  });

  it("should return error when auth cookie not found", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    const result = await deleteBook(1);

    expect(result).toEqual({
      success: false,
      message: "Authentication cookie not found.",
    });
  });

  it("should return error when ID is invalid", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const result = await deleteBook(0);

    expect(result).toEqual({
      success: false,
      message: "Invalid book ID provided.",
    });
  });

  it("should delete book successfully", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const result = await deleteBook(2);

    expect(result).toEqual({
      success: true,
      message: "Book with ID 2 deleted successfully.",
    });

    expect(writeJson).toHaveBeenCalledWith(
      "books.json",
      expect.arrayContaining([
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 3 }),
      ]),
    );

    const writtenBooks = vi.mocked(writeJson).mock.calls[0][1] as Book[];
    expect(writtenBooks).toHaveLength(2);
    expect(writtenBooks.find((b) => b.id === 2)).toBeUndefined();
  });

  it("should return error when book not found", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const result = await deleteBook(999);

    expect(result).toEqual({
      success: false,
      message: "Book with ID 999 not found.",
    });

    expect(writeJson).not.toHaveBeenCalled();
  });

  it("should handle file read error", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    vi.mocked(readJson<Book[]>).mockRejectedValue(new Error("Read error"));

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteBook(1);

    expect(result).toEqual({
      success: false,
      message: "A file system error occurred during deletion.",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("should handle file write error", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    vi.mocked(writeJson).mockRejectedValue(new Error("Write error"));

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteBook(1);

    expect(result).toEqual({
      success: false,
      message: "A file system error occurred during deletion.",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("should delete first book correctly", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const result = await deleteBook(1);

    expect(result.success).toBe(true);

    const writtenBooks = vi.mocked(writeJson).mock.calls[0][1] as Book[];
    expect(writtenBooks).toHaveLength(2);
    expect(writtenBooks[0].id).toBe(2);
    expect(writtenBooks[1].id).toBe(3);
  });

  it("should delete last book correctly", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const result = await deleteBook(3);

    expect(result.success).toBe(true);

    const writtenBooks = vi.mocked(writeJson).mock.calls[0][1] as Book[];
    expect(writtenBooks).toHaveLength(2);
    expect(writtenBooks[0].id).toBe(1);
    expect(writtenBooks[1].id).toBe(2);
  });

  it("should handle deleting from single book array", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    vi.mocked(readJson<Book[]>).mockResolvedValue([mockBooks[0]]);

    const result = await deleteBook(1);

    expect(result.success).toBe(true);

    const writtenBooks = vi.mocked(writeJson).mock.calls[0][1] as Book[];
    expect(writtenBooks).toHaveLength(0);
  });

  it("should not modify other books when deleting", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    await deleteBook(2);

    const writtenBooks = vi.mocked(writeJson).mock.calls[0][1] as Book[];
    const book1 = writtenBooks.find((b) => b.id === 1);
    const book3 = writtenBooks.find((b) => b.id === 3);

    expect(book1).toEqual(mockBooks[0]);
    expect(book3).toEqual(mockBooks[2]);
  });
});
