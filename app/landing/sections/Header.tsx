"use client";

import { griffy } from "@/app/font";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

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
                    item.href === "/" ? "bg-black/5" : ""
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden gap-3 md:flex">
            <Button className="bg-orange-600 hover:bg-orange-700 transition-colors duration-150">
              LogIn
            </Button>
            <Button
              variant="outline"
              className="transition-colors duration-150"
            >
              Join us
            </Button>
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
                      item.href === "/" ? "bg-black/5" : ""
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 min-[420px]:grid-cols-2">
              <Button className="h-10 bg-orange-600 hover:bg-orange-700">
                Get full access
              </Button>
              <Button variant="outline" className="h-10">
                Join us
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
