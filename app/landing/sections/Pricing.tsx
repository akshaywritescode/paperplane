import { Button } from "@/components/ui/button";
import { ArrowRight, Check, CircleCheck, Info, Sparkles } from "lucide-react";
import Link from "next/link";

const packs = [
  {
    name: "Starter Pack",
    detail: "100 runs · Light usage",
    active: true,
  },
  {
    name: "Growth Pack",
    detail: "250 runs · Regular usage",
    active: false,
  },
  {
    name: "Power Pack",
    detail: "500 runs · Heavy duty",
    active: false,
  },
];

const highlights = [
  {
    title: "Unlimited saved requests",
    description: "Build collections for every API, workflow, and environment.",
  },
  {
    title: "Fast response inspection",
    description: "Review status, headers, timings, and payloads without noise.",
  },
  {
    title: "Private team workspace",
    description: "Keep environments and collections organized across projects.",
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="bg-[#f5f6f4] px-6 py-20 sm:px-10 lg:px-16 xl:px-20"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm">
            Our Pricing
          </div>

          <h2 className="mt-6 max-w-xl text-balance text-4xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-5xl">
            <span className="text-slate-500">Choose the</span> Right Plan!
          </h2>

          <p className="mt-5 max-w-xl text-pretty text-sm leading-6 text-slate-700">
            Start small, scale when your collections grow, and keep your API
            testing workflow fast from prototype to production.
          </p>

          <div className="mt-20 space-y-4 lg:max-w-xl">
            {packs.map((pack) => (
              <div
                key={pack.name}
                className={`flex items-center justify-between rounded-md p-5 transition-all ${
                  pack.active
                    ? "border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)]"
                    : "bg-white/70"
                }`}
              >
                <div>
                  <h3 className="font-semibold text-slate-950">{pack.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{pack.detail}</p>
                </div>
                <div
                  className={`flex size-9 items-center justify-center rounded-full ${
                    pack.active
                      ? "bg-slate-950 text-white"
                      : "text-slate-700"
                  }`}
                >
                  {pack.active ? (
                    <Check className="size-5" />
                  ) : (
                    <ArrowRight className="size-5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.12)] sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-950">
                <Sparkles className="size-5" />
              </span>
              <h3 className="text-2xl font-semibold text-slate-950">
                100 API Runs
              </h3>
            </div>

            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              Best Value
            </span>
          </div>

          <div className="mt-8 flex items-end gap-2">
            <p className="text-5xl font-semibold tracking-normal text-slate-950">
              $19
            </p>
            <p className="pb-2 text-sm text-slate-500">/month</p>
          </div>

          <Button
            className="mt-6 h-12 w-full rounded-xl bg-slate-950 text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)] hover:bg-slate-800"
            render={<Link href="/signup" />}
          >
            Start for Free
          </Button>

          <p className="mt-3 text-center text-sm text-slate-700">
            Built for focused teams validating APIs every day.
          </p>

          <div className="my-8 border-t border-slate-200" />

          <h4 className="text-lg font-semibold text-slate-950">Highlights:</h4>
          <div className="mt-5 space-y-5">
            {highlights.map((item) => (
              <div key={item.title} className="flex gap-3">
                <CircleCheck className="mt-1 size-4 shrink-0 text-slate-950" />
                <div>
                  <h5 className="font-medium text-slate-950">{item.title}</h5>
                  <p className="mt-1 text-xs leading-4 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="my-8 border-t border-slate-200" />

          <div className="flex gap-3 text-sm leading-6 text-slate-700">
            <Info className="mt-1 size-4 shrink-0 fill-slate-950 text-white" />
            <p className="text-xs">
              Plan limits apply to team usage. Upgrade anytime as your API
              collections and environments expand.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
