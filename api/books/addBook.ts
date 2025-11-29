"use server";

import { readJson } from "@/lib/helper/readJson";
import { uploadImage } from "@/lib/helper/uploadImages";
import { writeJson } from "@/lib/helper/writeJson";
import { Book, categories, VALID_BOOK_CATEGORIES } from "@/types";

type AddBookResult = {
  success: boolean;
  book?: Book;
  message: string;
};

const VALID_CATEGORIES: string[] = Object.values(VALID_BOOK_CATEGORIES);

export async function addBook(formData: FormData): Promise<AddBookResult> {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priceString = formData.get("price") as string;
    const author = formData.get("author") as string;
    const category = formData.get("category") as categories;
    const ownerId = Number(formData.get("ownerId"));
    const file = formData.get("thumbnail") as File;

    const price = Number(priceString);

    if (
      !title ||
      !description ||
      !author ||
      !category ||
      isNaN(ownerId) ||
      ownerId <= 0 ||
      isNaN(price) ||
      price <= 0
    ) {
      return {
        success: false,
        message:
          "Validation failed: Title, description, author, category, price, and owner ID are required and must be valid.",
      };
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return {
        success: false,
        message: `Validation failed: Invalid category '${category}'.`,
      };
    }

    let thumbnail = "";
    if (file instanceof File && file.size > 0) {
      try {
        thumbnail = await uploadImage(file);
      } catch (error) {
        console.error("Image upload failed:", error);
        return {
          success: false,
          message: "Failed to upload book cover image.",
        };
      }
    }

    const books = await readJson<Book[]>("books.json");

    const newId = books.length ? books[books.length - 1].id + 1 : 1;

    const newBook: Book = {
      id: newId,
      title,
      description,
      price: parseFloat(price.toFixed(2)),
      author,
      category,
      ownerId,
      thumbnail,
    };

    books.push(newBook);
    await writeJson("books.json", books);

    return {
      success: true,
      book: newBook,
      message: "Book added successfully!",
    };
  } catch (error) {
    console.error("Server Action Error - addBook:", error);

    return {
      success: false,
      message: "An unexpected error occurred while processing the request.",
    };
  }
}
