import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { updateBook } from "@/api/books/actions";
import { readJson } from "@/lib/helper/readJson";
import { writeJson } from "@/lib/helper/writeJson";
import { uploadImage } from "@/lib/helper/uploadImages";
import { updateBookSchema } from "@/validation/auth";
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
      ownerId: 1,
      thumbnail: "/old-image.jpg",
    },
    {
      id: 2,
      title: "Another Book",
      description: "Another Description",
      price: 30,
      author: "Another Author",
      category: "Science",
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

    const formData = createFormData({
      id: "1",
      title: "Updated Title",
      price: "25",
      author: "Updated Author",
      category: "Fiction",
    });

    const result = await updateBook(formData);

    expect(result).toEqual({
      id: 1,
      title: "Updated Title",
      description: "Original Description",
      price: 25,
      author: "Updated Author",
      category: "Fiction",
      ownerId: 1,
      thumbnail: "/old-image.jpg",
    });

    expect(writeJson).toHaveBeenCalledWith(
      "books.json",
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          title: "Updated Title",
        }),
      ]),
    );
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

  it("should handle read file failure", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    vi.mocked(readJson<Book[]>).mockRejectedValue(new Error("Read error"));

    vi.mocked(updateBookSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        id: 1,
        title: "Updated Title",
      },
    } as never);

    const formData = createFormData({
      id: "1",
      title: "Updated Title",
    });

    const result = await updateBook(formData);

    expect(result).toEqual({ error: "Failed to access book data." });
  });

  it("should handle write file failure", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    vi.mocked(writeJson).mockRejectedValue(new Error("Write error"));

    vi.mocked(updateBookSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        id: 1,
        title: "Updated Title",
      },
    } as never);

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

    const formData = createFormData({
      id: "2",
      title: "New Title",
      price: "50",
      author: "New Author",
      category: "History",
    });

    const result = await updateBook(formData);

    expect(result).toEqual({
      id: 2,
      title: "New Title",
      description: "Another Description",
      price: 50,
      author: "New Author",
      category: "History",
      ownerId: 1,
      thumbnail: "",
    });
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
