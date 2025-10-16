import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { SoftwareApplication, WithContext } from "schema-dts";
import { images } from "@/screenshots";

const jsonLd: WithContext<SoftwareApplication> = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Directus Mobile",
  image: "https://directusmobile.app/app-icon.png",
  description: "The iOS and Android companion app for your Directus backend",
  applicationCategory: "MobileApplication",
  operatingSystem: "iOS, Android",
  url: "https://directusmobile.app",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://directusmobile.app"),
  title: "Directus Mobile - iOS and Android app",
  description:
    "Manage your Directus CMS on the go with our iOS and Android mobile app. Access and edit content, and handle assets from anywhere. Fast, secure, and user-friendly.",
  openGraph: {
    title: "Directus Mobile - iOS and Android app",
    description:
      "Manage your Directus CMS on the go with our iOS and Android mobile app. Access and edit content, and handle assets from anywhere. Fast, secure, and user-friendly.",
    images: [
      { url: "https://directusmobile.app/app-icon.png" },
      ...images.map((image) => ({ url: image.src })),
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased py-32`}
      >
        
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-zinc-100 shadow-xs backdrop-blur-sm">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <nav className="flex items-center gap-6 text-zinc-600 text-sm tracking-wide ">
              <Link href="/" className="flex items-center gap-2 p-3">
                <Image
                  src="/icon.png"
                  alt="Directus Mobile - ios and android app icon"
                  width={50}
                  height={50}
                  className="rounded"
                />
              </Link>
              <Link href="/" className="hover:text-pink-500 transition-colors">
                Home
              </Link>
              <Link
                href="/#features"
                className="hover:text-pink-500  transition-colors"
              >
                Features
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <a
                href="https://github.com/martijnmichel/directus-expo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub repository link"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
                  />
                </svg>
              </a>
            </div>
          </div>
        </header>
        {children}

        <script defer src="https://umami.martijnvde.nl/script.js" data-website-id="a6cc600a-7526-412a-bcae-ec9a09319b48"></script>
      </body>
    </html>
  );
}
