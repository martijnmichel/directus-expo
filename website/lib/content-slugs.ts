import fs from "fs/promises";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");

export async function getBlogSlugs(): Promise<string[]> {
  const dir = path.join(CONTENT_DIR, "blog");
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && /\.(md|mdx)$/.test(e.name))
      .map((e) => e.name.replace(/\.(md|mdx)$/, ""));
  } catch {
    return [];
  }
}

export async function getPageSlugs(): Promise<string[]> {
  const dir = path.join(CONTENT_DIR, "pages");
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && /\.(md|mdx)$/.test(e.name))
      .map((e) => e.name.replace(/\.(md|mdx)$/, ""));
  } catch {
    return [];
  }
}

export async function getDocsSlugs(): Promise<string[]> {
  const dir = path.join(CONTENT_DIR, "docs");
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && /\.(md|mdx)$/.test(e.name))
      .map((e) => e.name.replace(/\.(md|mdx)$/, ""));
  } catch {
    return [];
  }
}
