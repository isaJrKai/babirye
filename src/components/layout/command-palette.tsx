"use client";

import { useEffect, useState, useCallback } from "react";
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
  Database,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAppStore, type PageId } from "@/stores/app-store";

// ── Command definitions ─────────────────────────────────────────────────────

interface CommandEntry {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ElementType;
  group: string;
  action: () => void;
}

function buildCommands(setPage: (p: PageId) => void): CommandEntry[] {
  const pages: {
    id: PageId;
    label: string;
    icon: React.ElementType;
    shortcut?: string;
  }[] = [
    { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard, shortcut: "1" },
    { id: "agents", label: "Go to Agents", icon: Bot, shortcut: "2" },
    { id: "tasks", label: "Go to Tasks", icon: ListTodo, shortcut: "3" },
    { id: "expert-council", label: "Go to Expert Council", icon: Users, shortcut: "4" },
    { id: "potentials", label: "Go to Potentials", icon: Zap, shortcut: "5" },
    { id: "intel-feeds", label: "Go to Intel Feeds", icon: Rss, shortcut: "6" },
    { id: "forensic", label: "Go to Forensic", icon: Search, shortcut: "7" },
    { id: "offensive", label: "Go to Offensive", icon: Crosshair, shortcut: "8" },
    { id: "defensive", label: "Go to Defensive", icon: Shield, shortcut: "9" },
    { id: "micro-defensive", label: "Go to Micro-Defensive", icon: ShieldCheck },
    { id: "sensors", label: "Go to Sensors", icon: Radio },
    { id: "vip-protection", label: "Go to VIP Protection", icon: Crown },
    { id: "self-attack-wall", label: "Go to Self-Attack Wall", icon: Lock },
    { id: "alerts", label: "Go to Alerts", icon: Bell },
    { id: "audit-logs", label: "Go to Audit Logs", icon: FileText },
    { id: "spa-gateways", label: "Go to SPA Gateways", icon: Network },
    { id: "reports", label: "Go to Reports", icon: FileBarChart },
    { id: "weapons-db", label: "Go to Weapons DB", icon: Sword },
    { id: "martial-arts", label: "Go to Martial Arts", icon: Hand },
    { id: "constitutions", label: "Go to Constitutions", icon: ScrollText },
    { id: "settings", label: "Go to Settings", icon: Settings },
  ];

  const navCommands: CommandEntry[] = pages.map((p) => ({
    id: `nav:${p.id}`,
    label: p.label,
    shortcut: p.shortcut,
    icon: p.icon,
    group: "Navigation",
    action: () => setPage(p.id),
  }));

  const actionCommands: CommandEntry[] = [
    {
      id: "action:seed",
      label: "Seed Database",
      icon: Database,
      group: "Actions",
      action: () => {
        fetch("/api/seed", { method: "POST" }).then((res) => {
          if (res.ok) window.location.reload();
        });
      },
    },
    {
      id: "action:audit",
      label: "View Audit Logs",
      icon: FileText,
      group: "Actions",
      action: () => setPage("audit-logs"),
    },
    {
      id: "action:alerts",
      label: "Check Alerts",
      icon: AlertTriangle,
      group: "Actions",
      action: () => setPage("alerts"),
    },
    {
      id: "action:clear-notifications",
      label: "Clear All Notifications",
      icon: CheckCircle2,
      group: "Actions",
      action: () => {
        const { clearNotifications } = useAppStore.getState();
        clearNotifications();
      },
    },
  ];

  return [...navCommands, ...actionCommands];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const setPage = useAppStore((s) => s.setPage);

  // Build command list once
  const commands = useState(() => buildCommands(setPage))[0];

  // ── Global keyboard listener ─────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      // Numeric shortcuts 1-9 for quick navigation
      if (open && e.key >= "1" && e.key <= "9") {
        const pageMap: Record<string, PageId> = {
          "1": "dashboard",
          "2": "agents",
          "3": "tasks",
          "4": "expert-council",
          "5": "potentials",
          "6": "intel-feeds",
          "7": "forensic",
          "8": "offensive",
          "9": "defensive",
        };
        const page = pageMap[e.key];
        if (page) {
          e.preventDefault();
          setPage(page);
          setOpen(false);
        }
      }
    },
    [open, setPage]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Group commands
  const groups = commands.reduce<Record<string, CommandEntry[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});

  const handleSelect = useCallback(
    (cmd: CommandEntry) => {
      cmd.action();
      setOpen(false);
    },
    []
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Search for a command to run..."
      className="sm:max-w-lg border-border/50 bg-card/95 backdrop-blur-xl"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Type a command or search..."
        className="text-sm font-mono placeholder:text-muted-foreground/50"
      />
      <CommandList className="max-h-96">
        <CommandEmpty className="py-8">
          <div className="flex flex-col items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground/60">
              No commands found.
            </p>
          </div>
        </CommandEmpty>

        {Object.entries(groups).map(([group, cmds], groupIdx) => (
          <div key={group}>
            <CommandGroup
              heading={group.toUpperCase()}
              className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.15em]"
            >
              {cmds.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CommandItem
                    key={cmd.id}
                    onSelect={() => handleSelect(cmd)}
                    className="flex items-center gap-3 py-2.5 px-3 cursor-pointer"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="flex-1 text-sm">{cmd.label}</span>
                    {cmd.shortcut && (
                      <CommandShortcut className="text-[10px] font-mono text-muted-foreground/50 border border-border/50 rounded px-1.5 py-0.5 bg-muted/30">
                        {cmd.shortcut}
                      </CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {groupIdx < Object.entries(groups).length - 1 && (
              <CommandSeparator className="bg-border/30" />
            )}
          </div>
        ))}
      </CommandList>

      {/* Footer hint */}
      <div className="flex items-center justify-between border-t border-border/30 px-4 py-2 bg-muted/20">
        <span className="text-[10px] text-muted-foreground/50 font-mono">
          1-9 quick nav
        </span>
        <div className="flex items-center gap-2">
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/50 bg-muted/50 px-1 font-mono text-[9px] text-muted-foreground">
            ESC
          </kbd>
          <span className="text-[10px] text-muted-foreground/50">to close</span>
        </div>
      </div>
    </CommandDialog>
  );
}