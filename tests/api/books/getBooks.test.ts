import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBooks } from "@/api/books/actions";
import { readJson } from "@/lib/helper/readJson";
import type { Book } from "@/types";

vi.mock("@/lib/helper/readJson", () => ({
  readJson: vi.fn(),
}));

describe("getBooks", () => {
  const mockBooks: Partial<Book>[] = [
    { id: 1, title: "Zebra Book", author: "Author A", price: 10, owner_id: 1 },
    { id: 2, title: "Apple Book", author: "Author B", price: 20, owner_id: 1 },
    { id: 3, title: "Mango Book", author: "Author C", price: 30, owner_id: 2 },
    { id: 4, title: "Banana Book", author: "Author D", price: 40, owner_id: 2 },
    { id: 5, title: "Cherry Book", author: "Author E", price: 50, owner_id: 1 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readJson<Partial<Book>[]>).mockResolvedValue([...mockBooks]);
  });

  it("should return all books with default pagination", async () => {
    const result = await getBooks({});

    expect(result.books).toHaveLength(5);
    expect(result.total).toBe(5);
    expect(result.pages).toBe(1);
  });

  it("should paginate books correctly", async () => {
    const result = await getBooks({ page: 1, pageSize: 2 });

    expect(result.books).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.pages).toBe(3);
    expect(result.books[0].id).toBe(1);
    expect(result.books[1].id).toBe(2);
  });

  it("should return second page correctly", async () => {
    const result = await getBooks({ page: 2, pageSize: 2 });

    expect(result.books).toHaveLength(2);
    expect(result.books[0].id).toBe(3);
    expect(result.books[1].id).toBe(4);
  });

  it("should filter books by search term", async () => {
    const result = await getBooks({ search: "apple" });

    expect(result.books).toHaveLength(1);
    expect(result.books[0].title).toBe("Apple Book");
    expect(result.total).toBe(1);
  });

  it("should filter books by search term case insensitive", async () => {
    const result = await getBooks({ search: "MANGO" });

    expect(result.books).toHaveLength(1);
    expect(result.books[0].title).toBe("Mango Book");
  });

  it("should sort books in ascending order", async () => {
    const result = await getBooks({ sort: "asc" });

    expect(result.books[0].title).toBe("Apple Book");
    expect(result.books[1].title).toBe("Banana Book");
    expect(result.books[2].title).toBe("Cherry Book");
    expect(result.books[4].title).toBe("Zebra Book");
  });

  it("should sort books in descending order", async () => {
    const result = await getBooks({ sort: "desc" });

    expect(result.books[0].title).toBe("Zebra Book");
    expect(result.books[1].title).toBe("Mango Book");
    expect(result.books[4].title).toBe("Apple Book");
  });

  it("should not sort books when sort is none", async () => {
    const result = await getBooks({ sort: "none" });

    expect(result.books[0].id).toBe(1);
    expect(result.books[1].id).toBe(2);
    expect(result.books[2].id).toBe(3);
  });

  it("should filter books by owner_id", async () => {
    const result = await getBooks({ bookOwnerId: 1 });

    expect(result.books).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.books.every((book) => book.owner_id === 1)).toBe(true);
  });

  it("should filter books by different owner_id", async () => {
    const result = await getBooks({ bookOwnerId: 2 });

    expect(result.books).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.books.every((book) => book.owner_id === 2)).toBe(true);
  });

  it("should combine search and owner_id filters", async () => {
    const result = await getBooks({ bookOwnerId: 1, search: "book" });

    expect(result.books).toHaveLength(3);
    expect(result.books.every((book) => book.owner_id === 1)).toBe(true);
  });

  it("should combine all filters with pagination and sort", async () => {
    const result = await getBooks({
      bookOwnerId: 1,
      search: "book",
      sort: "asc",
      page: 1,
      pageSize: 2,
    });

    expect(result.books).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.pages).toBe(2);
    expect(result.books[0].title).toBe("Apple Book");
  });

  it("should return empty array when no books match search", async () => {
    const result = await getBooks({ search: "nonexistent" });

    expect(result.books).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.pages).toBe(0);
  });

  it("should return empty array when no books match owner_id", async () => {
    const result = await getBooks({ bookOwnerId: 999 });

    expect(result.books).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("should handle empty books array", async () => {
    vi.mocked(readJson<Book[]>).mockResolvedValue([]);

    const result = await getBooks({});

    expect(result.books).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.pages).toBe(0);
  });

  it("should calculate pages correctly with exact division", async () => {
    const result = await getBooks({ pageSize: 5 });

    expect(result.pages).toBe(1);
  });

  it("should calculate pages correctly with remainder", async () => {
    const result = await getBooks({ pageSize: 3 });

    expect(result.pages).toBe(2);
  });

  it("should handle last page with fewer items", async () => {
    const result = await getBooks({ page: 3, pageSize: 2 });

    expect(result.books).toHaveLength(1);
    expect(result.books[0].id).toBe(5);
  });

  it("should use default values when options not provided", async () => {
    const result = await getBooks({});

    expect(result.books).toHaveLength(5);
    expect(result.total).toBe(5);
  });
});
