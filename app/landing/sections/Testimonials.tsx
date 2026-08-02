import { Star } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    company: "ClickUp",
    logo: "/logos/clickup-wordmark.svg",
    rating: "4.9",
    quote:
      "Paperplane made our API checks feel lightweight again. Collections are simple to scan, and response details are exactly where we expect them.",
    name: "Maya Chen",
    handle: "platform_lead",
    featured: true,
  },
  {
    company: "Trello",
    logo: "/logos/trello-wordmark.svg",
    rating: "4.8",
    quote:
      "Our team moved staging and production requests into one clean workspace. It removed a surprising amount of daily friction.",
    name: "Evan Brooks",
    handle: "backend_ops",
  },
  {
    company: "Proton Mail",
    logo: "/logos/protonmail-wordmark.svg",
    rating: "4.9",
    quote:
      "The interface is calm, fast, and focused. We can debug payloads without fighting the tool.",
    name: "Nadia Silva",
    handle: "api_quality",
  },
  {
    company: "MongoDB",
    logo: "/logos/mongodb-wordmark-light.svg",
    rating: "4.7",
    quote:
      "Paperplane gives us a shared source of truth for testing endpoints across environments.",
    name: "Owen Patel",
    handle: "infra_testing",
  },
  {
    company: "Leap Wallet",
    logo: "/logos/leap-wallet-wordmark-light.svg",
    rating: "4.9",
    quote:
      "It feels built for teams who test APIs all day. Nothing gets in the way of sending the next request.",
    name: "Leah Grant",
    handle: "product_engineer",
  },
  {
    company: "Clerk",
    logo: "/logos/clerk-wordmark-light.svg",
    rating: "4.8",
    quote:
      "The request builder is quick, and saved collections make onboarding new engineers much easier.",
    name: "Sam Rivera",
    handle: "developer_success",
  },
];

export default function Testimonials() {
  return (
    <section className="overflow-hidden bg-[#eef4f7] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
            Our trusted{" "}
            <span className="inline-flex rounded-xl bg-orange-600 px-3 py-1 text-white">
              Clients
            </span>
          </h2>
          <p className="mt-5 text-pretty text-sm leading-7 text-slate-700 sm:text-base">
            Teams use Paperplane to make API testing faster, clearer, and
            easier to share across product and engineering.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={`${testimonial.company}-${testimonial.name}`}
              className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out hover:-translate-y-2 hover:rotate-[-2deg] hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)] ${
                testimonial.featured
                  ? "md:scale-[1.02]"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <Image
                  src={testimonial.logo}
                  width={116}
                  height={30}
                  alt={`${testimonial.company} logo`}
                  className="max-h-8 w-auto object-contain"
                  unoptimized
                />
                <div className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                  {testimonial.rating}
                  <Star className="size-4 fill-emerald-500 text-emerald-500" />
                </div>
              </div>

              <p className="mt-8 min-h-28 text-pretty text-base leading-7 text-slate-700">
                “{testimonial.quote}”
              </p>

              <div className="mt-8">
                <h3 className="text-xl font-semibold text-slate-950">
                  {testimonial.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  @{testimonial.handle}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
