import { getBlogSlugs } from "@/lib/content-slugs";
import Image from "next/image";
import Link from "next/link";

type BlogMeta = {
  title?: string;
  description?: string;
  date?: string;
  image?: string;
  tags?: string[];
  readTime?: string;
};

export const metadata = {
  title: "Blog",
  description: "Blog and updates",
};

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default async function BlogIndexPage() {
  const slugs = await getBlogSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const mod = await import(`@/content/blog/${slug}.mdx`);
        const meta = (mod as { metadata?: BlogMeta }).metadata ?? {};
        return {
          slug,
          title: meta.title ?? slug,
          description: meta.description ?? undefined,
          date: meta.date ?? undefined,
          image: meta.image ?? undefined,
          tags: meta.tags ?? undefined,
          readTime: meta.readTime ?? undefined,
        };
      } catch {
        return {
          slug,
          title: slug,
          description: undefined,
          date: undefined,
          image: undefined,
          tags: undefined,
          readTime: undefined,
        };
      }
    })
  );
  posts.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-10">Blog</h1>
      <ul className="space-y-12">
        {posts.map(({ slug, title, description, date, image, tags, readTime }) => {
          const formattedDate = formatDate(date);
          const metaLine = [formattedDate, readTime].filter(Boolean).join(" • ");
          return (
            <li key={slug}>
              <Link href={`/blog/${slug}`} className="group block">
                <div className="aspect-[16/9] relative rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-3">
                  <Image
                    src={image ?? "/blog/placeholder.svg"}
                    alt=""
                    fill
                    className="object-cover transition-transform group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 896px"
                  />
                </div>
                {tags && tags.length > 0 && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    {tags.join(", ")}
                  </p>
                )}
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-primary">
                  {title}
                </h2>
                {description && (
                  <p className="mt-2 text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    {description}
                  </p>
                )}
                {metaLine && (
                  <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-500">
                    {metaLine}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {posts.length === 0 && (
        <p className="text-neutral-500">
          No posts yet. Add .mdx files in{" "}
          <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1">
            content/blog/
          </code>
          .
        </p>
      )}
    </div>
  );
}
