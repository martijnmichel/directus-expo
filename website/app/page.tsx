import SwiperScreenshots from "@/components/swiper-screenshots";
import Image from "next/image";

export default function Home() {
  const features = [
    {
      title: (
        <>
          Add <span className="gradient-text">multiple servers</span>
        </>
      ),
      description:
        "Connect and manage multiple Directus APIs simultaneously. Add as many servers as you need and seamlessly switch between different accounts and instances. Perfect for developers and teams working across multiple projects. Ideal for agencies managing multiple client environments or organizations with various staging and production servers.",
      videoUrl: "/video/add-api.mp4",
    },

    {
      title: (
        <>
          Upload files from <span className="gradient-text">your device</span>
        </>
      ),
      description:
        "Shoot a video, take a photo or scan a document and upload it directly to Directus. Access your device's camera and file system to quickly add media assets to your collections. Perfect for content creators and team members who need to update media on the go, with support for multiple file types and automatic processing.",
      videoUrl: "/video/handle-assets.mp4",
    },
  ];
  return (
    <main className="min-h-screen relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background pointer-events-none z-0">
        <div className="fixed inset-0 pattern opacity-50 animate-subtle-spin z-0" />
      </div>

      <div className="relative z-10">
        {/* Content */}
        <section className=" flex flex-col items-center justify-center text-center px-4">
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
          <h1 className="max-w-4xl mb-6">
            The <span className="gradient-text">Native Mobile App</span> for
            Your <span className="text-foreground">Directus Backend</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mb-12">
            Built for teams who need seamless access to their Directus content.
            Manage your data and handle assets — all through an intuitive mobile
            interface.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <a href="https://apps.apple.com">
              <Image
                src="/appstore-black.png"
                alt="Download for iOS"
                width={200}
                height={100}
              />
            </a>
            <a href="https://play.google.com">
              <Image
                src="/playstore-black.png"
                alt="Download for Android"
                width={200}
                height={100}
              />
            </a>
          </div>
        </section>

        <div className="pt-32" />
        {/* Image Carousel */}
        <SwiperScreenshots />

        <div className="pt-32" />

        <section
          id="features"
          className="grid grid-cols-1 gap-8 md:gap-24 container mx-auto px-4"
        >
          <h2 className="text-center">Features</h2>

          {features.map((video, index) => (
            <article
              key={`video-${index}`}
              className="group/video flex flex-col md:flex-row justify-evenly gap-10 bg-gradient-to-br from-zinc-50 to-white/30 border-2 border-zinc-100 p-20 rounded-lg shadow-xs"
            >
              <div className="w-full md:w-1/2 flex flex-col gap-4 justify-center text-center md:text-left">
                <h3 className="relative delay-200">{video.title}</h3>
                <p className="group-hover/video:md:translate-y-4 transition-all duration-500">
                  {video.description}
                </p>
              </div>
              <div className="w-full md:w-1/2  max-h-[400px] group-hover/video:md:max-h-[700px] transition-all duration-300">
                <video
                  autoPlay
                  loop
                  muted
                  controls
                  src={video.videoUrl}
                  className="w-auto h-full object-cover bg-white border-2 border-zinc-100 shadow-lg rounded-lg overflow-hidden mx-auto"
                />
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
