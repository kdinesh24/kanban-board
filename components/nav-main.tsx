"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    badge?: string;
    count?: number;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={pathname === item.url}
              asChild
            >
              <Link href={item.url}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                {item.badge && (
                  <Badge
                    variant={item.badge === "New" ? "default" : "secondary"}
                    className="ml-auto text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
                {item.count && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.count}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
