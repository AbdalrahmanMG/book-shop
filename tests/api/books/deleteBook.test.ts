import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { deleteBook } from "@/api/books/actions";
import { supabase } from "@/lib/supabase";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("deleteBook", () => {
  const mockCookieStore = {
    get: vi.fn(),
  } as unknown as ReadonlyRequestCookies;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
  });

  const mockSupabaseDelete = (success: boolean, bookExists = true) => {
    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const deleteMock = {
      eq: vi.fn().mockResolvedValue({
        data: success ? {} : null,
        error: success ? null : { message: "Delete failed" },
        count: bookExists ? 1 : 0,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue(deleteMock),
    } as unknown as SupabaseQueryBuilder);

    return deleteMock;
  };

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
    const deleteMock = mockSupabaseDelete(true);

    const result = await deleteBook(2);

    expect(result).toEqual({
      success: true,
      message: "Book with ID 2 deleted successfully.",
    });

    expect(deleteMock.eq).toHaveBeenCalledWith("id", 2);
  });

  it("should return error when book not found", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    mockSupabaseDelete(false, false);

    const result = await deleteBook(999);

    expect(result).toEqual({
      success: false,
      message: "Failed to delete book with ID 999.",
    });
  });

  it("should handle database error on delete", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const errorMock = {
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
        count: 0,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue(errorMock),
    } as unknown as SupabaseQueryBuilder);

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteBook(1);

    expect(result).toEqual({
      success: false,
      message: "Failed to delete book with ID 1.",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("should delete first book correctly", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    const deleteMock = mockSupabaseDelete(true);

    const result = await deleteBook(1);

    expect(result.success).toBe(true);
    expect(deleteMock.eq).toHaveBeenCalledWith("id", 1);
  });

  it("should delete last book correctly", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    const deleteMock = mockSupabaseDelete(true);

    const result = await deleteBook(3);

    expect(result.success).toBe(true);
    expect(deleteMock.eq).toHaveBeenCalledWith("id", 3);
  });

  it("should handle deleting single book", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    mockSupabaseDelete(true);

    const result = await deleteBook(1);

    expect(result.success).toBe(true);
  });

  it("should call supabase.from with correct table name", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    mockSupabaseDelete(true);

    await deleteBook(2);

    expect(supabase.from).toHaveBeenCalledWith("books");
  });

  it("should handle negative ID values", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    const result = await deleteBook(-1);

    expect(result).toEqual({
      success: false,
      message: "Invalid book ID provided.",
    });
  });

  it("should verify delete query structure", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const deleteMock = {
      eq: vi.fn().mockResolvedValue({
        data: {},
        error: null,
        count: 1,
      }),
    };

    const deleteMethod = vi.fn().mockReturnValue(deleteMock);

    vi.mocked(supabase.from).mockReturnValue({
      delete: deleteMethod,
    } as unknown as SupabaseQueryBuilder);

    await deleteBook(2);

    expect(deleteMethod).toHaveBeenCalled();
    expect(deleteMock.eq).toHaveBeenCalledWith("id", 2);
  });

  it("should return appropriate message on successful deletion", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: "1" });
    mockSupabaseDelete(true);

    const result = await deleteBook(5);

    expect(result.success).toBe(true);
    expect(result.message).toContain("5");
    expect(result.message).toContain("deleted successfully");
  });
});
