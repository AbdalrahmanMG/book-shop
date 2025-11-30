import z from "zod";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const categories = ["Technology", "Science", "History", "Fantasy", "Biography"] as const;

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

export const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price (e.g., 10.00)"),
  thumbnail: z
    .instanceof(File)
    .or(z.null())
    .refine((file) => file !== null, {
      message: "Thumbnail file is required",
    })
    .refine((file) => file === null || file.size <= MAX_FILE_SIZE, {
      message: "Max file size is 5MB",
    })
    .refine((file) => file === null || ALLOWED_MIME_TYPES.includes(file.type), {
      message: "Only JPG, PNG, and WEBP formats allowed",
    }),
  author: z.string().min(1, "Author is required"),
  category: z.string(),
});

export const baseBookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(10, "Description is required (min 10 chars).").max(5000),
  author: z.string().trim().min(1, "Author is required").max(255),
  category: z.enum(categories, "Category is required"),

  price: z.coerce
    .number("Price must be a number.")
    .positive("Price must be a positive number.")
    .transform((val) => Number(val.toFixed(2))),
});

export const updateBookSchema = baseBookSchema.partial().extend({
  id: z.coerce.number().int().positive("ID must be a positive integer."),
  thumbnail: z
    .instanceof(File, { message: "Thumbnail must be a file object." })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `Max file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
    })
    .refine((file) => ALLOWED_MIME_TYPES.includes(file.type), {
      message: "Only JPG, PNG, and WEBP formats allowed.",
    })
    .optional(),
});

export type BaseBookData = z.infer<typeof baseBookSchema>;
export type UpdateBookPayload = z.infer<typeof updateBookSchema>;
