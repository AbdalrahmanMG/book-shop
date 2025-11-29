"use server";

import { readJson } from "@/lib/helper/readJson";
import { Book } from "@/types";

export async function getBookDetails(id: number): Promise<Book | null> {
  if (typeof id !== "number" || id <= 0 || isNaN(id)) {
    console.error("Invalid book ID provided:", id);
    return null;
  }

  try {
    const books = await readJson<Book[]>("books.json");

    const book = books.find((b) => b.id === id);

    return book || null;
  } catch (error) {
    console.error(`[File Read Error] Failed to read books data while looking for ID ${id}:`, error);

    throw new Error(`Failed to retrieve book details due to a file system error.`);
  }
}
