import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { updateBook } from "@/api/books/actions";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/helper/uploadImages";
import { updateBookSchema } from "@/validation/auth";
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

vi.mock("@/validation/auth", () => ({
  updateBookSchema: {
    safeParse: vi.fn(),
  },
}));

describe("updateBook", () => {
  const mockCookieStore = {
    get: vi.fn(),
  } as unknown as ReadonlyRequestCookies;

  const mockBooks: Book[] = [
    {
      id: 1,
      title: "Original Book",
      description: "Original Description",
      price: 20,
      author: "Original Author",
      category: "Technology",
      owner_id: 1,
      thumbnail: "/old-image.jpg",
    },
    {
      id: 2,
      title: "Another Book",
      description: "Another Description",
      price: 30,
      author: "Another Author",
      category: "Science",
      owner_id: 1,
      thumbnail: "",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
  });

  const createFormData = (data: Record<string, string | File>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  };

  const mockSupabaseQuery = (book: Book | null, updateResult: Book | null = null) => {
    const selectMock = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: book,
        error: book ? null : { message: "Not found" },
      }),
    };

    const updateMock = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: updateResult,
        error: updateResult ? null : { message: "Update failed" },
      }),
    };

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    vi.mocked(supabase.from).mockImplementation(() => {
      return {
        select: vi.fn().mockReturnValue(selectMock),
        update: vi.fn().mockReturnValue(updateMock),
      } as unknown as SupabaseQueryBuilder;
    });
  };

  it("should return error when auth cookie not found", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    const formData = createFormData({
      id: "1",
      title: "Updated Title",
    });

    const result = await updateBook(formData);

    expect(result).toEqual({ error: "Authentication cookie not found." });
  });

  it("should return error when book ID is missing", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const formData = createFormData({
      title: "Updated Title",
    });

    const result = await updateBook(formData);

    expect(result).toEqual({ error: "Book ID is missing." });
  });

  it("should return error when validation fails", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    vi.mocked(updateBookSchema.safeParse).mockReturnValue({
      success: false,
      error: {
        issues: [{ message: "Invalid price format" }],
      },
    } as never);

    const formData = createFormData({
      id: "1",
      title: "Updated Title",
      price: "invalid",
    });

    const result = await updateBook(formData);

    expect(result).toEqual({ error: "Invalid price format" });
  });

  it("should update book successfully without thumbnail", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    vi.mocked(updateBookSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        id: 1,
        title: "Updated Title",
        price: 25,
        author: "Updated Author",
        category: "Fiction",
      },
    } as never);

    const existingBook = mockBooks[0];
    const updatedBook: Book = {
      ...existingBook,
      title: "Updated Title",
      price: 25,
      author: "Updated Author",
      category: "Technology" as const,
    };

    mockSupabaseQuery(existingBook, updatedBook);

    const formData = createFormData({
      id: "1",
      title: "Updated Title",
      price: "25",
      author: "Updated Author",
      category: "Technology",
    });

    const result = await updateBook(formData);

    expect(result).toEqual({
      ...updatedBook,
      category: "Technology",
    });
  });

  it("should update book with new thumbnail", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    vi.mocked(uploadImage).mockResolvedValue("/new-image.jpg");

    vi.mocked(updateBookSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        id: 1,
        title: "Updated Title",
      },
    } as never);

    const existingBook = mockBooks[0];
    const updatedBook: Book = {
      ...existingBook,
      title: "Updated Title",
      thumbnail: "/new-image.jpg",
    };

    mockSupabaseQuery(existingBook, updatedBook);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const formData = createFormData({
      id: "1",
      title: "Updated Title",
    });
    formData.set("thumbnail", file);

    const result = await updateBook(formData);

    expect((result as Book).thumbnail).toBe("/new-image.jpg");
    expect(uploadImage).toHaveBeenCalledWith(file);
  });

  it("should return error when book not found", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    vi.mocked(updateBookSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        id: 999,
        title: "Updated Title",
      },
    } as never);

    mockSupabaseQuery(null);

    const formData = createFormData({
      id: "999",
      title: "Updated Title",
    });

    const result = await updateBook(formData);

    expect(result).toEqual({ error: "Book with ID 999 not found." });
  });

  it("should handle image upload failure", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    vi.mocked(uploadImage).mockRejectedValue(new Error("Upload failed"));

    vi.mocked(updateBookSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        id: 1,
        title: "Updated Title",
      },
    } as never);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const formData = createFormData({
      id: "1",
      title: "Updated Title",
    });
    formData.set("thumbnail", file);

    const result = await updateBook(formData);

    expect(result).toEqual({ error: "Failed to upload new thumbnail image." });
  });

  it("should handle database fetch error", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    vi.mocked(updateBookSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        id: 1,
        title: "Updated Title",
      },
    } as never);

    const selectMock = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      }),
    };

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(selectMock),
    } as unknown as SupabaseQueryBuilder);

    const formData = createFormData({
      id: "1",
      title: "Updated Title",
    });

    const result = await updateBook(formData);

    expect(result).toEqual({ error: "Book with ID 1 not found." });
  });

  it("should handle database update error", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    vi.mocked(updateBookSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        id: 1,
        title: "Updated Title",
      },
    } as never);

    const existingBook = mockBooks[0];

    const selectMock = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: existingBook,
        error: null,
      }),
    };

    const updateMock = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      }),
    };

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(selectMock),
      update: vi.fn().mockReturnValue(updateMock),
    } as unknown as SupabaseQueryBuilder);

    const formData = createFormData({
      id: "1",
      title: "Updated Title",
    });

    const result = await updateBook(formData);

    expect(result).toEqual({ error: "Failed to save updated book data." });
  });

  it("should preserve existing values when not updated", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    vi.mocked(updateBookSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        id: 1,
        title: "Only Title Updated",
      },
    } as never);

    const existingBook = mockBooks[0];
    const updatedBook: Book = {
      ...existingBook,
      title: "Only Title Updated",
    };

    mockSupabaseQuery(existingBook, updatedBook);

    const formData = createFormData({
      id: "1",
      title: "Only Title Updated",
    });

    const result = await updateBook(formData);

    expect((result as Book).title).toBe("Only Title Updated");
    expect((result as Book).price).toBe(20);
    expect((result as Book).author).toBe("Original Author");
    expect((result as Book).category).toBe("Technology");
    expect((result as Book).thumbnail).toBe("/old-image.jpg");
  });

  it("should update multiple fields at once", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    vi.mocked(updateBookSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        id: 2,
        title: "New Title",
        price: 50,
        author: "New Author",
        category: "History",
      },
    } as never);

    const existingBook = mockBooks[1];
    const updatedBook: Book = {
      ...existingBook,
      title: "New Title",
      price: 50,
      author: "New Author",
      category: "History" as const,
    };

    mockSupabaseQuery(existingBook, updatedBook);

    const formData = createFormData({
      id: "2",
      title: "New Title",
      price: "50",
      author: "New Author",
      category: "History",
    });

    const result = await updateBook(formData);

    expect(result).toEqual(updatedBook);
  });

  it("should not update thumbnail when file is empty", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    vi.mocked(updateBookSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        id: 1,
        title: "Updated Title",
      },
    } as never);

    const existingBook = mockBooks[0];
    const updatedBook: Book = {
      ...existingBook,
      title: "Updated Title",
    };

    mockSupabaseQuery(existingBook, updatedBook);

    const emptyFile = new File([], "", { type: "image/jpeg" });
    const formData = createFormData({
      id: "1",
      title: "Updated Title",
    });
    formData.set("thumbnail", emptyFile);

    const result = await updateBook(formData);

    expect((result as Book).thumbnail).toBe("/old-image.jpg");
    expect(uploadImage).not.toHaveBeenCalled();
  });
});
