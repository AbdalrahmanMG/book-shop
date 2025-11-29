import path from "path";
import fs from "fs/promises";
import mime from "mime-types";

export async function uploadImage(file: File): Promise<string> {
  const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Invalid or empty file provided.");
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds the 5MB limit.");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    const extension = path.extname(file.name).toLowerCase();
    const detectedMime = mime.lookup(extension);

    if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime)) {
      throw new Error(
        `Unsupported file type: ${file.type || extension}. Only JPEG, PNG, and WebP are allowed.`,
      );
    }
  }

  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExtension = path.extname(file.name);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileName = `upload-${uniqueSuffix}${fileExtension}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    await fs.writeFile(filePath, buffer);

    return `/uploads/${fileName}`;
  } catch (error) {
    console.error(`[Upload Error] Failed to process or save file ${file.name}:`, error);
    throw new Error("Failed to save the image file to the server.");
  }
}
