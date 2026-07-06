"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  CheckCheck,
  ExternalLink,
  BellOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppStore, type PageId } from "@/stores/app-store";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

// ── Severity config ──────────────────────────────────────────────────────────
const severityConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; border: string }
> = {
  critical: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  info: {
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  success: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
};

// Map notification type to a page for "go to" link
function notificationTypeToPage(type: string): PageId | null {
  const map: Record<string, PageId> = {
    alert: "alerts",
    task: "tasks",
    vip: "vip-protection",
    sensor: "sensors",
    system: "settings",
  };
  return map[type] ?? null;
}

// ── Time ago helper ──────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Auth helper ──────────────────────────────────────────────────────────────
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("babirye_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addNotification, setPage } = useAppStore();

  // ── Fetch notifications via REST API ────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?view=count", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread ?? 0);
      }
    } catch {
      // Silent fail
    }
  }, []);

  // ── Initial load + polling every 15 seconds ────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  // ── Refresh notifications when panel opens ─────────────────────────────────
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // ── Mark single as read ────────────────────────────────────────────────────
  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications?action=mark_read&id=${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
    } catch { /* silent */ }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // ── Mark all as read ───────────────────────────────────────────────────────
  const handleMarkAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications?action=mark_all_read", {
        method: "PUT",
        headers: getAuthHeaders(),
      });
    } catch { /* silent */ }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  // ── Navigate to relevant page ──────────────────────────────────────────────
  const handleNavigate = useCallback(
    (notification: NotificationItem) => {
      const page = notificationTypeToPage(notification.type);
      if (page) {
        setPage(page);
        setOpen(false);
      }
      if (!notification.isRead) {
        handleMarkRead(notification.id);
      }
    },
    [setPage, handleMarkRead]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
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
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 bg-card border-border/50 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <Badge
                variant="outline"
                className="h-5 px-1.5 text-[10px] border-red-500/30 text-red-400 bg-red-500/5"
              >
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-primary hover:text-primary hover:bg-primary/10 gap-1"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="No notifications"
            description="You're all caught up. New notifications will appear here."
          />
        ) : (
          <ScrollArea className="max-h-80">
            <div className="flex flex-col">
              {notifications.map((notification) => {
                const config = severityConfig[notification.severity] ?? severityConfig.info;
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0",
                      !notification.isRead && "bg-primary/[0.03]"
                    )}
                    onClick={() => handleNavigate(notification)}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border mt-0.5",
                        config.bg,
                        config.border
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={cn(
                            "text-xs font-semibold truncate",
                            !notification.isRead
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground/50 font-mono">
                          {timeAgo(notification.createdAt)}
                        </span>
                        {notificationTypeToPage(notification.type) && (
                          <span className="flex items-center gap-0.5 text-[10px] text-primary/60">
                            <ExternalLink className="h-2.5 w-2.5" />
                            view
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mark read button */}
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 hover:bg-muted/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(notification.id);
                        }}
                      >
                        <CheckCheck className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator className="bg-border/30" />
            <div className="px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-[11px] text-primary hover:text-primary hover:bg-primary/10 justify-center"
                onClick={() => {
                  setPage("alerts");
                  setOpen(false);
                }}
              >
                View All Alerts
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}