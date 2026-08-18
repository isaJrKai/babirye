"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/app-store";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const { setUser } = useAppStore();

  useEffect(() => {
    fetch("/api/auth?view=setup_required")
      .then((r) => r.json())
      .then((d) => {
        if (d.setupRequired) setMode("setup");
      })
      .catch(() => {});
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError(null);
    setRemainingAttempts(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        setLoading(false);
        return;
      }

      localStorage.setItem("babirye_token", data.token);
      setUser({
        id: data.user.id,
        name: data.user.name || data.user.email,
        email: data.user.email,
        role: data.user.role,
        clearanceLevel: data.user.role === "admin" ? 5 : data.user.role === "operator" ? 4 : 3,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup", email, password, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Setup failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("babirye_token", data.token);
      setUser({
        id: data.user.id,
        name: data.user.name || data.user.email,
        email: data.user.email,
        role: data.user.role,
        clearanceLevel: 5,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "setup") handleSetup();
    else handleLogin();
  };

  const isLocked = remainingAttempts !== null && remainingAttempts <= 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border/50 bg-card/90 backdrop-blur-xl shadow-2xl shadow-black/20">
          <CardContent className="p-8">
            {/* Branding */}
            <div className="text-center space-y-4 mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="inline-flex items-center justify-center h-16 w-16 rounded-2xl border border-primary/30 bg-primary/10"
              >
                <Shield className="h-8 w-8 text-primary" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold tracking-wider text-foreground">
                  BABIRYE
                </h1>
                <p className="text-xs text-muted-foreground font-mono tracking-widest mt-1">
                  SECURITY OPERATIONS PLATFORM
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-primary/20 text-primary/70 bg-primary/5"
              >
                v10.0.0 Titanium Ultra
              </Badge>
            </div>

            {/* Form Title */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {mode === "setup" ? "System Initialization" : "Secure Access"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "setup"
                  ? "Configure the primary administrator account"
                  : "Authenticate to access the operations center"}
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <p className="text-sm text-red-400 font-medium">{error}</p>
                {isLocked && (
                  <p className="text-xs text-red-400/70 mt-1">
                    Account locked. Contact your system administrator.
                  </p>
                )}
                {!isLocked && remainingAttempts !== null && remainingAttempts < 5 && (
                  <p className="text-xs text-amber-400/80 mt-1 font-mono">
                    {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
                  </p>
                )}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "setup" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-muted-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Commander Nyx"
                    className="bg-background/50 border-border/50 font-mono"
                    disabled={loading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@babirye.sec"
                  className="bg-background/50 border-border/50 font-mono"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "setup" ? "Min. 12 characters" : "••••••••••••"}
                    className="bg-background/50 border-border/50 font-mono pr-10"
                    disabled={loading}
                    autoComplete={mode === "setup" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === "setup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-sm text-muted-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-background/50 border-border/50 font-mono"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === "setup" ? "Initializing..." : "Authenticating..."}
                  </span>
                ) : mode === "setup" ? (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create Administrator
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center space-y-2">
              <p className="text-[10px] font-mono text-muted-foreground/50">
                AES-256-GCM encrypted session • Zero-knowledge architecture
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/30">
                © BABIRYE Security Systems — All rights reserved
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}