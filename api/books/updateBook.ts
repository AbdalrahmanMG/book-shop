"use server";

import { readJson } from "@/lib/helper/readJson";
import { uploadImage } from "@/lib/helper/uploadImages";
import { writeJson } from "@/lib/helper/writeJson";
import { Book } from "@/types";
import { updateBookSchema } from "@/validation/auth";
import { cookies } from "next/headers";
import z from "zod";

type ValidatedUpdateData = z.output<typeof updateBookSchema>;
const AUTH_COOKIE_NAME = "auth";

export async function updateBook(formData: FormData): Promise<Book | { error: string }> {
  const cookiesStore = await cookies();
  const userCookies = cookiesStore.get(AUTH_COOKIE_NAME);

  if (!userCookies) {
    return { error: "Authentication cookie not found." };
  }
  const id = formData.get("id");
  if (!id) {
    return { error: "Book ID is missing." };
  }

  const dataToValidate = {
    id,
    description: formData.get("description"),
    title: formData.get("title"),
    price: formData.get("price"),
    author: formData.get("author"),
    category: formData.get("category"),
  };

  const validationResult = updateBookSchema.safeParse(dataToValidate);

  if (!validationResult.success) {
    return { error: validationResult.error.issues[0].message };
  }

  const validatedData = validationResult.data as ValidatedUpdateData;
  const bookId = validatedData.id;

  const file = formData.get("thumbnail");
  let newThumbnailUrl: string | undefined;

  if (file instanceof File && file.size > 0) {
    try {
      newThumbnailUrl = await uploadImage(file);
    } catch (e) {
      console.error("Image upload failed:", e);
      return { error: "Failed to upload new thumbnail image." };
    }
  }

  let books: Book[];
  try {
    books = await readJson<Book[]>("books.json");
  } catch (e) {
    console.error("Failed to read books.json:", e);
    return { error: "Failed to access book data." };
  }

  const index = books.findIndex((b) => String(b.id) === String(bookId));
  if (index === -1) {
    return { error: `Book with ID ${bookId} not found.` };
  }

  const existingBook = books[index];

  const updatedBook: Book = {
    ...existingBook,
    title: validatedData.title ?? existingBook.title,
    price: validatedData.price ?? existingBook.price,
    author: validatedData.author ?? existingBook.author,
    category: validatedData.category ?? existingBook.category,
    thumbnail: newThumbnailUrl ?? existingBook.thumbnail,
  };

  try {
    books[index] = updatedBook;
    await writeJson("books.json", books);
  } catch (e) {
    console.error("Failed to write books.json:", e);
    return { error: "Failed to save updated book data." };
  }

  return updatedBook;
}
