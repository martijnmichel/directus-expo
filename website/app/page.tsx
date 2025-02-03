import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background pointer-events-none z-0">
        <div className="fixed inset-0 pattern opacity-70 animate-subtle-spin" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-32 px-4 text-center">
        {/* Announcement banner */}
        <div className="mb-16">
          <a
            href="https://github.com/sponsors/martijnmichel"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 text-sm hover:bg-black/10 transition-colors"
          >
            Sponsor the development of Directus Mobile →
          </a>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-6xl font-bold max-w-4xl mb-6">
          The{" "}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Native Mobile App
          </span>{" "}
          for Your <span className="text-foreground">Directus Backend</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mb-12">
          Built for teams who need seamless access to their Directus content.
          Manage your data, handle assets, and control permissions — all through
          an intuitive mobile interface.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <a
            href="https://apps.apple.com"
            className="bg-foreground text-background px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Download for iOS
          </a>
          <a
            href="https://play.google.com"
            className="bg-black/5 px-6 py-3 rounded-lg font-medium hover:bg-black/10 transition-colors"
          >
            Get it on Android
          </a>
        </div>

        {/* Image Carousel */}
        <div className="carousel-container mt-20 w-full max-w-4xl mx-auto h-[400px] overflow-hidden relative">
          <div className="carousel h-full">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="carousel-item">
                <Image
                  key={index + "image"}
                  src={`/${index + 1}.png`}
                  alt={`Carousel Image ${index + 1}`}
                  fill
                  className="object-contain h-full w-auto"
                />
              </div>
            ))}	
          </div>
        </div>
      </div>

      <div></div>
    </div>
  );
}
