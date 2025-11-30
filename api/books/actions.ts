"use server";

import { uploadImage } from "@/lib/helper/uploadImages";
import { categories, VALID_BOOK_CATEGORIES, Book } from "@/types";
import { cookies } from "next/headers";
import { updateBookSchema } from "@/validation/auth";
import z from "zod";
import { supabase } from "@/lib/supabase";

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
  let query = supabase.from("books").select("*", { count: "exact" });

  if (bookOwnerId) {
    query = query.eq("owner_id", bookOwnerId);
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (sort !== "none") {
    query = query.order("title", { ascending: sort === "asc" });
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  query = query.range(start, end);

  const { data: books, error, count } = await query;

  if (error) {
    console.error("Error fetching books:", error);
    return { books: [], total: 0, pages: 0 };
  }

  const total = count || 0;
  const pages = Math.ceil(total / pageSize);

  return { books: books || [], total, pages };
}

export async function getBookDetails(id: number): Promise<Book | null> {
  if (typeof id !== "number" || id <= 0 || isNaN(id)) {
    console.error("Invalid book ID provided:", id);
    return null;
  }

  try {
    const { data: book, error } = await supabase.from("books").select("*").eq("id", id).single();

    if (error) {
      console.error(`Error fetching book with ID ${id}:`, error);
      return null;
    }

    return book;
  } catch (error) {
    console.error(`Failed to retrieve book details for ID ${id}:`, error);
    throw new Error(`Failed to retrieve book details due to an error.`);
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
    const owner_id = Number(formData.get("owner_id"));
    const file = formData.get("thumbnail") as File;

    const price = Number(priceString);

    if (
      !title ||
      !description ||
      !author ||
      !category ||
      isNaN(owner_id) ||
      owner_id <= 0 ||
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

    const newBook = {
      title,
      description,
      price: parseFloat(price.toFixed(2)),
      author,
      category,
      owner_id,
      thumbnail,
    };

    const { data, error } = await supabase.from("books").insert(newBook).select().single();

    if (error) {
      console.error("Error adding book:", error);
      return {
        success: false,
        message: "Failed to add book to database.",
      };
    }

    return {
      success: true,
      book: data,
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
    const { error } = await supabase.from("books").delete().eq("id", id);

    if (error) {
      console.error("Error deleting book:", error);
      return {
        success: false,
        message: `Failed to delete book with ID ${id}.`,
      };
    }

    return {
      success: true,
      message: `Book with ID ${id} deleted successfully.`,
    };
  } catch (error) {
    console.error("Error deleting book:", error);

    return {
      success: false,
      message: "An error occurred during deletion.",
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

  const { data: existingBook, error: fetchError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single();

  if (fetchError || !existingBook) {
    return { error: `Book with ID ${bookId} not found.` };
  }

  const updatedBook = {
    title: validatedData.title ?? existingBook.title,
    price: validatedData.price ?? existingBook.price,
    author: validatedData.author ?? existingBook.author,
    category: validatedData.category ?? existingBook.category,
    thumbnail: newThumbnailUrl ?? existingBook.thumbnail,
  };

  const { data, error } = await supabase
    .from("books")
    .update(updatedBook)
    .eq("id", bookId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update book:", error);
    return { error: "Failed to save updated book data." };
  }

  return data;
}
