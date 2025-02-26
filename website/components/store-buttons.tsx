import Image from "next/image";

export const StoreButtons = () => (
  <div className="flex flex-col sm:flex-row gap-4 items-center">
    <a
      target="_blank"
      aria-label="download app on ios"
      href="https://apps.apple.com/app/directus-mobile/id6740696350"
    >
      <Image
        src="/appstore-black.png"
        alt="Download for iOS"
        width={200}
        height={100}
      />
    </a>
    <a
      target="_blank"
      aria-label="download app on android"
      href="https://play.google.com/store/apps/details?id=com.martijnmichel.directusexpo.app"
    >
      <Image
        src="/playstore-black.png"
        alt="Download for Android"
        width={200}
        height={100}
      />
    </a>
  </div>
);
