import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "critical" | "success";
  timestamp: Date;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  clearanceLevel: number;
}

export type PageId =
  | "dashboard"
  | "agents"
  | "tasks"
  | "expert-council"
  | "potentials"
  | "intel-feeds"
  | "forensic"
  | "offensive"
  | "defensive"
  | "micro-defensive"
  | "sensors"
  | "vip-protection"
  | "self-attack-wall"
  | "alerts"
  | "audit-logs"
  | "spa-gateways"
  | "reports"
  | "weapons-db"
  | "martial-arts"
  | "constitutions"
  | "settings";

interface AppState {
  currentPage: PageId;
  sidebarCollapsed: boolean;
  theme: string;
  notifications: Notification[];
  user: User | null;

  setPage: (page: PageId) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: string) => void;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setUser: (user: User | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "dashboard",
  sidebarCollapsed: false,
  theme: "dark",
  notifications: [
    {
      id: "n1",
      title: "Critical Alert",
      message: "Unusual traffic pattern detected on perimeter network segment 7",
      type: "critical",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      read: false,
    },
    {
      id: "n2",
      title: "Threat Intel Update",
      message: "3 new CVEs published affecting current infrastructure stack",
      type: "warning",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false,
    },
    {
      id: "n3",
      title: "Agent Deployed",
      message: "Honeypot agent ALPHA-7 successfully deployed to DMZ zone",
      type: "success",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      read: true,
    },
    {
      id: "n4",
      title: "Scan Complete",
      message: "Weekly vulnerability scan completed. 0 critical findings.",
      type: "info",
      timestamp: new Date(Date.now() - 120 * 60 * 1000),
      read: true,
    },
  ],
  user: {
    id: "u1",
    name: "Commander Nyx",
    email: "nyx@babirye.sec",
    role: "SOC Director",
    clearanceLevel: 5,
  },

  setPage: (page) => set({ currentPage: page }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setTheme: (theme) => set({ theme }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: `n-${Date.now()}`,
          timestamp: new Date(),
          read: false,
        },
        ...state.notifications,
      ],
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
  setUser: (user) => set({ user }),
}));