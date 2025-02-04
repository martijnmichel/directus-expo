import { StoreButtons } from "@/components/store-buttons";
import SwiperScreenshots from "@/components/swiper-screenshots";

export default function Home() {
  const features = [
    {
      title: (
        <>
          Add <span className="gradient-text">multiple servers</span>
        </>
      ),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="text-foreground size-12"
        >
          <circle cx="8" cy="26" r="1" fill="currentColor" />
          <path
            fill="currentColor"
            d="M5 30h22c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2m0-6h22v4H5zm18-4H9c-3.31 0-6-2.69-6-6c0-3.05 2.29-5.58 5.25-5.95C9.13 4.55 12.33 2 16 2s6.87 2.55 7.75 6.05C26.71 8.42 29 10.95 29 14c0 3.31-2.69 6-6 6M8.95 10A4.01 4.01 0 0 0 5 14c0 2.21 1.79 4 4 4h14c2.21 0 4-1.79 4-4a4 4 0 0 0-3.94-4l-.12.01l-.88.02l-.12-.88C21.51 6.21 18.96 4 16 4s-5.51 2.21-5.93 5.15l-.12.88z"
          />
        </svg>
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
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="text-foreground size-12"
        >
          <path
            fill="currentColor"
            d="M4 22H2V4a2 2 0 0 1 2-2h18v2H4zm17-5a3 3 0 1 0-3-3a3.003 3.003 0 0 0 3 3m0-4a1 1 0 1 1-1 1a1 1 0 0 1 1-1"
          />
          <path
            fill="currentColor"
            d="M28 7H9a2.003 2.003 0 0 0-2 2v19a2.003 2.003 0 0 0 2 2h19a2.003 2.003 0 0 0 2-2V9a2.003 2.003 0 0 0-2-2m0 21H9v-6l4-3.997l5.586 5.586a2 2 0 0 0 2.828 0L23 22.003L28 27Zm0-3.828l-3.586-3.586a2 2 0 0 0-2.828 0L20 22.172l-5.586-5.586a2 2 0 0 0-2.828 0L9 19.172V9h19Z"
          />
        </svg>
      ),
      description:
        "Shoot a video, take a photo or scan a document and upload it directly to Directus. Access your device's camera and file system to quickly add media assets to your collections. Perfect for content creators and team members who need to update media on the go, with support for multiple file types and automatic processing.",
      videoUrl: "/video/handle-assets.mp4",
    },

    {
      title: (
        <>
          Manage <span className="gradient-text">your content</span>
        </>
      ),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="text-foreground size-12"
        >
          <path
            fill="currentColor"
            d="m29.707 7.293l-3-3a1 1 0 0 0-1.414 0L16 13.586V18h4.414l9.293-9.293a1 1 0 0 0 0-1.414M19.586 16H18v-1.586l5-5L24.586 11zM26 9.586L24.414 8L26 6.414L27.586 8zM10 14a4 4 0 1 1 4-4a4.005 4.005 0 0 1-4 4m0-6a2 2 0 1 0 1.998 2.004A2 2 0 0 0 10 8"
          />
          <path
            fill="currentColor"
            d="m27.006 14.235l-1.414 1.414L28 18.058L18.058 28L4 13.941V4h9.942l4.406 4.407l1.415-1.415l-4.407-4.406A2 2 0 0 0 13.94 2H4a2 2 0 0 0-2 2v9.941a2 2 0 0 0 .586 1.414l14.058 14.06a2 2 0 0 0 2.828 0l9.943-9.943a2 2 0 0 0 0-2.828Z"
          />
        </svg>
      ),
      description:
        "Create, edit, and delete content entries directly from your mobile device. Browse through your collections, filter and search content, and make real-time updates to your data. Perfect for content managers who need to review and update content on the go, with support for all the most important Directus field types and interfaces.",
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

          <p className="mb-4 ">Now available as public beta</p>

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

          {features.map((video, index) => (
            <article
              key={`video-${index}`}
              className={` max-w-[1200px] mx-auto group/video flex flex-col md:flex-row justify-evenly gap-10 bg-gradient-to-br from-zinc-50 to-white/30 border-2 border-zinc-100 p-10 md:p-20 rounded-lg shadow-xs`}
            >
              <div className=" w-full md:w-1/2 flex flex-col gap-4 justify-center items-center text-center md:items-start md:text-left">
                <span className="group-hover/video:md:-translate-y-14 transition-all duration-500 ease-in">
                  {video.icon}
                </span>
                <h3 className="group-hover/video:md:-translate-y-6 transition-allrelative duration-[400ms] ease-in">
                  {video.title}
                </h3>
                <p className="group-hover/video:md:translate-y-4 transition-all duration-500 ease-in">
                  {video.description}
                </p>
              </div>
              <div className="w-full md:w-1/2  max-h-[400px] group-hover/video:md:max-h-[700px] transition-all duration-300 ease-out">
                <video
                  autoPlay
                  loop
                  muted
                  controls
                  preload="none"
                  src={video.videoUrl}
                  className="w-auto h-full object-cover bg-white border-2 border-zinc-100 shadow-lg rounded-lg overflow-hidden mx-auto"
                />
              </div>
            </article>
          ))}
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
