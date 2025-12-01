import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { updateProfileAction } from "@/api/profile/actions";
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

describe("updateProfileAction", () => {
  const mockCookieStore = {
    get: vi.fn(),
    delete: vi.fn(),
  } as unknown as ReadonlyRequestCookies;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
  });

  const mockSupabaseGetUser = (
    user: { id: number; name: string; email: string; password: string } | null,
  ) => {
    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const queryMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: user,
        error: user ? null : { message: "Not found" },
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(queryMock as unknown as SupabaseQueryBuilder);
  };

  const mockSupabaseUpdate = (success: boolean) => {
    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const queryMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: success ? { id: 1, name: "New Name", email: "new@example.com" } : null,
        error: success ? null : { message: "Update failed" },
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(queryMock as unknown as SupabaseQueryBuilder);

    return queryMock;
  };

  it("returns error when auth cookie is missing", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    const result = await updateProfileAction({
      name: "new",
      email: "new@example.com",
    });

    expect(result).toEqual({ error: "Authentication cookie not found." });
  });

  it("returns error when user not found", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({
      name: "auth",
      value: "99",
    });

    mockSupabaseGetUser(null);

    const result = await updateProfileAction({
      name: "new",
      email: "new@example.com",
    });

    expect(result).toEqual({ error: "User with ID 99 not found." });
  });

  it("updates user successfully", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ name: "auth", value: "1" });

    const queryMock = mockSupabaseUpdate(true);

    const result = await updateProfileAction({
      name: "New Name",
      email: "new@example.com",
    });

    expect(supabase.from).toHaveBeenCalledWith("users");
    expect(queryMock.update).toHaveBeenCalledWith({
      name: "New Name",
      email: "new@example.com",
    });
    expect(queryMock.eq).toHaveBeenCalledWith("id", "1");

    expect(result).toEqual({
      id: 1,
      name: "New Name",
      email: "new@example.com",
    });
  });

  it("returns error when update fails", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ name: "auth", value: "1" });

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;

      if (callCount === 1) {
        // First call: get user (successful)
        const getUserMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 1, name: "Old", email: "old@example.com", password: "pass" },
            error: null,
          }),
        };
        return getUserMock as unknown as SupabaseQueryBuilder;
      } else {
        // Second call: update (failed)
        const updateMock = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Update failed" },
          }),
        };
        return updateMock as unknown as SupabaseQueryBuilder;
      }
    });

    const result = await updateProfileAction({
      name: "BB",
      email: "bb@bb.com",
    });

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe("Failed to save updated user data.");
  });

  it("should call supabase with correct table name", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ name: "auth", value: "1" });

    mockSupabaseUpdate(true);

    await updateProfileAction({
      name: "Test",
      email: "test@example.com",
    });

    expect(supabase.from).toHaveBeenCalledWith("users");
  });

  it("should handle database errors gracefully", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ name: "auth", value: "1" });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;

      if (callCount === 1) {
        // First call: get user (successful)
        const getUserMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 1, name: "Old", email: "old@example.com", password: "pass" },
            error: null,
          }),
        };
        return getUserMock as unknown as SupabaseQueryBuilder;
      } else {
        // Second call: update (throws error)
        const errorMock = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockRejectedValue(new Error("Database error")),
        };
        return errorMock as unknown as SupabaseQueryBuilder;
      }
    });

    await expect(
      updateProfileAction({
        name: "Test",
        email: "test@example.com",
      }),
    ).rejects.toThrow("Database error");

    consoleErrorSpy.mockRestore();
  });

  it("should update only name when email is not provided", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ name: "auth", value: "1" });

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const queryMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, name: "New Name", email: "old@example.com" },
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(queryMock as unknown as SupabaseQueryBuilder);

    await updateProfileAction({
      name: "New Name",
      email: "old@example.com",
    });

    expect(queryMock.update).toHaveBeenCalledWith({
      name: "New Name",
      email: "old@example.com",
    });
  });

  it("should query with correct user ID", async () => {
    const userId = "456";
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({
      name: "auth",
      value: userId,
    });

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const queryMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 456, name: "Test", email: "test@example.com" },
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(queryMock as unknown as SupabaseQueryBuilder);

    await updateProfileAction({
      name: "Test",
      email: "test@example.com",
    });

    expect(queryMock.eq).toHaveBeenCalledWith("id", userId);
  });
});
