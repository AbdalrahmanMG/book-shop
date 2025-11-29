import { VALID_BOOK_CATEGORIES } from "@/types";
import z from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Price must be a positive number"),
  thumbnail: z
    .any()
    .refine((file) => file instanceof File && file.size > 0, "Thumbnail file is required")
    .refine((file) => file.size <= 5 * 1024 * 1024, "Max file size is 5MB."),
  author: z.string().min(1, "Author is required"),
  category: z.string().refine((val) => (VALID_BOOK_CATEGORIES as readonly string[]).includes(val), {
    message: "Please select a valid category.",
  }),
});
