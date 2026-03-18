import React from "react";
import Image from "next/image";
import AnimatedOnScroll from "@/components/AnimatedOnScroll";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center">
      <Image
        src="/images/hero-bg-section.jpg"
        alt="Hero Background"
        fill
        className="absolute inset-0 -z-10 object-cover"
        priority
      />
      <div className="absolute inset-0 -z-10 bg-black/30" />

      <div className="w-full px-6">
        <div className="mx-auto max-w-6xl flex flex-col lg:flex-row items-center justify-between">
          <AnimatedOnScroll>
            <div className="text-center lg:text-left max-w-xl text-white">
              <h1 className="text-5xl md:text-6xl xl:text-8xl font-bold leading-tight">
                One-Stop Environmental Solutions
              </h1>
              <p className="mt-6 text-lg md:text-xl">
                Building Environmental Integrity.
              </p>
            </div>
          </AnimatedOnScroll>
        </div>
      </div>
    </section>
  );
}
