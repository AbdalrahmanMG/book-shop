import path from "path";
import fs from "fs/promises";

export async function writeJson<T>(file: string, data: T): Promise<void> {
  const dbDir = path.join(process.cwd(), "db");
  const filePath = path.join(dbDir, file);

  try {
    await fs.mkdir(dbDir, { recursive: true });

    const jsonString = JSON.stringify(data, null, 2);

    await fs.writeFile(filePath, jsonString, "utf-8");
  } catch (error) {
    console.error(`[File Write Error] Failed to write JSON to ${filePath}:`, error);
    throw new Error(`Failed to save data to the file system.`);
  }
}
