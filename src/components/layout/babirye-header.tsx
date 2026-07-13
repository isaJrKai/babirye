"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Command,
  Moon,
  Sun,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore, type Notification } from "@/stores/app-store";
import { useTheme } from "next-themes";

function useCurrentTime() {
  const [time, setTime] = useState<Date>(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

export function BabiryeHeader() {
  const { notifications, user, setPage, setUser, setNotifications } = useAppStore();
  const { theme, setTheme } = useTheme();
  const time = useCurrentTime();
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("babirye_token");
      if (!token) return;
      const res = await fetch("/api/notifications?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const notifs = Array.isArray(data.notifications) ? data.notifications : Array.isArray(data.data) ? data.data : [];
        if (notifs.length > 0) {
          const mapped: Notification[] = notifs.map((n: Record<string, unknown>) => ({
            id: String(n.id),
            title: String(n.title || ""),
            message: String(n.message || ""),
            type: (["info", "warning", "critical", "success"].includes(String(n.type)) ? n.type : "info") as Notification["type"],
            timestamp: n.createdAt ? new Date(String(n.createdAt)) : new Date(),
            read: Boolean(n.isRead || n.read),
          }));
          setNotifications(mapped);
        }
      }
    } catch { /* silent */ }
  }, [setNotifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fetch user from API
  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("babirye_token");
        if (!token) return;
        const res = await fetch("/api/auth?view=me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const roleMap: Record<string, number> = { admin: 5, operator: 4, analyst: 3, viewer: 1 };
            setUser({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              clearanceLevel: roleMap[data.user.role] || 1,
            });
          }
        }
      } catch { /* silent */ }
    }
    fetchUser();
  }, [setUser]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("babirye_token");
    setUser(null);
    setNotifications([]);
    window.location.reload();
  }, [setUser, setNotifications]);

  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/50 bg-card/80 backdrop-blur-xl px-4 data-grid-bg">
      {/* Left: Sidebar trigger + Logo */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="h-6 bg-border/50" />
        <div className="hidden sm:flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-wider text-foreground">
            BABIRYE
          </span>
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-[10px] font-mono text-primary/80 border-primary/30 bg-primary/5"
          >
            v10.0.0
          </Badge>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search operations, agents, intel..."
            className="h-9 pl-9 pr-20 bg-background/50 border-border/50 text-sm font-mono placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] text-muted-foreground">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* System Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium text-emerald-400">
                Operational
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>All systems nominal</p>
          </TooltipContent>
        </Tooltip>

        {/* Time Display */}
        <div className="hidden lg:flex flex-col items-end px-2">
          <span className="font-mono text-xs text-foreground font-medium tabular-nums leading-tight">
            {formattedTime}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            {formattedDate}
          </span>
        </div>

        <Separator orientation="vertical" className="h-6 bg-border/50 hidden sm:block" />

        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle theme</p>
          </TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Bell className="h-4 w-4" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent
            align="end"
            className="w-80 bg-card border-border/50"
          >
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="text-sm font-semibold">Notifications</span>
              <Badge
                variant="outline"
                className="h-5 text-[10px] border-primary/30 text-primary"
              >
                {unreadCount} new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">No notifications</div>
            ) : (
              notifications.slice(0, 4).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        notification.type === "critical"
                          ? "bg-red-500"
                          : notification.type === "warning"
                          ? "bg-amber-500"
                          : notification.type === "success"
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                      } ${!notification.read ? "animate-pulse-dot" : ""}`}
                    />
                    <span className="text-xs font-semibold text-foreground">
                      {notification.title}
                    </span>
                    {!notification.read && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground pl-4 line-clamp-2">
                    {notification.message}
                  </span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              className="text-center text-xs text-primary cursor-pointer justify-center"
              onClick={() => setPage("alerts")}
            >
              View All Alerts
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 bg-border/50" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-8 px-2 hover:bg-accent/50"
            >
              <Avatar className="h-7 w-7 border border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-medium text-foreground leading-tight">
                  {user?.name || "Loading..."}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight font-mono">
                  CL-{user?.clearanceLevel || 1}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-card border-border/50"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {user?.name || "Operator"}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {user?.email || "operator@babirye.sec"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="cursor-pointer" onClick={() => setPage("settings")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setPage("settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="cursor-pointer text-red-400 focus:text-red-400" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}