import { getBlogSlugs } from "@/lib/content-slugs";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const mod = await import(`@/content/blog/${slug}.mdx`);
    const meta = (mod as { metadata?: { title?: string; description?: string } }).metadata;
    if (meta?.title)
      return { title: `${meta.title} | Blog`, description: meta.description };
  } catch {
    // ignore
  }
  return { title: "Blog" };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let Post: React.ComponentType;
  try {
    const mod = await import(`@/content/blog/${slug}.mdx`);
    Post = (mod as { default: React.ComponentType }).default;
  } catch {
    notFound();
  }
  return (
    <div className="container-dense vertical-space">
      <Link href="/blog" className="text-primary hover:underline mb-6 inline-block">
        ← Blog
      </Link>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <Post />
      </div>
    </div>
  );
}
