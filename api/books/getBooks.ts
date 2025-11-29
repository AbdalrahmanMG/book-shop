"use server";

import { readJson } from "@/lib/helper/readJson";
import { Book } from "@/types";

interface GetBooksOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: "asc" | "desc" | "none";
  bookOwnerId?: number | null;
}

export async function getBooks({
  page = 1,
  pageSize = 10,
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

  if (sort) {
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
