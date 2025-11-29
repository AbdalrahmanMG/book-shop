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

export type categories = "Technology" | "Science" | "History" | "Fantasy" | "Biography";

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  image?: string;
}

export type SafeUserData = Omit<User, "password">;
