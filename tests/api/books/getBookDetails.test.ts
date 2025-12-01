import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBookDetails } from "@/api/books/actions";
import { supabase } from "@/lib/supabase";
import type { Book } from "@/types";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("getBookDetails", () => {
  const mockBooks: Book[] = [
    {
      id: 1,
      title: "First Book",
      description: "First Description",
      price: 20,
      author: "Author One",
      category: "Technology",
      owner_id: 1,
      thumbnail: "/image1.jpg",
    },
    {
      id: 2,
      title: "Second Book",
      description: "Second Description",
      price: 30,
      author: "Author Two",
      category: "Science",
      owner_id: 2,
      thumbnail: "/image2.jpg",
    },
    {
      id: 3,
      title: "Third Book",
      description: "Third Description",
      price: 40,
      author: "Author Three",
      category: "History",
      owner_id: 1,
      thumbnail: "",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSupabaseGetById = (book: Book | null) => {
    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const queryMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: book,
        error: book ? null : { message: "Not found" },
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(queryMock as unknown as SupabaseQueryBuilder);
  };

  it("should return book when found", async () => {
    mockSupabaseGetById(mockBooks[1]);

    const result = await getBookDetails(2);

    expect(result).toEqual({
      id: 2,
      title: "Second Book",
      description: "Second Description",
      price: 30,
      author: "Author Two",
      category: "Science",
      owner_id: 2,
      thumbnail: "/image2.jpg",
    });
  });

  it("should return null when book not found", async () => {
    mockSupabaseGetById(null);

    const result = await getBookDetails(999);

    expect(result).toBeNull();
  });

  it("should return null when ID is zero", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getBookDetails(0);

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Invalid book ID provided:", 0);

    consoleErrorSpy.mockRestore();
  });

  it("should handle database errors gracefully", async () => {
    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const errorMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(errorMock as unknown as SupabaseQueryBuilder);

    const result = await getBookDetails(1);

    expect(result).toBeNull();
  });

  it("should return first book correctly", async () => {
    mockSupabaseGetById(mockBooks[0]);

    const result = await getBookDetails(1);

    expect(result).toEqual(mockBooks[0]);
  });

  it("should return last book correctly", async () => {
    mockSupabaseGetById(mockBooks[2]);

    const result = await getBookDetails(3);

    expect(result).toEqual(mockBooks[2]);
  });

  it("should call supabase.from with correct table name", async () => {
    mockSupabaseGetById(mockBooks[0]);

    await getBookDetails(1);

    expect(supabase.from).toHaveBeenCalledWith("books");
  });

  it("should handle when book does not exist", async () => {
    mockSupabaseGetById(null);

    const result = await getBookDetails(1);

    expect(result).toBeNull();
  });

  it("should find book by exact ID match", async () => {
    mockSupabaseGetById(mockBooks[1]);

    const result = await getBookDetails(2);

    expect(result?.id).toBe(2);
    expect(result?.title).toBe("Second Book");
  });

  it("should return complete book object with all properties", async () => {
    mockSupabaseGetById(mockBooks[0]);

    const result = await getBookDetails(1);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("price");
    expect(result).toHaveProperty("author");
    expect(result).toHaveProperty("category");
    expect(result).toHaveProperty("owner_id");
    expect(result).toHaveProperty("thumbnail");
  });

  it("should handle negative ID values", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getBookDetails(-1);

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Invalid book ID provided:", -1);

    consoleErrorSpy.mockRestore();
  });

  it("should query with correct ID filter", async () => {
    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const queryMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockBooks[0],
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(queryMock as unknown as SupabaseQueryBuilder);

    await getBookDetails(1);

    expect(queryMock.eq).toHaveBeenCalledWith("id", 1);
  });
});
