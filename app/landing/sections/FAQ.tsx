import {
  ChevronDown,
  CreditCard,
  Mail,
  MessageCircle,
  PanelTop,
  PlayCircle,
  Server,
  Settings2,
  Smile,
  Users,
} from "lucide-react";
import Link from "next/link";

const categories = ["General", "Pricing", "Workspace", "API"];

const faqs = [
  {
    question: "Is there a free trial available?",
    answer:
      "Yes. You can start for free and explore request building, response previews, collections, and environments before upgrading.",
    icon: Smile,
    open: true,
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Yes. You can upgrade or downgrade as your API testing volume changes.",
    icon: PanelTop,
  },
  {
    question: "What happens when I hit my run limit?",
    answer:
      "You can upgrade to a larger pack or wait until your next billing cycle resets your included runs.",
    icon: CreditCard,
  },
  {
    question: "Can teammates share collections?",
    answer:
      "Team workspaces are designed for shared collections, environments, and repeatable API testing flows.",
    icon: Users,
  },
  {
    question: "Does Paperplane support environments?",
    answer:
      "Yes. Store environment-specific values so staging, production, and local requests stay clean.",
    icon: Settings2,
  },
  {
    question: "Can I test private APIs?",
    answer:
      "Paperplane is built for development workflows, including internal services and private endpoints.",
    icon: Server,
  },
  {
    question: "How does support work?",
    answer:
      "Send us a message and we will help with setup, billing, or workflow questions.",
    icon: MessageCircle,
  },
  {
    question: "Do you provide tutorials?",
    answer:
      "Yes. Guided examples and workflow recipes will help teams get productive quickly.",
    icon: PlayCircle,
  },
];

export default function FAQ() {
  return (
    <section className="bg-[#f5f6f4] px-4 py-20 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-5 py-16 shadow-[0_20px_65px_rgba(15,23,42,0.06)] sm:px-8 lg:px-12">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 mx-auto h-[34rem] max-w-4xl bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_72%)]"
        />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-balance text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-sm leading-7 text-slate-600 sm:text-base">
            These are the most common questions about Paperplane. Can&apos;t
            find what you&apos;re looking for?{" "}
            <Link href="/" className="font-medium underline">
              Chat to our friendly team!
            </Link>
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {categories.map((category, index) => (
              <button
                key={category}
                type="button"
                className={`rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${
                  index === 0
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-12 max-w-2xl space-y-3">
          {faqs.map(({ question, answer, icon: Icon, open }) => (
            <details
              key={question}
              open={open}
              className="group rounded-2xl transition-colors open:bg-slate-50"
            >
              <summary className="grid cursor-pointer list-none grid-cols-[2.75rem_1fr_auto] items-center gap-4 rounded-2xl p-3 text-left marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm">
                  <Icon className="size-4" />
                </span>
                <span className="text-base font-semibold text-slate-950">
                  {question}
                </span>
                <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-5 pl-[4.75rem] pr-12 text-sm leading-6 text-slate-600">
                {answer}
              </p>
            </details>
          ))}
        </div>

        <Link
          href="/"
          aria-label="Contact support"
          className="absolute bottom-6 right-6 z-10 hidden size-12 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_16px_35px_rgba(15,23,42,0.24)] transition-transform hover:scale-105 sm:flex"
        >
          <Mail className="size-5" />
        </Link>
      </div>
    </section>
  );
}
