import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { addBook } from "@/api/books/actions";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/helper/uploadImages";
import type { Book } from "@/types";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/helper/uploadImages", () => ({
  uploadImage: vi.fn(),
}));

describe("addBook", () => {
  const mockCookieStore = {
    get: vi.fn(),
  } as unknown as ReadonlyRequestCookies;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
  });

  const mockSupabaseInsert = (newBook: Book | null = null, shouldFail = false) => {
    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const insertMock = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: newBook,
        error: shouldFail || !newBook ? { message: "Insert failed" } : null,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue(insertMock),
    } as unknown as SupabaseQueryBuilder);

    return insertMock;
  };

  const createFormData = (data: Record<string, string | File>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  };

  it("should return error when auth cookie not found", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    const formData = createFormData({
      title: "Test Book",
      description: "Test Description",
      price: "25",
      author: "Test Author",
      category: "Technology",
      owner_id: "1",
    });

    const result = await addBook(formData);

    expect(result).toEqual({
      success: false,
      message: "Authentication cookie not found.",
    });
  });

  it("should add book successfully without thumbnail", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const newBook: Book = {
      id: 2,
      title: "New Book",
      description: "New Description",
      price: 30,
      author: "New Author",
      category: "Technology",
      owner_id: 1,
      thumbnail: "",
    };

    mockSupabaseInsert(newBook);

    const formData = createFormData({
      title: "New Book",
      description: "New Description",
      price: "30",
      author: "New Author",
      category: "Technology",
      owner_id: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(true);
    expect(result.book).toEqual(newBook);
    expect(result.message).toBe("Book added successfully!");
  });

  it("should add book with thumbnail successfully", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    vi.mocked(uploadImage).mockResolvedValue("/uploads/image.jpg");

    const newBook: Book = {
      id: 3,
      title: "Book With Image",
      description: "Description",
      price: 40,
      author: "Author",
      category: "Technology",
      owner_id: 1,
      thumbnail: "/uploads/image.jpg",
    };

    mockSupabaseInsert(newBook);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const formData = createFormData({
      title: "Book With Image",
      description: "Description",
      price: "40",
      author: "Author",
      category: "Technology",
      owner_id: "1",
    });
    formData.set("thumbnail", file);

    const result = await addBook(formData);

    expect(result.success).toBe(true);
    expect(result.book?.thumbnail).toBe("/uploads/image.jpg");
    expect(uploadImage).toHaveBeenCalledWith(file);
  });

  it("should return error when title is missing", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const formData = createFormData({
      description: "Description",
      price: "30",
      author: "Author",
      category: "Technology",
      owner_id: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Validation failed");
  });

  it("should return error when price is invalid", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const formData = createFormData({
      title: "Test Book",
      description: "Description",
      price: "-10",
      author: "Author",
      category: "Technology",
      owner_id: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Validation failed");
  });

  it("should return error when price is zero", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const formData = createFormData({
      title: "Test Book",
      description: "Description",
      price: "0",
      author: "Author",
      category: "Technology",
      owner_id: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Validation failed");
  });

  it("should return error when owner_id is invalid", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const formData = createFormData({
      title: "Test Book",
      description: "Description",
      price: "30",
      author: "Author",
      category: "Technology",
      owner_id: "-1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Validation failed");
  });

  it("should return error when category is invalid", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const formData = createFormData({
      title: "Test Book",
      description: "Description",
      price: "30",
      author: "Author",
      category: "InvalidCategory",
      owner_id: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid category");
  });

  it("should handle image upload failure", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    vi.mocked(uploadImage).mockRejectedValue(new Error("Upload failed"));

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const formData = createFormData({
      title: "Test Book",
      description: "Description",
      price: "30",
      author: "Author",
      category: "Technology",
      owner_id: "1",
    });
    formData.set("thumbnail", file);

    const result = await addBook(formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Failed to upload book cover image.");
  });

  it("should handle database insert failure", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    mockSupabaseInsert(null, true);

    const formData = createFormData({
      title: "Test Book",
      description: "Description",
      price: "30",
      author: "Author",
      category: "Technology",
      owner_id: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Failed to add book to database.");
  });

  it("should format price to 2 decimal places", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const newBook: Book = {
      id: 4,
      title: "Test Book",
      description: "Description",
      price: 31,
      author: "Author",
      category: "Technology",
      owner_id: 1,
      thumbnail: "",
    };

    mockSupabaseInsert(newBook);

    const formData = createFormData({
      title: "Test Book",
      description: "Description",
      price: "30.999",
      author: "Author",
      category: "Technology",
      owner_id: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(true);
    expect(result.book?.price).toBe(31);
  });

  it("should handle unexpected errors", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error("Database error");
    });

    const formData = createFormData({
      title: "Test Book",
      description: "Description",
      price: "30",
      author: "Author",
      category: "Technology",
      owner_id: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("An unexpected error occurred while processing the request.");
  });

  it("should accept all valid categories", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const validCategories = ["Technology", "Science", "History", "Fantasy", "Biography"];

    for (const category of validCategories) {
      const newBook: Book = {
        id: 5,
        title: "Test Book",
        description: "Description",
        price: 30,
        author: "Author",
        category: category as Book["category"],
        owner_id: 1,
        thumbnail: "",
      };

      mockSupabaseInsert(newBook);

      const formData = createFormData({
        title: "Test Book",
        description: "Description",
        price: "30",
        author: "Author",
        category,
        owner_id: "1",
      });

      const result = await addBook(formData);
      expect(result.success).toBe(true);
    }
  });

  it("should call supabase.from with correct table name", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const newBook: Book = {
      id: 6,
      title: "Test Book",
      description: "Description",
      price: 30,
      author: "Author",
      category: "Technology",
      owner_id: 1,
      thumbnail: "",
    };

    mockSupabaseInsert(newBook);

    const formData = createFormData({
      title: "Test Book",
      description: "Description",
      price: "30",
      author: "Author",
      category: "Technology",
      owner_id: "1",
    });

    await addBook(formData);

    expect(supabase.from).toHaveBeenCalledWith("books");
  });

  it("should return complete book object with all properties", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const newBook: Book = {
      id: 7,
      title: "Complete Book",
      description: "Complete Description",
      price: 35,
      author: "Complete Author",
      category: "Science",
      owner_id: 1,
      thumbnail: "",
    };

    mockSupabaseInsert(newBook);

    const formData = createFormData({
      title: "Complete Book",
      description: "Complete Description",
      price: "35",
      author: "Complete Author",
      category: "Science",
      owner_id: "1",
    });

    const result = await addBook(formData);

    expect(result.book).toHaveProperty("id");
    expect(result.book).toHaveProperty("title");
    expect(result.book).toHaveProperty("description");
    expect(result.book).toHaveProperty("price");
    expect(result.book).toHaveProperty("author");
    expect(result.book).toHaveProperty("category");
    expect(result.book).toHaveProperty("owner_id");
    expect(result.book).toHaveProperty("thumbnail");
  });
});
