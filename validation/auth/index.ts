import z from "zod";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
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
