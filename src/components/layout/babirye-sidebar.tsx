"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Bot,
  ListTodo,
  Users,
  Zap,
  Rss,
  Search,
  Crosshair,
  Shield,
  ShieldCheck,
  Radio,
  Crown,
  Lock,
  Bell,
  FileText,
  Network,
  FileBarChart,
  Sword,
  Hand,
  ScrollText,
  Settings,
} from "lucide-react";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useAppStore, type PageId } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface NavSection {
  label: string;
  items: {
    id: PageId;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeVariant?: "default" | "destructive" | "warning" | "success";
  }[];
}

const navSections: NavSection[] = [
  {
    label: "MAIN",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "agents", label: "Agents", icon: Bot },
      { id: "tasks", label: "Tasks", icon: ListTodo, badge: 12, badgeVariant: "default" },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { id: "expert-council", label: "Expert Council", icon: Users },
      { id: "potentials", label: "Potentials", icon: Zap, badge: 3, badgeVariant: "success" },
      { id: "intel-feeds", label: "Intel Feeds", icon: Rss },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { id: "forensic", label: "Forensic", icon: Search },
      { id: "offensive", label: "Offensive", icon: Crosshair },
      { id: "defensive", label: "Defensive", icon: Shield },
      { id: "micro-defensive", label: "Micro-Defensive", icon: ShieldCheck },
    ],
  },
  {
    label: "PHYSICAL",
    items: [
      { id: "sensors", label: "Sensors", icon: Radio, badge: 8, badgeVariant: "warning" },
      { id: "vip-protection", label: "VIP Protection", icon: Crown },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { id: "self-attack-wall", label: "Self-Attack Wall", icon: Lock },
      { id: "alerts", label: "Alerts", icon: Bell, badge: 5, badgeVariant: "destructive" },
      { id: "audit-logs", label: "Audit Logs", icon: FileText },
      { id: "spa-gateways", label: "SPA Gateways", icon: Network },
      { id: "reports", label: "Reports", icon: FileBarChart },
      { id: "weapons-db", label: "Weapons DB", icon: Sword },
      { id: "martial-arts", label: "Martial Arts", icon: Hand },
      { id: "constitutions", label: "Constitutions", icon: ScrollText },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

function getBadgeClass(variant?: string) {
  switch (variant) {
    case "destructive":
      return "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30";
    case "warning":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30";
    case "success":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30";
    default:
      return "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30";
  }
}

export function BabiryeSidebar() {
  const { currentPage, setPage, notifications, user } = useAppStore();
  const { theme } = useTheme();
  const unreadAlerts = notifications.filter((n) => !n.read).length;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border/50 bg-sidebar"
    >
      {/* Header / Logo */}
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-3 px-1">
          <motion.div
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/30"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Shield className="h-4 w-4 text-primary" />
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
          </motion.div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-widest text-primary text-glow-emerald">
              BABIRYE
            </span>
            <span className="font-mono text-[10px] leading-none text-muted-foreground">
              v10.0.0
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="bg-sidebar-border/50" />

      {/* Navigation */}
      <SidebarContent className="px-2 py-2">
        {navSections.map((section, sectionIdx) => (
          <div key={section.label}>
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground/60 uppercase px-3">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item, itemIdx) => {
                    const isActive = currentPage === item.id;
                    const Icon = item.icon;
                    // Compute dynamic alert badge for alerts page
                    const badgeCount =
                      item.id === "alerts" ? unreadAlerts : item.badge;

                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.label}
                          onClick={() => setPage(item.id)}
                          className={cn(
                            "relative transition-all duration-200",
                            isActive
                              ? "sidebar-item-active text-primary"
                              : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                            isActive && "font-medium"
                          )}
                        >
                          <motion.div
                            className="flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                isActive
                                  ? "text-primary drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                                  : "text-muted-foreground group-hover/menu-button:text-sidebar-foreground"
                              )}
                            />
                          </motion.div>
                          <span className="truncate text-[13px]">
                            {item.label}
                          </span>
                        </SidebarMenuButton>
                        {badgeCount && badgeCount > 0 && (
                          <SidebarMenuBadge className="group-data-[collapsible=icon]:hidden">
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-md border",
                                getBadgeClass(item.badgeVariant)
                              )}
                            >
                              {badgeCount}
                            </Badge>
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {sectionIdx < navSections.length - 1 && (
              <SidebarSeparator className="bg-sidebar-border/30 my-1" />
            )}
          </div>
        ))}
      </SidebarContent>

      <SidebarSeparator className="bg-sidebar-border/50" />

      {/* Footer */}
      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50">
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
            <span className="text-xs font-bold text-primary">
              {user?.name?.charAt(0) || "C"}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-semibold text-sidebar-foreground truncate">
              {user?.name || "Operator"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {user?.role || "ONLINE"}
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}