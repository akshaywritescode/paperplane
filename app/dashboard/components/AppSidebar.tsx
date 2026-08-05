"use client";

import { griffy } from "@/app/font";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  Code2,
  FolderOpen,
  LayoutDashboard,
  RotateCw,
  Settings,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRepeater } from "../context/RepeaterContext";
import { UserMenu } from "./UserMenu";

const mainNav = [
  { href: "/dashboard",              label: "Overview",      icon: LayoutDashboard },
  { href: "/dashboard/collections",  label: "Collections",   icon: FolderOpen      },
  { href: "/dashboard/environments", label: "Environments",  icon: Code2           },
  { href: "/dashboard/repeater",     label: "Repeater",      icon: RotateCw        },
  { href: "/dashboard/history",      label: "History",       icon: BookOpen        },
];

const otherNav = [
  { href: "/dashboard/integrations", label: "Integrations", icon: Zap     },
  { href: "/dashboard/settings",     label: "Settings",     icon: Settings },
];

export function AppSidebar({
  user,
}: {
  user: { name: string; email: string };
}) {
  const pathname = usePathname();
  const { tabs: repeaterTabs } = useRepeater();

  return (
    <Sidebar collapsible="icon">
      {/* ── Header: logo ── */}
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image
            src="/logos/paperplane-logo.png"
            width={30}
            height={30}
            alt="Paperplane logo"
            unoptimized
          />
          <span className={`${griffy.className} text-lg text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden`}>
            Paperplane
          </span>
        </Link>
      </SidebarHeader>

      {/* ── Main nav ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {/* Repeater tab count badge */}
                  {item.href === "/dashboard/repeater" && repeaterTabs.length > 0 && (
                    <SidebarMenuBadge>{repeaterTabs.length}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer: user ── */}
      <SidebarFooter className="px-2 py-3 border-t border-sidebar-border">
        <UserMenu name={user.name} email={user.email} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
