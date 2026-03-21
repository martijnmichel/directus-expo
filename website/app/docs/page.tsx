import { getDocsSlugs } from "@/lib/content-slugs";
import Link from "next/link";

type DocsMeta = {
  title?: string;
  description?: string;
  audience?: string[];
};

export const metadata = {
  title: "Docs",
  description: "Documentation for Directus Mobile features and setup.",
};

export default async function DocsIndexPage() {
  const slugs = await getDocsSlugs();
  const docs = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const mod = await import(`@/content/docs/${slug}.mdx`);
        const meta = (mod as { metadata?: DocsMeta }).metadata ?? {};
        return {
          slug,
          title: meta.title ?? slug,
          description: meta.description ?? undefined,
          audience: meta.audience ?? [],
        };
      } catch {
        return {
          slug,
          title: slug,
          description: undefined,
          audience: [],
        };
      }
    }),
  );

  docs.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-3">Docs</h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-10">
        Practical guides for admins and end users.
      </p>

      <ul className="space-y-6">
        {docs.map(({ slug, title, description, audience }) => (
          <li key={slug} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-5">
            <Link href={`/docs/${slug}`} className="group block">
              {audience.length > 0 && (
                <p className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-2">
                  {audience.join(" • ")}
                </p>
              )}
              <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                {title}
              </h2>
              {description && (
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">{description}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {docs.length === 0 && (
        <p className="text-neutral-500 mt-8">
          No docs yet. Add `.mdx` files in{" "}
          <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1">content/docs/</code>.
        </p>
      )}
    </div>
  );
}
