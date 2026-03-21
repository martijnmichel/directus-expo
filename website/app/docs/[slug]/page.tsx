import { StoreButtons } from "@/components/store-buttons";
import { getDocsSlugs } from "@/lib/content-slugs";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

type DocsMeta = {
  title?: string;
  description?: string;
};

export async function generateStaticParams() {
  const slugs = await getDocsSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const mod = await import(`@/content/docs/${slug}.mdx`);
    const meta = (mod as { metadata?: DocsMeta }).metadata;
    if (!meta) return { title: "Docs" };
    return {
      title: meta.title ? `${meta.title} | Docs` : "Docs",
      description: meta.description,
    };
  } catch {
    return { title: "Docs" };
  }
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  let Doc: React.ComponentType;
  try {
    const mod = await import(`@/content/docs/${slug}.mdx`);
    Doc = (mod as { default: React.ComponentType }).default;
  } catch {
    notFound();
  }

  return (
    <div className="container-dense vertical-space">
      <Link href="/docs" className="text-primary hover:underline mb-6 inline-block">
        ← Docs
      </Link>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <Doc />
      </div>

      <div className="pt-32" />
      <StoreButtons />
    </div>
  );
}
