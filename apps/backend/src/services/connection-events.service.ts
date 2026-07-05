/**
 * connection-events.service.ts
 * SSE bus for real-time mobile connection events.
 * Admin dashboard subscribes via GET /api/admin/logs/stream
 */
import type { Response } from "express";

export interface ConnectionEvent {
  id:        string;
  timestamp: string;
  event:     "CONNECT" | "DISCONNECT" | "ERROR" | "RECONNECT" | "TIMEOUT";
  username:  string;
  userId:    string;
  protocol?: string;
  server?:   string;
  duration?: number;
  rxBytes?:  number;
  txBytes?:  number;
  ping?:     number;
  errorMsg?: string;
  ipAddress?: string;
}

class ConnectionEventBus {
  private clients: Map<string, Response> = new Map();
  private history: ConnectionEvent[] = [];
  private readonly MAX_HISTORY = 200;

  subscribe(clientId: string, res: Response): void {
    res.setHeader("Content-Type",  "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection",    "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Send last 50 events on connect
    const replay = this.history.slice(-50);
    res.write(`event: replay\ndata: ${JSON.stringify(replay)}\n\n`);

    // Heartbeat every 25 s to keep connection alive
    const hb = setInterval(() => res.write(": heartbeat\n\n"), 25_000);

    this.clients.set(clientId, res);

    res.on("close", () => {
      clearInterval(hb);
      this.clients.delete(clientId);
    });
  }

  emit(event: ConnectionEvent): void {
    this.history.push(event);
    if (this.history.length > this.MAX_HISTORY) this.history.shift();

    const payload = `event: connection\ndata: ${JSON.stringify(event)}\n\n`;
    for (const [, res] of this.clients) {
      res.write(payload);
    }
  }

  getHistory(limit = 50): ConnectionEvent[] {
    return this.history.slice(-limit);
  }
}

export const connectionEventBus = new ConnectionEventBus();
