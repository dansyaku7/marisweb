import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { Wind, Droplets, Biohazard, FileSearch } from "lucide-react";
import { ReactNode } from "react";
import AnimatedOnScroll from "@/components/AnimatedOnScroll";

export default function Features() {
  return (
    <>
      <section className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <AnimatedOnScroll>
              <h2 className="text-balance text-4xl font-bold lg:text-5xl">
                Our Core Services
              </h2>
            </AnimatedOnScroll>
            <AnimatedOnScroll delay={0.2}>
              <p className="mt-4">
                Delivering reliable and comprehensive environmental testing and
                consulting services tailored to your needs.
              </p>
            </AnimatedOnScroll>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Wind className="size-6" />,
                title: "Air Quality Testing Services",
                description:
                  "Ambient Air Monitoring, Mobile Source Emission, Stationary Source Emission Monitoring.",
              },
              {
                icon: <Droplets className="size-6" />,
                title: "Water Quality Testing",
                description:
                  "Wastewater Monitoring, Clean Water and Drinking Water Monitoring, Surface Water Monitoring (Rivers, Lakes, Coastal Waters).",
              },
              {
                icon: <Biohazard className="size-6" />,
                title: "Hazardous Waste (B3) Testing",
                description:
                  "TCLP, LC50, LD50, Acute/Subchronic/Chronic Toxicity Testing, and other hazardous waste testing.",
              },
              {
                icon: <FileSearch className="size-6" />,
                title: "Environmental Consulting",
                description:
                  "AMDAL, UKL-UPL, PERTEK, RINTEK, and other environmental documentation consulting services.",
              },
            ].map((item, i) => (
              <AnimatedOnScroll key={i} delay={0.2 * i}>
                <ServiceCard {...item} />
              </AnimatedOnScroll>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-background pb-16 md:pb-32">
        <div className="group relative m-auto max-w-6xl px-6">
          <div className="flex flex-col items-center md:flex-row">
            <div className="md:max-w-44 md:border-r md:pr-6"></div>
            <div className="relative py-6 md:w-[calc(100%-11rem)]">
              <AnimatedOnScroll>
                <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
                  <div className="flex flex-col items-center text-center px-4">
                    <img
                      src="/images/icon-exp.png"
                      alt="Experience Icon"
                      className="h-8 w-8 mb-2 dark:invert"
                    />
                    <p className="text-xl font-bold">25</p>
                    <p className="text-sm text-muted-foreground">Years Exp</p>
                  </div>

                  <div className="flex flex-col items-center text-center px-4">
                    <img
                      src="/images/icon-completed.png"
                      alt="Cases Icon"
                      className="h-8 w-8 mb-2 dark:invert"
                    />
                    <p className="text-xl font-bold">305</p>
                    <p className="text-sm text-muted-foreground">
                      Cases Completed
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center px-4">
                    <img
                      src="/images/icon-consultant.png"
                      alt="Consultant Icon"
                      className="h-8 w-8 mb-2 dark:invert"
                    />
                    <p className="text-xl font-bold">35</p>
                    <p className="text-sm text-muted-foreground">Consultant</p>
                  </div>

                  <div className="flex flex-col items-center text-center px-4">
                    <img
                      src="/images/icon-award.png"
                      alt="Award Icon"
                      className="h-8 w-8 mb-2 dark:invert"
                    />
                    <p className="text-xl font-bold">20</p>
                    <p className="text-sm text-muted-foreground">
                      Award Winning
                    </p>
                  </div>
                </InfiniteSlider>
              </AnimatedOnScroll>

              <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
              <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>
              <ProgressiveBlur
                className="pointer-events-none absolute left-0 top-0 h-full w-20"
                direction="left"
                blurIntensity={1}
              />
              <ProgressiveBlur
                className="pointer-events-none absolute right-0 top-0 h-full w-20"
                direction="right"
                blurIntensity={1}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ServiceCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="group flex flex-col h-full shadow-zinc-950/5">
      <CardHeader className="pb-3">
        <CardDecorator>{icon}</CardDecorator>
        <h3 className="mt-6 font-medium text-center">{title}</h3>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-center">{description}</p>
      </CardContent>
    </Card>
  );
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div className="relative mx-auto size-20 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:bg-white/5 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"
    />
    <div
      aria-hidden
      className="bg-radial to-background absolute inset-0 from-transparent to-75%"
    />
    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">
      {children}
    </div>
  </div>
);
