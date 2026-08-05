"use client";

import { griffy } from "@/app/font";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.replace(/#.*$/, "")) && href.startsWith(pathname);
  }

  return (
    <header className="absolute inset-x-0 top-0 z-20 w-full py-5 px-4 flex justify-center">
      <div className="relative w-full max-w-5xl">
        <nav className="flex min-h-15 w-full items-center justify-between rounded-xl bg-white px-4 shadow-sm sm:px-6 lg:px-7">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <Image
              src="/logos/paperplane-logo.png"
              width={50}
              height={50}
              alt="Paperplane logo"
              unoptimized
            />
            <span className={`${griffy.className} text-2xl`}>
              Paperplane
            </span>
          </Link>

          <ul className="hidden items-center gap-5 text-sm font-medium md:flex">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`rounded-lg p-2 transition-colors duration-150 hover:bg-black/5 ${
                    isActive(item.href) ? "bg-black/5" : ""
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden gap-3 md:flex">
            <Link
              href="/signup"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-orange-600 px-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-orange-700"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors duration-150 hover:bg-muted"
            >
              Log in
            </Link>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </nav>

        {isOpen ? (
          <div className="absolute left-0 right-0 top-full mt-3 rounded-xl border border-white/80 bg-white p-3 shadow-[0_18px_55px_rgba(15,23,42,0.16)] md:hidden">
            <ul className="space-y-1 text-sm font-medium">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-black/5 ${
                      isActive(item.href) ? "bg-black/5" : ""
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 min-[420px]:grid-cols-2">
              <Link
                href="/signup"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-3 text-sm font-medium text-white hover:bg-orange-700"
                onClick={() => setIsOpen(false)}
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                Log in
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
