import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logoutAction } from "@/api/auth/actions";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("logoutAction", () => {
  const mockCookieStore = {
    delete: vi.fn(),
  } as unknown as ReadonlyRequestCookies;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
  });

  it("should delete auth cookie and redirect to login", async () => {
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("should call delete before redirect", async () => {
    const callOrder: string[] = [];

    (mockCookieStore.delete as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push("delete");
    });

    vi.mocked(redirect).mockImplementation(() => {
      callOrder.push("redirect");
      throw new Error("NEXT_REDIRECT");
    });

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT");

    expect(callOrder).toEqual(["delete", "redirect"]);
  });
});
