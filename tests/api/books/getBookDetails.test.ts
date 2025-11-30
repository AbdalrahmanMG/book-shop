import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBookDetails } from "@/api/books/actions";
import { readJson } from "@/lib/helper/readJson";
import type { Book } from "@/types";

vi.mock("@/lib/helper/readJson", () => ({
  readJson: vi.fn(),
}));

describe("getBookDetails", () => {
  const mockBooks: Book[] = [
    {
      id: 1,
      title: "First Book",
      description: "First Description",
      price: 20,
      author: "Author One",
      category: "Technology",
      ownerId: 1,
      thumbnail: "/image1.jpg",
    },
    {
      id: 2,
      title: "Second Book",
      description: "Second Description",
      price: 30,
      author: "Author Two",
      category: "Science",
      ownerId: 2,
      thumbnail: "/image2.jpg",
    },
    {
      id: 3,
      title: "Third Book",
      description: "Third Description",
      price: 40,
      author: "Author Three",
      category: "History",
      ownerId: 1,
      thumbnail: "",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readJson<Book[]>).mockResolvedValue([...mockBooks]);
  });

  it("should return book when found", async () => {
    const result = await getBookDetails(2);

    expect(result).toEqual({
      id: 2,
      title: "Second Book",
      description: "Second Description",
      price: 30,
      author: "Author Two",
      category: "Science",
      ownerId: 2,
      thumbnail: "/image2.jpg",
    });
  });

  it("should return null when book not found", async () => {
    const result = await getBookDetails(999);

    expect(result).toBeNull();
  });

  it("should return null when ID is zero", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getBookDetails(0);

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Invalid book ID provided:", 0);

    consoleErrorSpy.mockRestore();
  });

  it("should throw error when file read fails", async () => {
    vi.mocked(readJson<Book[]>).mockRejectedValue(new Error("File read error"));

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getBookDetails(1)).rejects.toThrow(
      "Failed to retrieve book details due to a file system error.",
    );

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should return first book correctly", async () => {
    const result = await getBookDetails(1);

    expect(result).toEqual(mockBooks[0]);
  });

  it("should return last book correctly", async () => {
    const result = await getBookDetails(3);

    expect(result).toEqual(mockBooks[2]);
  });

  it("should call readJson with correct parameters", async () => {
    await getBookDetails(1);

    expect(readJson).toHaveBeenCalledWith("books.json");
  });

  it("should handle empty books array", async () => {
    vi.mocked(readJson<Book[]>).mockResolvedValue([]);

    const result = await getBookDetails(1);

    expect(result).toBeNull();
  });

  it("should find book by exact ID match", async () => {
    const result = await getBookDetails(2);

    expect(result?.id).toBe(2);
    expect(result?.title).toBe("Second Book");
  });

  it("should return complete book object with all properties", async () => {
    const result = await getBookDetails(1);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("price");
    expect(result).toHaveProperty("author");
    expect(result).toHaveProperty("category");
    expect(result).toHaveProperty("ownerId");
    expect(result).toHaveProperty("thumbnail");
  });
});
