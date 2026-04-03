"use client";

import { Copy, Facebook, Link2, Twitter } from "lucide-react";
import { useEffect, useState } from "react";

type TocItem = {
  id: string;
  text: string;
  level: 2 | 3 | 4;
};

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getHeadingText(el: Element) {
  // Ignore nested controls like buttons/links inside headings.
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function BlogTableOfContents({
  rootId,
  className,
}: {
  rootId: string;
  className?: string;
}) {
  const [items, setItems] = useState<TocItem[]>([]);

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const headings = Array.from(
      root.querySelectorAll("h2[id], h2, h3[id], h3, h4[id], h4"),
    );

    const counts = new Map<string, number>();
    const tocItems: TocItem[] = [];

    for (const heading of headings) {
      const tag = heading.tagName.toLowerCase();
      const level = tag === "h2" ? 2 : tag === "h3" ? 3 : tag === "h4" ? 4 : null;
      if (!level) continue;

      const text = getHeadingText(heading);
      if (!text) continue;

      const baseId = (heading as HTMLElement).id
        ? (heading as HTMLElement).id
        : slugify(text);
      const current = counts.get(baseId) ?? 0;
      const id = current > 0 ? `${baseId}-${current + 1}` : baseId;
      counts.set(baseId, current + 1);

      (heading as HTMLElement).id = id;
      // Helps anchor links land correctly with sticky headers.
      (heading as HTMLElement).style.scrollMarginTop = "96px";

      tocItems.push({ id, text, level });
    }

    setItems(tocItems.filter((i) => i.level === 2 || i.level === 3));
  }, [rootId]);

  if (items.length === 0) return null;

  return (
    <nav className={className} aria-label="Table of contents">
      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
        On this page
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={[
                "block text-sm hover:text-primary transition-colors",
                item.level === 3 ? "pl-3" : "pl-0",
              ].join(" ")}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function BlogShareButtons({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  async function copyLink() {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for environments without clipboard permissions.
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.top = "-1000px";
      textarea.style.left = "-1000px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }

  function shareTwitter() {
    const shareUrl = window.location.href;
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function shareFacebook() {
    const shareUrl = window.location.href;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl,
      )}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className={className} aria-label="Share this post">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 px-3 py-2 text-sm hover:bg-neutral-100/60 dark:hover:bg-neutral-900/40 transition-colors"
        >
          {copied ? (
            <span className="text-primary font-medium">Copied</span>
          ) : (
            <>
              <Copy className="size-4" />
              <span>Copy link</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={shareTwitter}
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 p-2 hover:bg-neutral-100/60 dark:hover:bg-neutral-900/40 transition-colors"
          aria-label="Share on X"
        >
          <Twitter className="size-4" />
        </button>

        <button
          type="button"
          onClick={shareFacebook}
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 p-2 hover:bg-neutral-100/60 dark:hover:bg-neutral-900/40 transition-colors"
          aria-label="Share on Facebook"
        >
          <Facebook className="size-4" />
        </button>

        {/* Small "link" icon to match the Expo-style share affordance */}
        <a
          href={url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center justify-center rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 p-2 hover:bg-neutral-100/60 dark:hover:bg-neutral-900/40 transition-colors"
          aria-label="Open original link"
          onClick={(e) => {
            if (!url) e.preventDefault();
          }}
        >
          <Link2 className="size-4" />
        </a>
      </div>
    </div>
  );
}

