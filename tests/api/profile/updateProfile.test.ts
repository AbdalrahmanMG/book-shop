import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { readJson } from "@/lib/helper/readJson";
import { writeJson } from "@/lib/helper/writeJson";
import { User } from "@/types";
import { updateProfileAction } from "@/api/profile";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/helper/readJson", () => ({
  readJson: vi.fn(),
}));

vi.mock("@/lib/helper/writeJson", () => ({
  writeJson: vi.fn(),
}));

type MockCookiesStore = {
  get: (name: string) => { name: string; value: string } | undefined;
  delete: (name: string) => void;
};

describe("updateProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when auth cookie is missing", async () => {
    const mockStore: MockCookiesStore = {
      get: () => undefined,
      delete: () => {},
    };

    (vi.mocked(cookies) as ReturnType<typeof vi.fn>).mockResolvedValue(mockStore);

    const result = await updateProfileAction({
      name: "new",
      email: "new@example.com",
    });

    expect(result).toEqual({ error: "Authentication cookie not found." });
  });

  it("returns error when user not found", async () => {
    const mockStore: MockCookiesStore = {
      get: () => ({ name: "auth", value: "99" }),
      delete: () => {},
    };

    (vi.mocked(cookies) as ReturnType<typeof vi.fn>).mockResolvedValue(mockStore);
    vi.mocked(readJson).mockResolvedValue([{ id: 1, name: "A", email: "a@a.com" }] as User[]);

    const result = await updateProfileAction({
      name: "new",
      email: "new@example.com",
    });

    expect(result).toEqual({ error: "User with ID 99 not found." });
  });

  it("updates user successfully", async () => {
    const mockStore: MockCookiesStore = {
      get: () => ({ name: "auth", value: "1" }),
      delete: () => {},
    };

    (vi.mocked(cookies) as ReturnType<typeof vi.fn>).mockResolvedValue(mockStore);

    const fakeUsers: Omit<User, "password">[] = [
      { id: 1, name: "Old Name", email: "old@example.com" },
    ];

    vi.mocked(readJson).mockResolvedValue(fakeUsers);

    vi.mocked(writeJson).mockResolvedValue(undefined);

    const result = await updateProfileAction({
      name: "New Name",
      email: "new@example.com",
    });

    expect(writeJson).toHaveBeenCalledWith("users.json", [
      {
        id: 1,
        name: "New Name",
        email: "new@example.com",
      },
    ]);

    expect(result).toEqual({
      id: 1,
      name: "New Name",
      email: "new@example.com",
    });
  });

  it("returns error when saving file fails", async () => {
    const mockStore: MockCookiesStore = {
      get: () => ({ name: "auth", value: "1" }),
      delete: () => {},
    };

    (vi.mocked(cookies) as ReturnType<typeof vi.fn>).mockResolvedValue(mockStore);

    const fakeUsers: User[] = [{ id: 1, name: "AA", email: "aa@aa.com", password: "password123" }];

    vi.mocked(readJson).mockResolvedValue(fakeUsers);

    vi.mocked(writeJson).mockRejectedValue(new Error("save error"));

    const result = await updateProfileAction({
      name: "BB",
      email: "bb@bb.com",
    });

    expect((result as { error: string }).error).toContain("Failed to save updated user data:");
  });
});
