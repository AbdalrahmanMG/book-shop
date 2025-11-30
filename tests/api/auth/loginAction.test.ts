import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginAction } from "@/api/auth/actions";
import { LoginSchema } from "@/validation/auth";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/validation/auth", () => ({
  LoginSchema: {
    safeParse: vi.fn(),
  },
}));

vi.mock("@/db/users.json", () => ({
  default: [
    { id: 1, email: "test@example.com", password: "password123", name: "Test User" },
    { id: 2, email: "admin@example.com", password: "admin123", name: "Admin" },
  ],
}));

describe("loginAction", () => {
  const mockCookieStore = {
    set: vi.fn(),
  } as unknown as ReadonlyRequestCookies;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
  });

  it("should return validation error when data is invalid", async () => {
    const formData = new FormData();
    formData.append("email", "invalid-email");
    formData.append("password", "");

    vi.mocked(LoginSchema.safeParse).mockReturnValue({
      success: false,
      error: {
        flatten: () => ({
          fieldErrors: {
            email: ["Invalid email format"],
            password: ["Password is required"],
          },
        }),
      },
    } as never);

    const result = await loginAction(formData);

    expect(result).toEqual({
      error: "Validation Failed",
      fieldErrors: {
        email: ["Invalid email format"],
        password: ["Password is required"],
      },
    });
  });

  it("should return error when user not found", async () => {
    const formData = new FormData();
    formData.append("email", "notfound@example.com");
    formData.append("password", "wrongpassword");

    vi.mocked(LoginSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        email: "notfound@example.com",
        password: "wrongpassword",
      },
    } as never);

    const result = await loginAction(formData);

    expect(result).toEqual({ error: "Invalid credentials" });
  });

  it("should return error when password is incorrect", async () => {
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "wrongpassword");

    vi.mocked(LoginSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        email: "test@example.com",
        password: "wrongpassword",
      },
    } as never);

    const result = await loginAction(formData);

    expect(result).toEqual({ error: "Invalid credentials" });
  });

  it("should set cookie and redirect on successful login", async () => {
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "password123");

    vi.mocked(LoginSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        email: "test@example.com",
        password: "password123",
      },
    } as never);

    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(loginAction(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth",
      "1",
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        maxAge: 604800,
        sameSite: "lax",
      }),
    );
    expect(redirect).toHaveBeenCalledWith("/books");
  });

  it("should handle different users correctly", async () => {
    const formData = new FormData();
    formData.append("email", "admin@example.com");
    formData.append("password", "admin123");

    vi.mocked(LoginSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        email: "admin@example.com",
        password: "admin123",
      },
    } as never);

    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(loginAction(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mockCookieStore.set).toHaveBeenCalledWith("auth", "2", expect.any(Object));
  });

  it("should convert FormData entries to object correctly", async () => {
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "password123");
    formData.append("extraField", "extraValue");

    vi.mocked(LoginSchema.safeParse).mockReturnValue({
      success: true,
      data: {
        email: "test@example.com",
        password: "password123",
      },
    } as never);

    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(loginAction(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(LoginSchema.safeParse).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        password: "password123",
      }),
    );
  });
});
