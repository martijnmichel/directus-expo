import { StoreButtons } from "@/components/store-buttons";
import { getBlogSlugs } from "@/lib/content-slugs";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

type BlogMeta = {
  title?: string;
  description?: string;
  date?: string;
  image?: string;
};

export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const mod = await import(`@/content/blog/${slug}.mdx`);
    const meta = (mod as { metadata?: BlogMeta }).metadata;
    if (!meta) return { title: "Blog" };
    const title = meta.title ? `${meta.title} | Blog` : "Blog";
    const metadata: Metadata = {
      title,
      description: meta.description,
    };
    if (meta.image) {
      metadata.openGraph = { images: [{ url: meta.image }] };
    }
    return metadata;
  } catch {
    // ignore
  }
  return { title: "Blog" };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let Post: React.ComponentType;
  let meta: BlogMeta | undefined;
  try {
    const mod = await import(`@/content/blog/${slug}.mdx`);
    Post = (mod as { default: React.ComponentType }).default;
    meta = (mod as { metadata?: BlogMeta }).metadata;
  } catch {
    notFound();
  }

  const showImage = Boolean(meta?.image);
  const imageSrc = meta?.image ?? "/blog/placeholder.svg";

  return (
    <div className="container-dense vertical-space">
      <Link
        href="/blog"
        className="text-primary hover:underline mb-6 inline-block"
      >
        ← Blog
      </Link>
      {showImage && (
        <div className="aspect-[16/9] relative rounded-lg overflow-hidden mb-8 bg-neutral-100 dark:bg-neutral-800">
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
            priority
          />
        </div>
      )}
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <Post />
      </div>

      <div className="pt-32" />

      <section className="">
        <StoreButtons />
      </section>
    </div>
  );
}
