import { describe, it, expect } from "vitest";
import { sanitizeUser } from "@/lib/helper/sanitizeUser";
import type { User } from "@/types";

describe("sanitizeUser", () => {
  it("should remove password from user object", () => {
    const user: User = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      password: "secret123",
    };

    const result = sanitizeUser(user);

    expect(result).toEqual({
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    });
    expect(result).not.toHaveProperty("password");
  });

  it("should keep all other properties", () => {
    const user: User = {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      password: "password456",
    };

    const result = sanitizeUser(user);

    expect(result.id).toBe(2);
    expect(result.name).toBe("Jane Smith");
    expect(result.email).toBe("jane@example.com");
  });

  it("should not modify original user object", () => {
    const user: User = {
      id: 3,
      name: "Test User",
      email: "test@example.com",
      password: "testpass",
    };

    const originalPassword = user.password;
    sanitizeUser(user);

    expect(user.password).toBe(originalPassword);
    expect(user).toHaveProperty("password");
  });

  it("should handle user with empty password", () => {
    const user: User = {
      id: 4,
      name: "Empty Pass User",
      email: "empty@example.com",
      password: "",
    };

    const result = sanitizeUser(user);

    expect(result).not.toHaveProperty("password");
    expect(Object.keys(result)).toHaveLength(3);
  });

  it("should return object with correct property count", () => {
    const user: User = {
      id: 5,
      name: "Count Test",
      email: "count@example.com",
      password: "countpass",
    };

    const result = sanitizeUser(user);
    const resultKeys = Object.keys(result);

    expect(resultKeys).toHaveLength(3);
    expect(resultKeys).toContain("id");
    expect(resultKeys).toContain("name");
    expect(resultKeys).toContain("email");
    expect(resultKeys).not.toContain("password");
  });
});
