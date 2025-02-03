"use client"
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import Image from 'next/image';

export default function SwiperScreenshots() {
    return (
        <Swiper loop className="h-[400px] md:h-[600px]" centeredSlides slidesPerView={1} spaceBetween={10} breakpoints={{
            768: {
                slidesPerView: 2.5,
            },
            1024: {
                slidesPerView: 4,
            },
        }}>
            {Array.from({ length: 5 }).map((_, index) => (
                <SwiperSlide className="relative group" key={index + "image"}>
                    {({ isActive, isNext, isPrev }) => (
                        <div className={`${isActive ? "opacity-100" : "opacity-50"} transition-all duration-300`}>
                            <Image
                                src={`/${index + 1}.png`}
                                alt={`Carousel Image ${index + 1}`}
                                fill
                                className={`object-contain absolute inset-0 z-0 ${isPrev || isNext ? "scale-90" : "scale-75"} ${isActive ? "!scale-100" : ""}  transition-all duration-300`	}
                            />
                        </div>
                    )}
                </SwiperSlide>
            ))}
        </Swiper>
    )
}
