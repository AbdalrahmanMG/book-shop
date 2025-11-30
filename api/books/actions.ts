"use server";

import { readJson } from "@/lib/helper/readJson";
import { uploadImage } from "@/lib/helper/uploadImages";
import { writeJson } from "@/lib/helper/writeJson";
import { categories, VALID_BOOK_CATEGORIES, Book } from "@/types";
import { cookies } from "next/headers";
import { updateBookSchema } from "@/validation/auth";
import z from "zod";

type ValidatedUpdateData = z.output<typeof updateBookSchema>;

type AddBookResult = {
  success: boolean;
  book?: Book;
  message: string;
};

type DeleteResult = {
  success: boolean;
  message: string;
};

interface GetBooksOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: "asc" | "desc" | "none";
  bookOwnerId?: number | null;
}

const VALID_CATEGORIES: string[] = Object.values(VALID_BOOK_CATEGORIES);
const AUTH_COOKIE_NAME = "auth";

export async function getBooks({
  page = 1,
  pageSize = 12,
  search = "",
  sort = "none",
  bookOwnerId = null,
}: GetBooksOptions) {
  let books = await readJson<Book[]>("books.json");

  if (bookOwnerId) {
    books = books.filter((book) => book.ownerId === bookOwnerId);
  }

  if (search) {
    books = books.filter((book) => book.title.toLowerCase().includes(search.toLowerCase()));
  }

  if (sort !== "none") {
    books.sort((a, b) => {
      return sort === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
    });
  }

  const total = books.length;
  const pages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paginatedBooks = books.slice(start, start + pageSize);

  return { books: paginatedBooks, total, pages };
}

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

export async function addBook(formData: FormData): Promise<AddBookResult> {
  const cookiesStore = await cookies();
  const userCookies = cookiesStore.get(AUTH_COOKIE_NAME);

  if (!userCookies) {
    return { success: false, message: "Authentication cookie not found." };
  }
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

export async function deleteBook(id: number): Promise<DeleteResult> {
  const cookiesStore = await cookies();
  const userCookies = cookiesStore.get(AUTH_COOKIE_NAME);

  if (!userCookies) {
    return { success: false, message: "Authentication cookie not found." };
  }

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
