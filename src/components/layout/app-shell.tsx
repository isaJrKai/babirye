"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BabiryeSidebar } from "./babirye-sidebar";
import { BabiryeHeader } from "./babirye-header";
import { CommandPalette } from "./command-palette";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <SidebarProvider defaultOpen={!sidebarCollapsed}>
      <BabiryeSidebar />
      <SidebarInset>
        <BabiryeHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}