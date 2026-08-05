import { griffy } from "@/app/font";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features",  href: "/#features"  },
      { label: "Pricing",   href: "/#pricing"   },
      { label: "Collections", href: "/dashboard/collections" },
      { label: "Changelog", href: "/changelog"  },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs"      },
      { label: "Tutorials",     href: "/tutorials" },
      { label: "Blog",          href: "/blog"      },
      { label: "Support",       href: "/contact"   },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About",    href: "/about"    },
      { label: "Careers",  href: "/careers"  },
      { label: "Contact",  href: "/contact"  },
      { label: "Partners", href: "/partners" },
    ],
  },
];

const socials = [
  { label: "X", mark: "X" },
  { label: "Instagram", mark: "Ig" },
  { label: "LinkedIn", mark: "In" },
  { label: "GitHub", mark: "Gh" },
];

export default function Footer() {
  return (
    <footer className="bg-[#f5f6f4] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-white py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:rounded-[2.5rem] lg:py-8">
        <section
          className="relative mx-4 flex min-h-72 flex-col items-center justify-center overflow-hidden rounded-[1.75rem] bg-cover bg-center px-6 py-16 text-center text-white sm:mx-6 lg:mx-8"
          style={{ backgroundImage: "url('/background-images/cta-bg.png')" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/25"
          />
          <div className="relative z-10 flex max-w-2xl flex-col items-center">
            <h2 className="text-balance text-3xl font-semibold tracking-normal sm:text-4xl">
              Ready to let your API take flight?
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-sm leading-7 text-white/70 sm:text-base">
              Build requests, test responses, and organize collections in one
              focused workspace.
            </p>
            <Button className="mt-9 h-11 rounded-xl bg-white px-6 text-slate-950 hover:bg-white/90" render={<Link href="/signup" />}>
              Start for free
            </Button>
          </div>
        </section>

        <section className="relative mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-6 lg:px-8">
          <div className="relative z-10 rounded-[1.65rem] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(15,23,42,0.08)] sm:p-8 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
              <div>
                <Link href="/" className="inline-flex items-center gap-2">
                  <Image
                    src="/logos/paperplane-logo.png"
                    width={42}
                    height={42}
                    alt="Paperplane logo"
                    unoptimized
                  />
                  <span className={`${griffy.className} text-2xl text-slate-950`}>
                    Paperplane
                  </span>
                </Link>

                <p className="mt-7 max-w-md text-sm leading-6 text-slate-600">
                  Paperplane helps teams compose requests, inspect responses,
                  and organize API workflows without losing momentum.
                </p>

                <div className="mt-6 flex items-center gap-3">
                  {socials.map(({ label, mark }) => (
                    <Link
                      key={label}
                      href="/"
                      aria-label={label}
                      className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
                    >
                      {mark}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-3">
                {footerColumns.map((column) => (
                  <div key={column.title}>
                    <h3 className="text-sm font-semibold text-slate-950">
                      {column.title}
                    </h3>
                    <ul className="mt-5 space-y-3">
                      {column.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            className="text-sm text-slate-600 transition-colors hover:text-slate-950"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-5 border-t border-slate-200 pt-7 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 Paperplane. All rights reserved.</p>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <Link href="/privacy" className="underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="underline-offset-4 hover:underline">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="underline-offset-4 hover:underline">
                  Cookies Settings
                </Link>
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className={`${griffy.className} pointer-events-none absolute inset-x-0 -bottom-24 z-0 text-center text-[7rem] leading-none text-slate-950/[0.035] sm:text-[10rem] lg:text-[13rem]`}
          >
            Paperplane
          </div>
        </section>
      </div>
    </footer>
  );
}
