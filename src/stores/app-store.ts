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
  setNotifications: (notifications: Notification[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "dashboard",
  sidebarCollapsed: false,
  theme: "dark",
  notifications: [],
  user: {
    id: 'dev-admin',
    name: 'Commander Nyx',
    email: 'admin@babirye.local',
    role: 'admin',
    clearanceLevel: 5,
  } as User,

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
  setNotifications: (notifications) => set({ notifications }),
}));