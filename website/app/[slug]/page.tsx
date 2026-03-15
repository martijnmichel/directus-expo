import { getPageSlugs } from "@/lib/content-slugs";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const mod = await import(`@/content/pages/${slug}.mdx`);
    const meta = (mod as { metadata?: { title?: string; description?: string } }).metadata;
    if (meta?.title) return { title: meta.title, description: meta.description };
  } catch {
    // ignore
  }
  return { title: slug };
}

export default async function PagePage({ params }: Props) {
  const { slug } = await params;
  let Page: React.ComponentType;
  try {
    const mod = await import(`@/content/pages/${slug}.mdx`);
    Page = (mod as { default: React.ComponentType }).default;
  } catch {
    notFound();
  }
  return (
    <div className="container-dense vertical-space">
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <Page />
      </div>
    </div>
  );
}
