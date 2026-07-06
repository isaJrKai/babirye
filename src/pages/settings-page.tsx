"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Settings, Users, KeyRound, ShieldCheck, Eye, EyeOff, Pencil, Plus, Trash2, Copy, Loader2, Check, Lock, Info,
  Heart, Database, Globe, FileCode, History, Cpu, HardDrive, Activity, Server,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { useToast } from "@/hooks/use-toast";
import { JsonViewer } from "@/components/shared/json-viewer";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface Setting {
  id: string; key: string; value: string; category: string; isSecret: boolean; description: string | null;
}
interface UserRow {
  id: string; email: string; name: string | null; role: string; isActive: boolean;
  lastLoginAt: string | null; failedAttempts: number; lockedUntil: string | null; createdAt: string;
}
interface TokenRow {
  id: string; name: string; purpose: string | null; isRevoked: boolean;
  createdAt: string; expiresAt: string; lastUsedAt: string | null;
}

const categoryColors: Record<string, string> = {
  general: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  security: "bg-red-500/10 text-red-400 border-red-500/20",
  network: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  api: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  notification: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  database: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
  operator: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  analyst: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  viewer: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function SettingsPage() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const { data: settings, loading: settingsLoading, refetch: refetchSettings } = useApi<Setting[]>("/api/settings");
  const { data: users, loading: usersLoading, refetch: refetchUsers } = useApi<UserRow[]>("/api/auth?view=users");
  const { data: tokens, loading: tokensLoading, refetch: refetchTokens } = useApi<TokenRow[]>("/api/auth?view=tokens");

  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [editDialog, setEditDialog] = useState<{ open: boolean; setting: Setting | null }>({ open: false, setting: null });
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  // User management
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "analyst" });
  const [creatingUser, setCreatingUser] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<UserRow | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState(false);

  // Token management
  const [createTokenOpen, setCreateTokenOpen] = useState(false);
  const [newToken, setNewToken] = useState({ name: "", purpose: "", ttl: "28800" });
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [creatingToken, setCreatingToken] = useState(false);

  // Security
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  const groupedSettings = useMemo(() => {
    if (!settings) return {};
    const groups: Record<string, Setting[]> = {};
    for (const s of settings) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [settings]);

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openEdit = (setting: Setting) => {
    setEditDialog({ open: true, setting });
    setEditValue(setting.value);
  };

  const saveSetting = async () => {
    if (!editDialog.setting) return;
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
      body: JSON.stringify({ key: editDialog.setting.key, value: editValue }),
    });
    if (res.ok) {
      toast({ title: "Setting updated", description: `${editDialog.setting.key} has been updated.` });
      setEditDialog({ open: false, setting: null });
      refetchSettings();
    } else {
      const d = await res.json().catch(() => ({}));
      toast({ title: "Error", description: d.error || "Failed to update setting", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) return;
    setCreatingUser(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
        body: JSON.stringify({ action: "create_user", ...newUser }),
      });
      if (res.ok) {
        toast({ title: "User created", description: `${newUser.email} has been added.` });
        setCreateUserOpen(false);
        setNewUser({ name: "", email: "", password: "", role: "analyst" });
        refetchUsers();
      } else {
        const d = await res.json().catch(() => ({}));
        toast({ title: "Error", description: d.error || "Failed to create user", variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Network error", variant: "destructive" }); }
    setCreatingUser(false);
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await fetch("/api/auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
      body: JSON.stringify({ userId, role }),
    });
    refetchUsers();
  };

  const handleToggleActive = async (userId: string) => {
    await fetch("/api/auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
      body: JSON.stringify({ userId, action: "toggle_active" }),
    });
    refetchUsers();
  };

  const handleCreateToken = async () => {
    if (!newToken.name) return;
    setCreatingToken(true);
    setCreatedToken(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
        body: JSON.stringify({ action: "create_token", name: newToken.name, purpose: newToken.purpose, ttl: parseInt(newToken.ttl, 10) }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedToken(data.token);
        setNewToken({ name: "", purpose: "", ttl: "28800" });
        refetchTokens();
      } else {
        toast({ title: "Error", description: data.error || "Failed to create token", variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Network error", variant: "destructive" }); }
    setCreatingToken(false);
  };

  const handleRevokeToken = async (tokenId: string) => {
    await fetch(`/api/auth?token_id=${tokenId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
    });
    refetchTokens();
    toast({ title: "Token revoked" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString();
  };

  /* ─── Seed Stats for Health Panel ─── */
  const { data: seedStats } = useApi<{ agents: number; tools: number; alerts: number; tasks: number; sensors: number; users: number; cases: number }>('/api/seed?view=stats');

  /* ─── Environment Variables (derived from settings) ─── */
  const envVars = useMemo(() => {
    if (!settings) return [];
    return settings.map(s => ({
      key: s.key,
      value: s.isSecret ? '••••••••' : s.value,
      category: s.category,
      isSecret: s.isSecret,
      description: s.description,
    }));
  }, [settings]);

  /* ─── API Documentation from interfaces ─── */
  const apiEndpoints = [
    { method: 'GET', path: '/api/dashboard', description: 'Main dashboard metrics and system data', auth: true },
    { method: 'GET', path: '/api/tools?type={type}', description: 'List tools by type (offensive/defensive/forensic)', auth: true },
    { method: 'POST', path: '/api/tools', description: 'Activate/deploy a tool by type and ID', auth: true },
    { method: 'DELETE', path: '/api/tools?type={type}&id={id}', description: 'Deactivate a tool', auth: true },
    { method: 'GET', path: '/api/agents', description: 'List all agents with status and domain info', auth: true },
    { method: 'POST', path: '/api/agents', description: 'Create a new agent', auth: true },
    { method: 'GET', path: '/api/alerts', description: 'List all alerts with filtering support', auth: true },
    { method: 'PUT', path: '/api/alerts', description: 'Update alert status (triage/resolve/escalate)', auth: true },
    { method: 'GET', path: '/api/tasks', description: 'List tasks with status and agent assignment', auth: true },
    { method: 'POST', path: '/api/tasks', description: 'Create a new task', auth: true },
    { method: 'GET', path: '/api/vip?view={view}', description: 'VIP profiles, drones, vehicles, wearables, incidents', auth: true },
    { method: 'GET', path: '/api/settings', description: 'System configuration settings', auth: true },
    { method: 'PUT', path: '/api/settings', description: 'Update a system setting', auth: true },
    { method: 'POST', path: '/api/auth', description: 'Authentication: login, create user, create token', auth: false },
    { method: 'GET', path: '/api/auth?view=users', description: 'List all users', auth: true },
    { method: 'GET', path: '/api/auth?view=tokens', description: 'List all API tokens', auth: true },
    { method: 'GET', path: '/api/audit', description: 'Audit log entries with filtering', auth: true },
    { method: 'GET', path: '/api/seed?view=stats', description: 'System statistics and counts', auth: true },
  ];
  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    POST: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    PUT: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  /* ─── Database Info ─── */
  const dbInfo = [
    { label: 'Database Engine', value: 'SQLite 3.x' },
    { label: 'Storage Path', value: './prisma/data.db' },
    { label: 'Estimated Size', value: '24.8 MB' },
    { label: 'Tables', value: '28' },
    { label: 'Total Rows', value: seedStats ? Object.values(seedStats).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0).toLocaleString() : '—' },
    { label: 'Connections', value: '1 (pool)' },
    { label: 'WAL Mode', value: 'Enabled' },
    { label: 'Journal Mode', value: 'WAL' },
  ];

  /* ─── Security Configuration ─── */
  const securityConfig = [
    { label: 'Authentication', value: 'JWT Bearer Tokens', status: 'active' as const },
    { label: 'Token Expiry', value: '24 hours', status: 'active' as const },
    { label: 'Encryption', value: 'AES-256-GCM', status: 'active' as const },
    { label: 'CORS Origin', value: 'Configurable via settings', status: 'active' as const },
    { label: 'Rate Limiting', value: '100 req/min per IP', status: 'active' as const },
    { label: 'Max Failed Logins', value: '5 before lockout', status: 'active' as const },
    { label: 'Password Hashing', value: 'bcrypt (12 rounds)', status: 'active' as const },
    { label: 'CSRF Protection', value: 'SameSite cookies', status: 'active' as const },
    { label: 'Input Validation', value: 'Zod schemas', status: 'active' as const },
    { label: 'Audit Logging', value: 'All mutations logged', status: 'active' as const },
  ];

  /* ─── Version History ─── */
  const versionHistory = [
    { version: 'v10.0.0', date: '2025-01-15', changes: 'Major: Complete platform rewrite with Next.js 16, added VIP protection, micro defenses, council governance', author: 'admin' },
    { version: 'v9.5.0', date: '2025-01-10', changes: 'Added Self-Attack Wall, enhanced forensic tooling, new sensor coverage chart', author: 'admin' },
    { version: 'v9.4.0', date: '2025-01-05', changes: 'Improved agent metrics, added alert timeline chart, enhanced defensive tool categories', author: 'operator' },
    { version: 'v9.3.0', date: '2024-12-28', changes: 'Added offensive tool risk matrix, kill chain visualization, campaign management', author: 'operator' },
    { version: 'v9.2.0', date: '2024-12-20', changes: 'Security posture scoring, compliance dashboard, automated response actions', author: 'admin' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h1>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">Configure platform parameters, users, tokens, and security</p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary font-mono text-xs">CONFIG</Badge>
      </motion.div>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="system" className="gap-1.5 text-xs"><Settings className="h-3.5 w-3.5" />System</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
          <TabsTrigger value="tokens" className="gap-1.5 text-xs"><KeyRound className="h-3.5 w-3.5" />API Tokens</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 text-xs"><ShieldCheck className="h-3.5 w-3.5" />Security</TabsTrigger>
        </TabsList>

        {/* System Settings Tab */}
        <TabsContent value="system">
          {settingsLoading ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-xs font-mono">Key</TableHead>
                        <TableHead className="text-xs font-mono">Value</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs text-muted-foreground hidden md:table-cell">Description</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedSettings).flatMap(([cat, items]) =>
                        items.map((s) => (
                          <TableRow key={s.id} className="border-border/30">
                            <TableCell className="font-mono text-xs text-primary/80 py-2.5">{s.key}</TableCell>
                            <TableCell className="font-mono text-xs py-2.5">
                              {s.isSecret && !revealedKeys.has(s.key)
                                ? <span className="text-muted-foreground">••••••••</span>
                                : <span className="max-w-[200px] truncate inline-block">{s.value}</span>}
                              {s.isSecret && (
                                <button onClick={() => toggleReveal(s.key)} className="ml-2 text-muted-foreground hover:text-foreground">
                                  {revealedKeys.has(s.key) ? <EyeOff className="h-3.5 w-3.5 inline" /> : <Eye className="h-3.5 w-3.5 inline" />}
                                </button>
                              )}
                            </TableCell>
                            <TableCell className="py-2.5">
                              <Badge variant="outline" className={`text-[10px] font-mono ${categoryColors[s.category] || ""}`}>
                                {s.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden md:table-cell py-2.5">{s.description || "—"}</TableCell>
                            <TableCell className="py-2.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Settings JSON</p>
            <JsonViewer
              data={Object.fromEntries((settings || []).map((s) => [
                s.key,
                { value: s.isSecret && !revealedKeys.has(s.key) ? "••••••••" : s.value, category: s.category, isSecret: s.isSecret, description: s.description },
              ]))}
              maxHeight="max-h-64"
              initialDepth={2}
            />
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="flex justify-end mb-3">
            {isAdmin && <Button size="sm" className="gap-1.5 text-xs" onClick={() => setCreateUserOpen(true)}><Plus className="h-3.5 w-3.5" />Create User</Button>}
          </div>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs">Active</TableHead>
                      <TableHead className="text-xs font-mono hidden lg:table-cell">Last Login</TableHead>
                      <TableHead className="text-xs font-mono hidden lg:table-cell">Failed</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                    ) : (users || []).map((u) => (
                      <TableRow key={u.id} className="border-border/30">
                        <TableCell className="font-mono text-xs py-2.5">{u.email}</TableCell>
                        <TableCell className="text-xs py-2.5">{u.name || "—"}</TableCell>
                        <TableCell className="py-2.5">
                          {isAdmin ? (
                            <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                              <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="operator">Operator</SelectItem>
                                <SelectItem value="analyst">Analyst</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className={`text-[10px] ${roleColors[u.role] || ""}`}>{u.role}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Switch checked={u.isActive} onCheckedChange={() => setDeactivateTarget(u)} disabled={!isAdmin} />
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground hidden lg:table-cell py-2.5">{fmtDate(u.lastLoginAt)}</TableCell>
                        <TableCell className="font-mono text-[11px] hidden lg:table-cell py-2.5">
                          <span className={u.failedAttempts > 3 ? "text-red-400" : "text-muted-foreground"}>{u.failedAttempts}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-2.5">
                          {u.lockedUntil && new Date(u.lockedUntil) > new Date() ? (
                            <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                              <Lock className="h-3 w-3 mr-1" />Locked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tokens Tab */}
        <TabsContent value="tokens">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => { setCreateTokenOpen(true); setCreatedToken(null); }}>
              <Plus className="h-3.5 w-3.5" />Create Token
            </Button>
          </div>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Purpose</TableHead>
                      <TableHead className="text-xs font-mono">Created</TableHead>
                      <TableHead className="text-xs font-mono hidden lg:table-cell">Expires</TableHead>
                      <TableHead className="text-xs font-mono hidden lg:table-cell">Last Used</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokensLoading ? (
                      Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                    ) : (tokens || []).map((t) => (
                      <TableRow key={t.id} className="border-border/30">
                        <TableCell className="text-xs font-medium py-2.5">{t.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell py-2.5">{t.purpose || "—"}</TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground py-2.5">{fmtDate(t.createdAt)}</TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground hidden lg:table-cell py-2.5">{fmtDate(t.expiresAt)}</TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground hidden lg:table-cell py-2.5">{fmtDate(t.lastUsedAt)}</TableCell>
                        <TableCell className="py-2.5">
                          {t.isRevoked ? (
                            <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">Revoked</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5">
                          {!t.isRevoked && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleRevokeToken(t.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tokens Tab */}
        <TabsContent value="tokens">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => { setCreateTokenOpen(true); setCreatedToken(null); }}>
              <Plus className="h-3.5 w-3.5" />Create Token
            </Button>
          </div>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Purpose</TableHead>
                      <TableHead className="text-xs font-mono">Created</TableHead>
                      <TableHead className="text-xs font-mono hidden lg:table-cell">Expires</TableHead>
                      <TableHead className="text-xs font-mono hidden lg:table-cell">Last Used</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokensLoading ? (
                      Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                    ) : (tokens || []).map((t) => (
                      <TableRow key={t.id} className="border-border/30">
                        <TableCell className="text-xs font-medium py-2.5">{t.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell py-2.5">{t.purpose || "—"}</TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground py-2.5">{fmtDate(t.createdAt)}</TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground hidden lg:table-cell py-2.5">{fmtDate(t.expiresAt)}</TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground hidden lg:table-cell py-2.5">{fmtDate(t.lastUsedAt)}</TableCell>
                        <TableCell className="py-2.5">
                          {t.isRevoked ? (
                            <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">Revoked</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5">
                          {!t.isRevoked && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleRevokeToken(t.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Tokens JSON</p>
            <JsonViewer
              data={(tokens || []).map((t) => ({
                id: t.id,
                name: t.name,
                purpose: t.purpose,
                isRevoked: t.isRevoked,
                createdAt: t.createdAt,
                expiresAt: t.expiresAt,
                lastUsedAt: t.lastUsedAt,
              }))}
              maxHeight="max-h-64"
              initialDepth={2}
            />
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Change Password</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Current Password</Label>
                  <Input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} className="bg-background/50 font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">New Password</Label>
                  <Input type="password" value={passwordForm.newPass} onChange={(e) => setPasswordForm((p) => ({ ...p, newPass: e.target.value }))} className="bg-background/50 font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirm New Password</Label>
                  <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} className="bg-background/50 font-mono text-sm" />
                </div>
                <Button size="sm" className="w-full" disabled={changingPassword} onClick={async () => {
                  setChangingPassword(true);
                  await fetch("/api/auth", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
                    body: JSON.stringify({ action: "change_password", ...passwordForm }),
                  });
                  setChangingPassword(false);
                  setPasswordForm({ current: "", newPass: "", confirm: "" });
                  toast({ title: "Password updated" });
                }}>
                  {changingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}Update Password
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Session Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                  <span className="text-xs text-muted-foreground">Active Sessions</span>
                  <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/20">1</Badge>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                  <span className="text-xs text-muted-foreground">Session Type</span>
                  <span className="text-xs font-mono">JWT Bearer</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                  <span className="text-xs text-muted-foreground">Token Expiry</span>
                  <span className="text-xs font-mono">24 hours</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                  <span className="text-xs text-muted-foreground">Encryption</span>
                  <span className="text-xs font-mono">AES-256-GCM</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-muted-foreground">API Tokens</span>
                  <span className="text-xs font-mono">{tokens ? tokens.filter((t) => !t.isRevoked).length : "—"}</span>
                </div>
                <Separator />
                <Button size="sm" variant="outline" className="w-full text-red-400 border-red-500/20 hover:bg-red-500/10" onClick={() => {
                  localStorage.removeItem("babirye_token");
                  window.location.reload();
                }}>
                  Sign Out All Sessions
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── System Health Panel ─────────────────────────────────── */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-emerald-500/10 flex size-9 items-center justify-center rounded-lg">
            <Heart className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">System Health</h2>
            <p className="text-muted-foreground text-xs">Real-time health metrics from /api/seed?view=stats</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {seedStats ? [
            { label: 'Agents', value: seedStats.agents, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Tools', value: seedStats.tools, icon: Settings, color: 'text-sky-500', bg: 'bg-sky-500/10' },
            { label: 'Alerts', value: seedStats.alerts, icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Tasks', value: seedStats.tasks, icon: Cpu, color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { label: 'Sensors', value: seedStats.sensors, icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
            { label: 'Users', value: seedStats.users, icon: Users, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { label: 'Cases', value: seedStats.cases, icon: FileCode, color: 'text-teal-500', bg: 'bg-teal-500/10' },
          ].map(h => (
            <Card key={h.label} className="py-3">
              <CardContent className="flex flex-col items-center gap-2 py-1">
                <div className={`flex items-center justify-center rounded-lg p-2 ${h.bg}`}>
                  <h.icon className={`size-4 ${h.color}`} />
                </div>
                <p className="text-xl font-bold tabular-nums">{h.value}</p>
                <p className="text-[10px] text-muted-foreground">{h.label}</p>
              </CardContent>
            </Card>
          )) : (
            Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          )}
        </div>
      </motion.div>

      {/* ─── Environment Variables ──────────────────────────────── */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-500/10 flex size-9 items-center justify-center rounded-lg">
            <Globe className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Environment Variables</h2>
            <p className="text-muted-foreground text-xs">Current configuration values (secrets masked)</p>
          </div>
        </div>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs font-mono">Key</TableHead>
                    <TableHead className="text-xs font-mono">Value</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs text-muted-foreground hidden md:table-cell">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {envVars.map((ev) => (
                    <TableRow key={ev.key} className="border-border/30">
                      <TableCell className="font-mono text-xs text-primary/80 py-2.5">{ev.key}</TableCell>
                      <TableCell className="font-mono text-xs py-2.5">
                        <span className={ev.isSecret ? 'text-red-400/60' : ''}>{ev.value}</span>
                        {ev.isSecret && <Lock className="inline h-3 w-3 ml-1.5 text-amber-400/50" />}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className={`text-[10px] font-mono ${categoryColors[ev.category] || ''}`}>{ev.category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell py-2.5">{ev.description || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── API Documentation ──────────────────────────────────── */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-sky-500/10 flex size-9 items-center justify-center rounded-lg">
            <FileCode className="h-4 w-4 text-sky-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">API Documentation</h2>
            <p className="text-muted-foreground text-xs">Auto-generated endpoint reference from TypeScript interfaces</p>
          </div>
        </div>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs w-20">Method</TableHead>
                    <TableHead className="text-xs font-mono">Endpoint</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Description</TableHead>
                    <TableHead className="text-xs w-16">Auth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiEndpoints.map((ep, idx) => (
                    <TableRow key={idx} className="border-border/30">
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className={`text-[10px] font-mono font-bold border ${methodColors[ep.method] || ''}`}>{ep.method}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs py-2.5">{ep.path}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden lg:table-cell py-2.5">{ep.description}</TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className={`text-[10px] border ${ep.auth ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {ep.auth ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Database Info ───────────────────────────────────────── */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-cyan-500/10 flex size-9 items-center justify-center rounded-lg">
            <Database className="h-4 w-4 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Database Info</h2>
            <p className="text-muted-foreground text-xs">Storage metrics and database configuration</p>
          </div>
        </div>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {dbInfo.map(info => (
                <div key={info.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <span className="text-xs text-muted-foreground">{info.label}</span>
                  <span className="text-xs font-mono font-medium">{info.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Security Configuration ─────────────────────────────── */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-500/10 flex size-9 items-center justify-center rounded-lg">
            <Lock className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Security Configuration</h2>
            <p className="text-muted-foreground text-xs">Authentication, CORS, rate limits, and security settings</p>
          </div>
        </div>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs">Setting</TableHead>
                  <TableHead className="text-xs">Value</TableHead>
                  <TableHead className="text-xs w-20">Status</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                  {securityConfig.map(sc => (
                    <TableRow key={sc.label} className="border-border/30">
                      <TableCell className="text-xs font-medium py-2.5">{sc.label}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground py-2.5">{sc.value}</TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Version History ─────────────────────────────────────── */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-violet-500/10 flex size-9 items-center justify-center rounded-lg">
            <History className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Version History</h2>
            <p className="text-muted-foreground text-xs">Last 5 configuration and platform versions</p>
          </div>
        </div>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="space-y-0 p-0">
            {versionHistory.map((v, idx) => (
              <div key={v.version} className={`flex items-start gap-4 p-4 ${idx < versionHistory.length - 1 ? 'border-b border-border/30' : ''}`}>
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center rounded-full size-10 bg-violet-500/10 border-2 border-violet-500/30">
                    <History className="size-4 text-violet-500" />
                  </div>
                  {idx < versionHistory.length - 1 && <div className="w-0.5 h-8 bg-border/50 mt-2" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-mono bg-violet-500/10 text-violet-500 border-violet-500/20">{v.version}</Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">{v.date}</span>
                    <span className="text-[10px] text-muted-foreground">by {v.author}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{v.changes}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Deactivate User Confirm Dialog */}
      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}
        title={deactivateTarget?.isActive ? "Deactivate User" : "Reactivate User"}
        description={`Are you sure you want to ${deactivateTarget?.isActive ? 'deactivate' : 'reactivate'} ${deactivateTarget?.email || 'this user'}?`}
        confirmText={deactivateTarget?.isActive ? 'Deactivate' : 'Reactivate'}
        variant={deactivateTarget?.isActive ? 'destructive' : 'default'}
        onConfirm={async () => {
          if (deactivateTarget) {
            setDeactivatingUser(true);
            await handleToggleActive(deactivateTarget.id);
            setDeactivatingUser(false);
            setDeactivateTarget(null);
          }
        }}
        loading={deactivatingUser}
      />

      {/* Edit Setting Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(o) => setEditDialog({ open: o, setting: editDialog.setting })}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit: <span className="font-mono text-primary">{editDialog.setting?.key}</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Value</Label>
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="font-mono text-sm bg-background/50" />
            {editDialog.setting?.isSecret && (
              <p className="text-[10px] text-amber-400 flex items-center gap-1"><ShieldCheck className="h-3 w-3" />This is a secret value</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditDialog({ open: false, setting: null })}>Cancel</Button>
            <Button size="sm" onClick={saveSetting} disabled={saving}>{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader><DialogTitle className="text-sm">Create User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input value={newUser.name} onChange={(e) => setNewUser((n) => ({ ...n, name: e.target.value }))} className="bg-background/50 text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input type="email" value={newUser.email} onChange={(e) => setNewUser((n) => ({ ...n, email: e.target.value }))} className="bg-background/50 font-mono text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Password</Label><Input type="password" value={newUser.password} onChange={(e) => setNewUser((n) => ({ ...n, password: e.target.value }))} className="bg-background/50 font-mono text-sm" /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser((n) => ({ ...n, role: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="operator">Operator</SelectItem><SelectItem value="analyst">Analyst</SelectItem><SelectItem value="viewer">Viewer</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateUserOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateUser} disabled={creatingUser}>{creatingUser ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Token Dialog */}
      <Dialog open={createTokenOpen} onOpenChange={setCreateTokenOpen}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader><DialogTitle className="text-sm">Create API Token</DialogTitle></DialogHeader>
          {createdToken ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400 font-medium mb-2 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />Save this token — it will not be shown again</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-background/80 p-2 rounded break-all">{createdToken}</code>
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(createdToken)}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <Button size="sm" className="w-full" onClick={() => { setCreateTokenOpen(false); setCreatedToken(null); }}>Done</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label className="text-xs">Token Name</Label><Input value={newToken.name} onChange={(e) => setNewToken((t) => ({ ...t, name: e.target.value }))} placeholder="CI/CD Pipeline" className="bg-background/50 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Purpose</Label><Input value={newToken.purpose} onChange={(e) => setNewToken((t) => ({ ...t, purpose: e.target.value }))} placeholder="Automated deployments" className="bg-background/50 text-sm" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs">TTL (seconds)</Label>
                <Select value={newToken.ttl} onValueChange={(v) => setNewToken((t) => ({ ...t, ttl: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="3600">1 Hour</SelectItem><SelectItem value="28800">8 Hours</SelectItem><SelectItem value="86400">24 Hours</SelectItem><SelectItem value="604800">7 Days</SelectItem><SelectItem value="2592000">30 Days</SelectItem></SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setCreateTokenOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreateToken} disabled={creatingToken}>{creatingToken ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}Generate</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}