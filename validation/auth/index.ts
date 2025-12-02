import { VALID_BOOK_CATEGORIES } from "@/types";
import z from "zod";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const LoginSchema = z.object({
  email: z
    .string({ message: "Email is required." })
    .min(1, { message: "Email is required." })
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email address." })
    .regex(EMAIL_REGEX, { message: "Invalid email address." }),
  password: z
    .string({ message: "Password is required." })
    .min(1, { message: "Password is required." })
    .min(6, { message: "Password must be at least 6 characters." }),
});

const baseBookFields = {
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(10, "Description is required (min 10 chars)").max(5000),
  author: z.string().trim().min(1, "Author is required").max(255),
  category: z.enum(VALID_BOOK_CATEGORIES, { message: "Category is required" }),
  price: z
    .string()
    .min(1, "Price is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price (e.g., 10.00)"),
};

export const addBookSchema = z.object({
  ...baseBookFields,
  thumbnail: z
    .instanceof(File, { message: "Thumbnail file is required" })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `Max file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    })
    .refine((file) => ALLOWED_MIME_TYPES.includes(file.type), {
      message: "Only JPG, PNG, and WEBP formats allowed",
    })
    .nullable()
    .refine((file) => file !== null, {
      message: "Thumbnail file is required",
    }),
});

export const updateBookSchema = z.object({
  ...baseBookFields,
  id: z.string().min(1, "Book ID is required").optional(),
  thumbnail: z
    .union([
      z
        .instanceof(File)
        .refine((file) => file.size <= MAX_FILE_SIZE, {
          message: `Max file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        })
        .refine((file) => ALLOWED_MIME_TYPES.includes(file.type), {
          message: "Only JPG, PNG, and WEBP formats allowed",
        }),
      z.string(),
    ])
    .nullable()
    .optional(),
});

export type AddBookFormData = z.infer<typeof addBookSchema>;
export type UpdateBookFormData = z.infer<typeof updateBookSchema>;

export const bookSchema = addBookSchema;
