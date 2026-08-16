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
  Server,
  Settings,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useRepeater } from "../context/RepeaterContext";
import { useEnvironment } from "../context/EnvironmentContext";
import { UserMenu } from "./UserMenu";

const mainNav = [
  { href: "/dashboard",              label: "Overview",      icon: LayoutDashboard },
  { href: "/dashboard/collections",  label: "Collections",   icon: FolderOpen      },
  { href: "/dashboard/environments", label: "Environments",  icon: Code2           },
  { href: "/dashboard/repeater",     label: "Repeater",      icon: RotateCw        },
  { href: "/dashboard/history",      label: "History",       icon: BookOpen        },
];

const otherNav = [
  { href: "/dashboard/mock-server",  label: "Mock Server",  icon: Server   },
  { href: "/dashboard/integrations", label: "Integrations", icon: Zap      },
  { href: "/dashboard/settings",     label: "Settings",     icon: Settings },
];

export function AppSidebar({
  user,
}: {
  user: { name: string; email: string };
}) {
  const pathname = usePathname();
  const { tabs: repeaterTabs } = useRepeater();
  const { activeEnvName } = useEnvironment();

  return (
    <Sidebar collapsible="icon">
      {/* ── Header: logo ── */}
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image
            src="/logos/paperplane-logo-removebg-preview.png" className="logo-img"
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
                    className="text-xs [&_svg]:size-3.5"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
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
                    className="text-xs [&_svg]:size-3.5"
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

      {/* ── Footer: active env + user ── */}
      <SidebarFooter className="px-2 py-3 border-t border-sidebar-border">
        {activeEnvName && (
          <div className="mb-2 flex items-center gap-1.5 rounded-md bg-orange-50 px-2.5 py-1.5 text-[10px] font-medium text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 group-data-[collapsible=icon]:hidden">
            <span className="size-1.5 shrink-0 rounded-full bg-orange-500" />
            <span className="truncate">{activeEnvName}</span>
          </div>
        )}
        <UserMenu name={user.name} email={user.email} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
