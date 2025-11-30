import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import type { User, SafeUserData } from "@/types";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { getSessionData } from "@/api/auth/actions";
import { readJson } from "@/lib/helper/readJson";
import { sanitizeUser } from "@/lib/helper/sanitizeUser";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/helper/readJson", () => ({
  readJson: vi.fn(),
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

  it("should return null when no auth cookie exists", async () => {
    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    const result = await getSessionData();

    expect(result).toBeNull();
    expect(mockCookieStore.get).toHaveBeenCalledWith("auth");
  });

  it("should return sanitized user data when valid session exists", async () => {
    const mockUserId = "123";
    const mockUser: User = {
      id: 123,
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    };
    const mockSafeUser: SafeUserData = { id: 123, name: "Test User", email: "test@example.com" };

    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: mockUserId });
    vi.mocked(readJson<User[]>).mockResolvedValue([mockUser]);
    vi.mocked(sanitizeUser).mockReturnValue(mockSafeUser);

    const result = await getSessionData();

    expect(result).toEqual(mockSafeUser);
    expect(readJson).toHaveBeenCalledWith("users.json");
    expect(sanitizeUser).toHaveBeenCalledWith(mockUser);
  });

  it("should delete cookie and return null when user not found", async () => {
    const mockUserId = "999";
    const mockUser: User = {
      id: 123,
      name: "Other User",
      email: "other@example.com",
      password: "hashed",
    };

    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: mockUserId });
    vi.mocked(readJson<User[]>).mockResolvedValue([mockUser]);

    const result = await getSessionData();

    expect(result).toBeNull();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth");
  });

  it("should handle errors and delete cookie", async () => {
    const mockUserId = "123";
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: mockUserId });
    vi.mocked(readJson<User[]>).mockRejectedValue(new Error("File read error"));

    const result = await getSessionData();

    expect(result).toBeNull();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should match user ID as string comparison", async () => {
    const mockUserId = "456";
    const mockUser: User = {
      id: 456,
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    };
    const mockSafeUser: SafeUserData = { id: 456, name: "Test User", email: "test@example.com" };

    (mockCookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: mockUserId });
    vi.mocked(readJson<User[]>).mockResolvedValue([mockUser]);
    vi.mocked(sanitizeUser).mockReturnValue(mockSafeUser);

    const result = await getSessionData();

    expect(result).toEqual(mockSafeUser);
  });
});
