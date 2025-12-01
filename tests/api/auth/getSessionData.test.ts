import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import type { SafeUserData } from "@/types";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { getSessionData } from "@/api/auth/actions";
import { sanitizeUser } from "@/lib/helper/sanitizeUser";
import { supabase } from "@/lib/supabase";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/helper/sanitizeUser", () => ({
  sanitizeUser: vi.fn(),
}));

describe("getSessionData", () => {
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

  it("should return null when no auth cookie exists", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    const result = await getSessionData();

    expect(result).toBeNull();
    expect(mockCookieStore.get).toHaveBeenCalledWith("auth");
  });

  it("should return sanitized user data when valid session exists", async () => {
    const mockUserId = "123";
    const mockUser = {
      id: 123,
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    };
    const mockSafeUser: SafeUserData = {
      id: 123,
      name: "Test User",
      email: "test@example.com",
    };

    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: mockUserId });
    mockSupabaseGetUser(mockUser);
    vi.mocked(sanitizeUser).mockReturnValue(mockSafeUser);

    const result = await getSessionData();

    expect(result).toEqual(mockSafeUser);
    expect(supabase.from).toHaveBeenCalledWith("users");
    expect(sanitizeUser).toHaveBeenCalledWith(mockUser);
  });

  it("should delete cookie and return null when user not found", async () => {
    const mockUserId = "999";

    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: mockUserId });
    mockSupabaseGetUser(null);

    const result = await getSessionData();

    expect(result).toBeNull();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth");
  });

  it("should handle errors and delete cookie", async () => {
    const mockUserId = "123";
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const errorMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockRejectedValue(new Error("Database error")),
    };

    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: mockUserId });
    vi.mocked(supabase.from).mockReturnValue(errorMock as unknown as SupabaseQueryBuilder);

    const result = await getSessionData();

    expect(result).toBeNull();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should match user ID as string comparison", async () => {
    const mockUserId = "456";
    const mockUser = {
      id: 456,
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    };
    const mockSafeUser: SafeUserData = {
      id: 456,
      name: "Test User",
      email: "test@example.com",
    };

    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: mockUserId });
    mockSupabaseGetUser(mockUser);
    vi.mocked(sanitizeUser).mockReturnValue(mockSafeUser);

    const result = await getSessionData();

    expect(result).toEqual(mockSafeUser);
  });

  it("should return null when user data exists but is null", async () => {
    const mockUserId = "123";

    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: mockUserId });
    mockSupabaseGetUser(null);

    const result = await getSessionData();

    expect(result).toBeNull();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth");
  });

  it("should call supabase.from with correct table name", async () => {
    const mockUserId = "123";
    const mockUser = {
      id: 123,
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    };
    const mockSafeUser: SafeUserData = {
      id: 123,
      name: "Test User",
      email: "test@example.com",
    };

    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: mockUserId });
    mockSupabaseGetUser(mockUser);
    vi.mocked(sanitizeUser).mockReturnValue(mockSafeUser);

    await getSessionData();

    expect(supabase.from).toHaveBeenCalledWith("users");
  });

  it("should query with correct ID filter", async () => {
    const mockUserId = "123";
    const mockUser = {
      id: 123,
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    };

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const queryMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockUser,
        error: null,
      }),
    };

    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: mockUserId });
    vi.mocked(supabase.from).mockReturnValue(queryMock as unknown as SupabaseQueryBuilder);

    await getSessionData();

    expect(queryMock.eq).toHaveBeenCalledWith("id", mockUserId);
  });

  it("should handle database errors gracefully", async () => {
    const mockUserId = "123";

    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>;

    const errorMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      }),
    };

    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: mockUserId });
    vi.mocked(supabase.from).mockReturnValue(errorMock as unknown as SupabaseQueryBuilder);

    const result = await getSessionData();

    expect(result).toBeNull();
  });
});
