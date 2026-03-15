import { getBlogSlugs } from "@/lib/content-slugs";
import Link from "next/link";

export const metadata = {
  title: "Blog",
  description: "Blog and updates",
};

export default async function BlogIndexPage() {
  const slugs = await getBlogSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const mod = await import(`@/content/blog/${slug}.mdx`);
        const meta = (mod as { metadata?: { title?: string; date?: string } }).metadata;
        return { slug, title: meta?.title ?? slug, date: meta?.date };
      } catch {
        return { slug, title: slug, date: undefined };
      }
    })
  );
  posts.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return (
    <div className="container-dense vertical-space">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      <ul className="space-y-4">
        {posts.map(({ slug, title, date }) => (
          <li key={slug}>
            <Link href={`/blog/${slug}`} className="text-primary hover:underline font-medium">
              {title}
            </Link>
            {date && (
              <span className="text-muted-foreground text-sm ml-2">{date}</span>
            )}
          </li>
        ))}
      </ul>
      {posts.length === 0 && (
        <p className="text-muted-foreground">No posts yet. Add .mdx files in <code>content/blog/</code>.</p>
      )}
    </div>
  );
}
