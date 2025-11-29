import path from "path";
import fs from "fs/promises";

export async function readJson<T>(file: string): Promise<T> {
  const filePath = path.join(process.cwd(), "db", file);
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}
