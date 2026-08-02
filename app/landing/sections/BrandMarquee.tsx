import Image from "next/image";

const brands = [
  {
    name: "ClickUp",
    src: "/logos/clickup-wordmark.svg",
  },
  {
    name: "Trello",
    src: "/logos/trello-wordmark.svg",
  },
  {
    name: "Proton Mail",
    src: "/logos/protonmail-wordmark.svg",
  },
  {
    name: "MongoDB",
    src: "/logos/mongodb-wordmark-light.svg",
  },
  {
    name: "Leap Wallet",
    src: "/logos/leap-wallet-wordmark-light.svg",
  },
  {
    name: "Clerk",
    src: "/logos/clerk-wordmark-light.svg",
  },
];

const marqueeItems = [...brands, ...brands];

export default function BrandMarquee() {
  return (
    <section className="relative overflow-hidden bg-[#f5f6f4] px-4 pb-24 pt-16 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 mx-auto h-40 max-w-5xl bg-[radial-gradient(ellipse_at_center,rgba(234,88,12,0.16)_0%,rgba(234,88,12,0.08)_34%,rgba(245,246,244,0)_72%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-200/80 to-transparent"
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <p className="text-center text-xs font-semibold uppercase tracking-normal text-slate-500">
          Trusted by teams building and testing APIs
        </p>

        <div className="relative mt-8 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#f5f6f4] to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#f5f6f4] to-transparent"
          />

          <div className="flex w-max animate-[brand-marquee_28s_linear_infinite] items-center gap-4 hover:[animation-play-state:paused]">
            {marqueeItems.map((brand, index) => (
              <div
                key={`${brand.name}-${index}`}
                className="flex h-14 min-w-48 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 shadow-sm"
              >
                <Image
                  src={brand.src}
                  width={128}
                  height={32}
                  alt={`${brand.name} logo`}
                  className="max-h-7 w-auto object-contain"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
