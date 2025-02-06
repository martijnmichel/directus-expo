"use client";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import Image from "next/image";
import { images } from "@/screenshots";

export default function SwiperScreenshots() {
  return (
    <Swiper
      loop
      className="h-[400px] md:h-[600px] -px-4"
      centeredSlides
      slidesPerView={2}
      spaceBetween={10}
      breakpoints={{
        768: {
          slidesPerView: 2.5,
        },
        1024: {
          slidesPerView: 4,
        },
        1280: {
          slidesPerView: 5.5,
        },
      }}
    >
      {images
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        .map((image, index) => (
          <SwiperSlide className="relative group" key={index + "image"}>
            {({ isActive, isNext, isPrev }) => (
              <div
                className={` ${
                  isActive ? "opacity-100" : "opacity-50"
                } transition-all duration-300`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={800}
                  height={1000}
                  className={`border-2 border-zinc-100 bg-white h-full mb-auto w-auto mx-auto rounded-lg shadow-lg object-contain absolute inset-0 z-0 ${
                    isPrev || isNext ? "scale-90" : "scale-75"
                  } ${
                    isActive ? "!scale-100" : ""
                  }  transition-all duration-300`}
                />
              </div>
            )}
          </SwiperSlide>
        ))}
    </Swiper>
  );
}
