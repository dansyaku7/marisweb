import AnimatedOnScroll from "@/components/AnimatedOnScroll";
import Image from "next/image";

export default function AboutSection() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <AnimatedOnScroll>
          <h2 className="text-center text-4xl font-bold lg:text-5xl">
            About Us
          </h2>
        </AnimatedOnScroll>
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
          <div className="relative mb-6 sm:mb-0">
            <AnimatedOnScroll>
              <div className="relative mb-6 sm:mb-0">
                <Image
                  src="/images/about-delta.jpg"
                  className="rounded-[15px] shadow"
                  alt="about"
                  width={1207}
                  height={929}
                />
              </div>
            </AnimatedOnScroll>
          </div>
          <AnimatedOnScroll>
            <div className="relative space-y-4">
              <p className="text-muted-foreground">
                <span className="font-bold text-foreground">
                  Delta Indonesia Laboratory (DIL)
                </span>{" "}
                is an accredited lab that provides{" "}
                <span className="font-medium text-foreground">
                  emission testing, ambient air monitoring, and indoor air
                  quality testing
                </span>{" "}
                to support industries in meeting environmental standards.
              </p>

              <p className="text-muted-foreground">
                DIL operates under{" "}
                <span className="font-medium text-foreground">
                  SNI ISO/IEC 17025:2017
                </span>{" "}
                and other environmental regulations, with a commitment to
                delivering reliable and compliant results across West Java.
              </p>

              <div className="mt-6 space-y-3">
                <cite className="block font-medium">
                  PT Delta Indonesia Laboratory
                </cite>
                <img
                  className="h-10 w-fit"
                  src="/images/logo-delta.png"
                  alt="Delta Logo"
                  height="40"
                  width="auto"
                />
              </div>
            </div>
          </AnimatedOnScroll>
        </div>
      </div>
    </section>
  );
}
