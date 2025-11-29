export const VALID_BOOK_CATEGORIES = [
  "Technology",
  "Science",
  "History",
  "Fantasy",
  "Biography",
] as const;

export type categories = (typeof VALID_BOOK_CATEGORIES)[number];
export interface Book {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  author: string;
  category: categories;
  ownerId: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  image?: string;
}

export type SafeUserData = Omit<User, "password">;
