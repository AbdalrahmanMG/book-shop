import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { addBook } from "@/api/books/addBook";
import { readJson } from "@/lib/helper/readJson";
import { writeJson } from "@/lib/helper/writeJson";
import { uploadImage } from "@/lib/helper/uploadImages";
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

vi.mock("@/lib/helper/uploadImages", () => ({
  uploadImage: vi.fn(),
}));

vi.mock("@/types", async () => {
  const actual = await vi.importActual("@/types");
  return {
    ...actual,
    VALID_BOOK_CATEGORIES: {
      FICTION: "Fiction",
      NON_FICTION: "Non-Fiction",
      SCIENCE: "Science",
      HISTORY: "History",
      BIOGRAPHY: "Biography",
    },
  };
});

describe("addBook", () => {
  const mockCookieStore = {
    get: vi.fn(),
  } as unknown as ReadonlyRequestCookies;

  const mockBooks: Book[] = [
    {
      id: 1,
      title: "Existing Book",
      description: "Description",
      price: 20,
      author: "Author",
      category: "Technology",
      ownerId: 1,
      thumbnail: "",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
    vi.mocked(readJson<Book[]>).mockResolvedValue([...mockBooks]);
    vi.mocked(writeJson).mockResolvedValue(undefined);
  });

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
      category: "Fiction",
      ownerId: "1",
    });

    const result = await addBook(formData);

    expect(result).toEqual({
      success: false,
      message: "Authentication cookie not found.",
    });
  });

  it("should add book successfully without thumbnail", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const formData = createFormData({
      title: "New Book",
      description: "New Description",
      price: "30",
      author: "New Author",
      category: "Fiction",
      ownerId: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(true);
    expect(result.book).toEqual({
      id: 2,
      title: "New Book",
      description: "New Description",
      price: 30,
      author: "New Author",
      category: "Fiction",
      ownerId: 1,
      thumbnail: "",
    });
    expect(result.message).toBe("Book added successfully!");
    expect(writeJson).toHaveBeenCalled();
  });

  it("should add book with thumbnail successfully", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    vi.mocked(uploadImage).mockResolvedValue("/uploads/image.jpg");

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const formData = createFormData({
      title: "Book With Image",
      description: "Description",
      price: "40",
      author: "Author",
      category: "Fiction",
      ownerId: "1",
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
      category: "Fiction",
      ownerId: "1",
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
      category: "Fiction",
      ownerId: "1",
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
      category: "Fiction",
      ownerId: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Validation failed");
  });

  it("should return error when ownerId is invalid", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const formData = createFormData({
      title: "Test Book",
      description: "Description",
      price: "30",
      author: "Author",
      category: "Fiction",
      ownerId: "-1",
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
      ownerId: "1",
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
      category: "Fiction",
      ownerId: "1",
    });
    formData.set("thumbnail", file);

    const result = await addBook(formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Failed to upload book cover image.");
  });

  it("should generate correct ID for first book", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    vi.mocked(readJson<Book[]>).mockResolvedValue([]);

    const formData = createFormData({
      title: "First Book",
      description: "Description",
      price: "30",
      author: "Author",
      category: "Fiction",
      ownerId: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(true);
    expect(result.book?.id).toBe(1);
  });

  it("should format price to 2 decimal places", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const formData = createFormData({
      title: "Test Book",
      description: "Description",
      price: "30.999",
      author: "Author",
      category: "Fiction",
      ownerId: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(true);
    expect(result.book?.price).toBe(31);
  });

  it("should handle unexpected errors", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    vi.mocked(readJson<Book[]>).mockRejectedValue(new Error("Database error"));

    const formData = createFormData({
      title: "Test Book",
      description: "Description",
      price: "30",
      author: "Author",
      category: "Fiction",
      ownerId: "1",
    });

    const result = await addBook(formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("An unexpected error occurred while processing the request.");
  });

  it("should accept all valid categories", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const validCategories = ["Fiction", "Non-Fiction", "Science", "History", "Biography"];

    for (const category of validCategories) {
      const formData = createFormData({
        title: "Test Book",
        description: "Description",
        price: "30",
        author: "Author",
        category,
        ownerId: "1",
      });

      const result = await addBook(formData);
      expect(result.success).toBe(true);
    }
  });
});
