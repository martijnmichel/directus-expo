import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CHANGELOG_URL =
  "https://raw.githubusercontent.com/martijnmichel/directus-expo/main/CHANGELOG.md";

async function fetchChangelog(): Promise<string> {
  const res = await fetch(CHANGELOG_URL, {
    next: { revalidate: 3600 }, // revalidate every hour
  });
  if (!res.ok) throw new Error("Failed to fetch changelog");
  return res.text();
}

export const metadata: Metadata = {
  title: "Changelog",
  description: "Release history and changes for directus-expo",
};

export default async function ChangelogPage() {
  let markdown: string;
  try {
    markdown = await fetchChangelog();
  } catch {
    return (
      <div className="container-dense vertical-space">
        <Link href="/" className="text-primary hover:underline mb-6 inline-block">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold">Changelog</h1>
        <p className="mt-4 text-muted-foreground">
          Could not load the changelog. You can view it on{" "}
          <a
            href="https://github.com/martijnmichel/directus-expo/blob/main/CHANGELOG.md"
            className="text-primary hover:underline"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="container-dense vertical-space">
      <Link href="/" className="text-primary hover:underline mb-6 inline-block">
        ← Home
      </Link>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}
