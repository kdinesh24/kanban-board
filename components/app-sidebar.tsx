"use client";

import { Kanban, StickyNote } from "lucide-react";
import type * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Toby Belhome",
    email: "hello@tobybelhome.com",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "Kanban Board",
      logo: Kanban,
      plan: "",
    },
  ],
  navMain: [
    {
      title: "Kanban",
      url: "/",
      icon: Kanban,
    },
    {
      title: "Notes",
      url: "/notes",
      icon: StickyNote,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <div className="px-4 py-3">
          <h2 className="mb-2 px-3 text-sm font-medium tracking-tight group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:-mt-8 transition-[margin,opacity] duration-200 ease-linear">
            Apps
          </h2>
          <div className="-ml-1">
            <NavMain items={data.navMain} />
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
