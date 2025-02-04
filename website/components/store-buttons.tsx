import Image from "next/image";

export const StoreButtons = () => (
  <div className="flex flex-col sm:flex-row gap-4 items-center">
    <a
      target="_blank"
      aria-label="download app on ios"
      href="https://testflight.apple.com/join/pWYXpQtY"
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
      href="https://play.google.com/apps/test/RQgSSfgKFg8/ahAO29uNQlJ9cwIZLTd8yKlRwhMAUxQfhP9YpjFZ2x-ZjL9hkbuYhAUfbqrCz_cN0AVHJi0gIcRHPLrJf758Q66sIB"
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
