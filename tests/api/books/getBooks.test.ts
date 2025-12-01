import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBooks } from "@/api/books/actions";
import { supabase } from "@/lib/supabase";
import type { Book } from "@/types";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("getBooks", () => {
  const mockBooks: Book[] = [
    {
      id: 1,
      title: "Zebra Book",
      author: "Author A",
      price: 10,
      owner_id: 1,
      description: "Description A",
      category: "Technology",
      thumbnail: "/zebra.jpg",
    },
    {
      id: 2,
      title: "Apple Book",
      author: "Author B",
      price: 20,
      owner_id: 1,
      description: "Description B",
      category: "Science",
      thumbnail: "/apple.jpg",
    },
    {
      id: 3,
      title: "Mango Book",
      author: "Author C",
      price: 30,
      owner_id: 2,
      description: "Description C",
      category: "History",
      thumbnail: "/mango.jpg",
    },
    {
      id: 4,
      title: "Banana Book",
      author: "Author D",
      price: 40,
      owner_id: 2,
      description: "Description D",
      category: "Technology",
      thumbnail: "/banana.jpg",
    },
    {
      id: 5,
      title: "Cherry Book",
      author: "Author E",
      price: 50,
      owner_id: 1,
      description: "Description E",
      category: "Technology",
      thumbnail: "/cherry.jpg",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSupabaseSelect = (books: Book[]) => {
    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const queryMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: books,
        error: null,
        count: books.length,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(queryMock as unknown as SupabaseQueryBuilder);

    return queryMock;
  };

  it("should return all books with default pagination", async () => {
    mockSupabaseSelect(mockBooks);

    const result = await getBooks({});

    expect(result.books).toHaveLength(5);
    expect(result.total).toBe(5);
    expect(result.pages).toBe(1);
  });

  it("should paginate books correctly", async () => {
    mockSupabaseSelect(mockBooks.slice(0, 2));

    const result = await getBooks({ page: 1, pageSize: 2 });

    expect(result.books).toHaveLength(2);
    expect(result.books[0].id).toBe(1);
    expect(result.books[1].id).toBe(2);
  });

  it("should return second page correctly", async () => {
    mockSupabaseSelect(mockBooks.slice(2, 4));

    const result = await getBooks({ page: 2, pageSize: 2 });

    expect(result.books).toHaveLength(2);
    expect(result.books[0].id).toBe(3);
    expect(result.books[1].id).toBe(4);
  });

  it("should filter books by search term", async () => {
    const appleBook = mockBooks.filter((b) => b.title.includes("Apple"));
    mockSupabaseSelect(appleBook);

    const result = await getBooks({ search: "apple" });

    expect(result.books).toHaveLength(1);
    expect(result.books[0].title).toBe("Apple Book");
  });

  it("should filter books by search term case insensitive", async () => {
    const mangoBook = mockBooks.filter((b) => b.title.toLowerCase().includes("mango"));
    mockSupabaseSelect(mangoBook);

    const result = await getBooks({ search: "MANGO" });

    expect(result.books).toHaveLength(1);
    expect(result.books[0].title).toBe("Mango Book");
  });

  it("should sort books in ascending order", async () => {
    const sorted = [...mockBooks].sort((a, b) => a.title.localeCompare(b.title));
    mockSupabaseSelect(sorted);

    const result = await getBooks({ sort: "asc" });

    expect(result.books[0].title).toBe("Apple Book");
    expect(result.books[1].title).toBe("Banana Book");
    expect(result.books[2].title).toBe("Cherry Book");
    expect(result.books[4].title).toBe("Zebra Book");
  });

  it("should sort books in descending order", async () => {
    const sorted = [...mockBooks].sort((a, b) => b.title.localeCompare(a.title));
    mockSupabaseSelect(sorted);

    const result = await getBooks({ sort: "desc" });

    expect(result.books[0].title).toBe("Zebra Book");
    expect(result.books[1].title).toBe("Mango Book");
    expect(result.books[4].title).toBe("Apple Book");
  });

  it("should not sort books when sort is none", async () => {
    mockSupabaseSelect(mockBooks);

    const result = await getBooks({ sort: "none" });

    expect(result.books[0].id).toBe(1);
    expect(result.books[1].id).toBe(2);
    expect(result.books[2].id).toBe(3);
  });

  it("should filter books by owner_id", async () => {
    const ownerBooks = mockBooks.filter((b) => b.owner_id === 1);
    mockSupabaseSelect(ownerBooks);

    const result = await getBooks({ bookOwnerId: 1 });

    expect(result.books).toHaveLength(3);
    expect(result.books.every((book) => book.owner_id === 1)).toBe(true);
  });

  it("should filter books by different owner_id", async () => {
    const ownerBooks = mockBooks.filter((b) => b.owner_id === 2);
    mockSupabaseSelect(ownerBooks);

    const result = await getBooks({ bookOwnerId: 2 });

    expect(result.books).toHaveLength(2);
    expect(result.books.every((book) => book.owner_id === 2)).toBe(true);
  });

  it("should combine search and owner_id filters", async () => {
    const filtered = mockBooks.filter(
      (b) =>
        b.owner_id === 1 &&
        (b.title.toLowerCase().includes("book") || b.author.toLowerCase().includes("book")),
    );
    mockSupabaseSelect(filtered);

    const result = await getBooks({ bookOwnerId: 1, search: "book" });

    expect(result.books).toHaveLength(3);
    expect(result.books.every((book) => book.owner_id === 1)).toBe(true);
  });

  it("should combine all filters with pagination and sort", async () => {
    const filtered = mockBooks
      .filter(
        (b) =>
          b.owner_id === 1 &&
          (b.title.toLowerCase().includes("book") || b.author.toLowerCase().includes("book")),
      )
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 2);

    mockSupabaseSelect(filtered);

    const result = await getBooks({
      bookOwnerId: 1,
      search: "book",
      sort: "asc",
      page: 1,
      pageSize: 2,
    });

    expect(result.books).toHaveLength(2);
    expect(result.books[0].title).toBe("Apple Book");
  });

  it("should return empty array when no books match search", async () => {
    mockSupabaseSelect([]);

    const result = await getBooks({ search: "nonexistent" });

    expect(result.books).toHaveLength(0);
  });

  it("should return empty array when no books match owner_id", async () => {
    mockSupabaseSelect([]);

    const result = await getBooks({ bookOwnerId: 999 });

    expect(result.books).toHaveLength(0);
  });

  it("should handle empty books array", async () => {
    mockSupabaseSelect([]);

    const result = await getBooks({});

    expect(result.books).toHaveLength(0);
  });

  it("should calculate pages correctly with exact division", async () => {
    mockSupabaseSelect(mockBooks);

    const result = await getBooks({ pageSize: 5 });

    expect(result.pages).toBe(1);
  });

  it("should calculate pages correctly with remainder", async () => {
    mockSupabaseSelect(mockBooks);

    const result = await getBooks({ pageSize: 3 });

    expect(result.pages).toBe(2);
  });

  it("should handle last page with fewer items", async () => {
    mockSupabaseSelect([mockBooks[4]]);

    const result = await getBooks({ page: 3, pageSize: 2 });

    expect(result.books).toHaveLength(1);
    expect(result.books[0].id).toBe(5);
  });

  it("should use default values when options not provided", async () => {
    mockSupabaseSelect(mockBooks);

    const result = await getBooks({});

    expect(result.books).toHaveLength(5);
  });

  it("should handle database errors gracefully", async () => {
    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const errorMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
        count: 0,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(errorMock as unknown as SupabaseQueryBuilder);

    const result = await getBooks({});

    expect(result.books).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pages).toBe(0);
  });

  it("should search in title and author fields", async () => {
    const zebraBook = mockBooks.filter((b) => b.title.includes("Zebra"));
    mockSupabaseSelect(zebraBook);

    const resultByTitle = await getBooks({ search: "Zebra" });
    expect(resultByTitle.books).toHaveLength(1);
    expect(resultByTitle.books[0].title).toBe("Zebra Book");

    const authorABook = mockBooks.filter((b) => b.author.includes("Author A"));
    mockSupabaseSelect(authorABook);

    const resultByAuthor = await getBooks({ search: "Author A" });
    expect(resultByAuthor.books).toHaveLength(1);
    expect(resultByAuthor.books[0].author).toBe("Author A");
  });

  it("should maintain book structure with all fields", async () => {
    mockSupabaseSelect([mockBooks[0]]);

    const result = await getBooks({ page: 1, pageSize: 1 });

    expect(result.books[0]).toHaveProperty("id");
    expect(result.books[0]).toHaveProperty("title");
    expect(result.books[0]).toHaveProperty("author");
    expect(result.books[0]).toHaveProperty("price");
    expect(result.books[0]).toHaveProperty("owner_id");
    expect(result.books[0]).toHaveProperty("description");
    expect(result.books[0]).toHaveProperty("category");
    expect(result.books[0]).toHaveProperty("thumbnail");
  });
});
