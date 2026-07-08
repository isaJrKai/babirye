/**
 * BABIRYE v10.0.0 — WebSocket Notification Service
 *
 * Runs on port 3003 using bun + socket.io.
 * Connects to the BABIRYE SQLite database using bun:sqlite.
 * Polls for new notifications every 5 seconds and pushes to connected clients.
 * Supports mark-as-read via WebSocket and broadcasts system events.
 */

import { createServer } from "http";
import { Server } from "socket.io";
import Database from "bun:sqlite";

// ─────────────────────────────────────────────────────────────────────────────
// Database connection
// ─────────────────────────────────────────────────────────────────────────────
const DB_PATH = "/home/z/my-project/db/custom.db";
let db: Database.Database;

try {
  db = new Database(DB_PATH, { readonly: true, create: false });
  console.log(`[DB] Connected to ${DB_PATH}`);
} catch (err) {
  console.error(`[DB] Failed to open database at ${DB_PATH}:`, err);
  // Retry with WAL mode support
  try {
    db = new Database(DB_PATH, { create: false });
    console.log(`[DB] Connected to ${DB_PATH} (read-write fallback)`);
  } catch (retryErr) {
    console.error(`[DB] Fatal: cannot connect to database`, retryErr);
    process.exit(1);
  }
}

// Enable WAL mode for better concurrent read performance
try {
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA busy_timeout=5000");
} catch {
  // Read-only connection may not allow PRAGMA changes — that's fine
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP + Socket.io server
// ─────────────────────────────────────────────────────────────────────────────
const httpServer = createServer();

const io = new Server(httpServer, {
  path: "/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Health check: intercept non-socket.io GET / before socket.io processes it
httpServer.prependListener("request", (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  if (
    req.method === "GET" &&
    url.pathname === "/" &&
    !url.searchParams.has("EIO") &&
    !url.searchParams.has("transport")
  ) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        service: "babirye-notification-service",
        version: "1.0.0",
        status: "operational",
        uptime: process.uptime(),
        connectedClients: io.engine.clientsCount,
        timestamp: new Date().toISOString(),
      })
    );
  }
});

const PORT = 3003;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface NotificationRow {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: number;
  actionUrl: string | null;
  metadata: string;
  createdAt: string;
}

interface SystemEvent {
  type: "alert_triggered" | "task_completed" | "vip_sos" | "wall_block" | "system";
  title: string;
  message: string;
  severity: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
const connectedClients = new Map<
  string,
  { socketId: string; userId?: string; connectedAt: Date }
>();

// Track last-seen notification timestamps per client for incremental push
const clientLastSeen = new Map<string, string>();

// ─────────────────────────────────────────────────────────────────────────────
// Helper: query unread notifications from DB
// ─────────────────────────────────────────────────────────────────────────────
function getUnreadNotifications(
  since?: string
): NotificationRow[] {
  if (since) {
    return db
      .query(
        `SELECT * FROM Notification WHERE isRead = 0 AND createdAt > ? ORDER BY createdAt DESC LIMIT 50`
      )
      .all(since) as NotificationRow[];
  }
  return db
    .query(
      `SELECT * FROM Notification WHERE isRead = 0 ORDER BY createdAt DESC LIMIT 50`
    )
    .all() as NotificationRow[];
}

function getUnreadCount(userId?: string): number {
  if (userId) {
    const row = db
      .query(
        `SELECT COUNT(*) as cnt FROM Notification WHERE isRead = 0 AND (userId = ? OR userId IS NULL)`
      )
      .get(userId) as { cnt: number };
    return row?.cnt ?? 0;
  }
  const row = db
    .query(`SELECT COUNT(*) as cnt FROM Notification WHERE isRead = 0`)
    .get() as { cnt: number };
  return row?.cnt ?? 0;
}

function markNotificationRead(notificationId: string): boolean {
  try {
    db.query(`UPDATE Notification SET isRead = 1 WHERE id = ?`).run(
      notificationId
    );
    return true;
  } catch {
    return false;
  }
}

function markAllRead(userId?: string): number {
  try {
    if (userId) {
      const result = db
        .query(
          `UPDATE Notification SET isRead = 1 WHERE isRead = 0 AND (userId = ? OR userId IS NULL)`
        )
        .run(userId);
      return result.changes;
    }
    const result = db
      .query(`UPDATE Notification SET isRead = 1 WHERE isRead = 0`)
      .run();
    return result.changes;
  } catch {
    return 0;
  }
}

function getRecentNotifications(limit = 20): NotificationRow[] {
  return db
    .query(
      `SELECT * FROM Notification ORDER BY createdAt DESC LIMIT ?`
    )
    .all(limit) as NotificationRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Socket.io event handlers
// ─────────────────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  connectedClients.set(socket.id, {
    socketId: socket.id,
    connectedAt: new Date(),
  });

  // Send current unread count on connect
  socket.emit("notification:count", { unread: getUnreadCount() });

  // Send recent notifications on connect
  const recent = getRecentNotifications(10).map(formatNotification);
  socket.emit("notification:recent", { notifications: recent });

  // ── Client identifies with a userId ──────────────────────────────────
  socket.on("auth", (data: { userId: string }) => {
    const client = connectedClients.get(socket.id);
    if (client) {
      client.userId = data.userId;
      console.log(`[WS] Client ${socket.id} authenticated as ${data.userId}`);
      // Re-send count and notifications for this user
      const unread = getUnreadCount(data.userId);
      socket.emit("notification:count", { unread });
    }
  });

  // ── Mark single notification as read ─────────────────────────────────
  socket.on("notification:mark_read", (data: { id: string }) => {
    console.log(`[WS] Mark read request: ${data.id} from ${socket.id}`);
    const success = markNotificationRead(data.id);
    socket.emit("notification:mark_read:ack", {
      id: data.id,
      success,
    });
    if (success) {
      // Broadcast updated count to all clients
      const client = connectedClients.get(socket.id);
      const unread = getUnreadCount(client?.userId);
      io.emit("notification:count", { unread });
    }
  });

  // ── Mark all notifications as read ───────────────────────────────────
  socket.on("notification:mark_all_read", () => {
    console.log(`[WS] Mark all read request from ${socket.id}`);
    const client = connectedClients.get(socket.id);
    const count = markAllRead(client?.userId);
    socket.emit("notification:mark_all_read:ack", { marked: count });
    // Broadcast updated count
    const unread = getUnreadCount(client?.userId);
    io.emit("notification:count", { unread });
  });

  // ── Request fresh notification list ──────────────────────────────────
  socket.on("notification:refresh", () => {
    const since = clientLastSeen.get(socket.id);
    const notifs = getUnreadNotifications(since).map(formatNotification);
    socket.emit("notification:updates", { notifications: notifs });
  });

  // ── Disconnect ───────────────────────────────────────────────────────
  socket.on("disconnect", (reason) => {
    console.log(`[WS] Client disconnected: ${socket.id} (${reason})`);
    connectedClients.delete(socket.id);
    clientLastSeen.delete(socket.id);
  });

  socket.on("error", (error) => {
    console.error(`[WS] Socket error (${socket.id}):`, error);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Format notification for client
// ─────────────────────────────────────────────────────────────────────────────
function formatNotification(row: NotificationRow) {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    message: row.message,
    severity: row.severity,
    isRead: row.isRead === 1,
    actionUrl: row.actionUrl,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Periodic notification poller (every 5 seconds)
// ─────────────────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 5000;
let lastPollTime = new Date().toISOString();

function pollForNewNotifications() {
  try {
    const newNotifs = getUnreadNotifications(lastPollTime);

    if (newNotifs.length > 0) {
      const formatted = newNotifs.map(formatNotification);
      // Push to all connected clients
      io.emit("notification:new", { notifications: formatted });

      // Update last poll time to the most recent notification
      const newest = newNotifs[0];
      if (newest) {
        lastPollTime = newest.createdAt;
      }

      console.log(
        `[POLL] Pushed ${newNotifs.length} new notification(s) to ${connectedClients.size} client(s)`
      );
    }

    // Also push updated counts
    const unread = getUnreadCount();
    io.emit("notification:count", { unread });
  } catch (err) {
    console.error("[POLL] Error polling notifications:", err);
  }
}

const poller = setInterval(pollForNewNotifications, POLL_INTERVAL_MS);
console.log(`[POLL] Notification poller started (every ${POLL_INTERVAL_MS}ms)`);

// ─────────────────────────────────────────────────────────────────────────────
// Broadcast system events helper (can be called externally or internally)
// ─────────────────────────────────────────────────────────────────────────────
function broadcastSystemEvent(event: SystemEvent) {
  console.log(`[EVENT] Broadcasting: ${event.type} — ${event.title}`);
  io.emit("system:event", event);
}

// Simulate a periodic system heartbeat event
const heartbeatInterval = setInterval(() => {
  const clientCount = connectedClients.size;
  broadcastSystemEvent({
    type: "system",
    title: "System Heartbeat",
    message: `Notification service alive. ${clientCount} client(s) connected.`,
    severity: "info",
    timestamp: new Date().toISOString(),
  });
}, 60000);

// ─────────────────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(
    `[SERVER] BABIRYE Notification Service running on port ${PORT}`
  );
  console.log(`[SERVER] Health check: http://localhost:${PORT}/`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────────────────────────────────────
function gracefulShutdown(signal: string) {
  console.log(`\n[SERVER] Received ${signal}, shutting down...`);
  clearInterval(poller);
  clearInterval(heartbeatInterval);
  io.disconnectSockets(true);
  httpServer.close(() => {
    console.log("[SERVER] HTTP server closed");
    db.close();
    console.log("[DB] Database connection closed");
    process.exit(0);
  });

  // Force exit after 5 seconds
  setTimeout(() => {
    console.error("[SERVER] Forced exit after timeout");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error("[SERVER] Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[SERVER] Unhandled rejection:", reason);
});