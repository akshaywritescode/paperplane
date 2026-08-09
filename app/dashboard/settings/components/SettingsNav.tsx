"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/settings/profile",  label: "Profile",  icon: User   },
  { href: "/dashboard/settings/security", label: "Security", icon: Shield  },
  { href: "/dashboard/settings/privacy",  label: "Privacy",  icon: Lock   },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 space-y-1">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
