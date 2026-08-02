import { griffy } from "@/app/font";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 pb-20 pt-32 text-center sm:px-6 lg:px-8">
      <video
        aria-hidden="true"
        className="absolute inset-0 -z-20 size-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source src="/background-images/background-video.mp4" type="video/mp4" />
      </video>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-white/20"
      />
      <div className="mx-auto flex max-w-5xl -translate-y-10 flex-col items-center sm:-translate-y-14">
        <div className="mb-8 rounded-full border border-white/80 bg-white/45 p-1 shadow-sm">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600">
            <Image
              src="/logos/paperplane-logo.png"
              width={18}
              height={18}
              alt=""
              unoptimized
            />
            Startup Friendly Design & Development
          </p>
        </div>

        <h1
          className={`${griffy.className} max-w-4xl text-balance text-5xl font-normal leading-[1.02] tracking-normal text-slate-950 sm:text-6xl lg:text-7xl`}
        >
          Let your API take flight
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-xs font-medium leading-7 text-slate-700 sm:text-sm">
          Compose requests, inspect responses, and organize API workflows in a
          calm workspace built for modern teams.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="h-11 gap-2 rounded-xl bg-orange-600 px-5 text-white shadow-[0_14px_34px_rgba(234,88,12,0.28)] hover:bg-orange-700"
          >
            Start testing
            <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 gap-2 rounded-xl border-white/80 bg-white/80 px-5 text-slate-900 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur-md hover:bg-white"
          >
            <Play className="size-4" />
            Watch demo
          </Button>
        </div>
      </div>
    </section>
  );
}
