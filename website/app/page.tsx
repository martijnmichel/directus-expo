import { Slider } from "@/components/slider";
import { StoreButtons } from "@/components/store-buttons";
import SwiperScreenshots from "@/components/swiper-screenshots";
import {
  BellIcon,
  FileIcon,
  LayoutGridIcon,
  ServerIcon,
  UploadIcon,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      title: "Add multiple servers",
      titleGradientPart: "multiple servers",
      icon: <ServerIcon className="size-10" />,
      description:
        "Connect and manage multiple Directus APIs simultaneously. Add as many servers as you need and seamlessly switch between different accounts and instances. Perfect for developers and teams working across multiple projects. Ideal for agencies managing multiple client environments or organizations with various staging and production servers.",
      videoUrl: "/video/add-api.mp4",
    },

    {
      title: "Push Notifications",
      titleGradientPart: "notifications",
      icon: <BellIcon className="size-10" />,
      description:
        "Easily setup push notifications for your Directus backend. Send notifications to your users when new content is created, updated, or deleted. Perfect for content managers who need to stay informed and never miss a beat.",
      videoUrl: "/video/add-api.mp4",
    },

    {
      title: "Home Screen Widgets",
      titleGradientPart: "Widgets",
      icon: <LayoutGridIcon className="size-10" />,
      description:
        "Add Directus widgets to your iOS or Android home screen to quickly view the latest items and jump straight into the right content. Configure widget setups in the app and keep important collections one tap away.",
      videoUrl: "/video/handle-assets.mp4",
    },

    {
      title: "Manage content and media",
      titleGradientPart: "content and media",
      icon: <UploadIcon className="size-10" />,
      description:
        "Create, edit, and delete content entries directly from your mobile device while uploading photos, videos, and documents to Directus in the same workflow. Browse collections, search and filter data, and keep content and assets in sync on the go.",
      videoUrl: "/video/handle-assets.mp4",
    },

   
  ];
  return (
    <main className="min-h-screen relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background pointer-events-none z-0">
        <div className="fixed inset-0 pattern opacity-70 animate-subtle-spin z-0" />
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
          <StoreButtons />
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

          <Slider
          autoplay
            items={features.map((feature) => ({
              title: feature.title,
              titleGradientPart: feature.titleGradientPart,
              description: feature.description,
              icon: feature.icon,
              sideContent: (
                <video
                  autoPlay
                  loop
                  muted
                  controls
                  preload="none"
                  src={feature.videoUrl}
                  className="w-auto h-full object-cover bg-white border-2 border-zinc-100 shadow-lg rounded-lg overflow-hidden mx-auto"
                />
              ),
            }))}
          />
        </section>

        <div className="pt-32" />

        <section className="flex flex-col items-center gap-10 justify-center">
          <h2>
            <span className="gradient-text">Download</span> the app
          </h2>
          <StoreButtons />
        </section>
      </div>
    </main>
  );
}
