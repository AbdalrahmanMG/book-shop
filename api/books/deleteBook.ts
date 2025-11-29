"use server";

import { readJson } from "@/lib/helper/readJson";
import { writeJson } from "@/lib/helper/writeJson";
import { Book } from "@/types";

type DeleteResult = {
  success: boolean;
  message: string;
};

export async function deleteBook(id: number): Promise<DeleteResult> {
  if (typeof id !== "number" || id <= 0) {
    return {
      success: false,
      message: "Invalid book ID provided.",
    };
  }

  try {
    const books = await readJson<Book[]>("books.json");

    const updatedBooks = books.filter((b) => b.id !== id);

    if (updatedBooks.length === books.length) {
      return {
        success: false,
        message: `Book with ID ${id} not found.`,
      };
    }

    await writeJson("books.json", updatedBooks);

    return {
      success: true,
      message: `Book with ID ${id} deleted successfully.`,
    };
  } catch (error) {
    console.error("Error deleting book:", error);

    return {
      success: false,
      message: "A file system error occurred during deletion.",
    };
  }
}
