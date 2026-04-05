import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";
import {
  createSession,
  addUser,
  removeUser,
  endSession,
  changeLanguage,
  getUserCount,
} from "./session.js";
import type { ClientMessage, ServerMessage } from "./types.js";
import { verifyToken } from "./firebase.js";

export default class CollaborationServer implements Party.Server {
  private session = createSession();
  // Map connectionId → verified uid from JWT (set in onConnect)
  private verifiedUsers = new Map<string, string>();

  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const token = new URL(ctx.request.url).searchParams.get("token");
    if (!token) {
      conn.close(4003, "Missing token");
      return;
    }
    const user = await verifyToken(token);
    if (!user) {
      conn.close(4003, "Unauthorized");
      return;
    }

    // Store the verified uid so we can validate join messages
    this.verifiedUsers.set(conn.id, user.uid);

    // y-partykit handles Yjs document sync
    return onConnect(conn, this.room, {});
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      // Not JSON — likely Yjs binary sync message, ignore
      return;
    }

    switch (msg.type) {
      case "join": {
        if (!msg.userId || !msg.username) {
          this.send(sender, { type: "error", code: "JOIN_FAILED", message: "userId and username are required" });
          sender.close(4001, "Missing userId or username");
          return;
        }
        // Verify the claimed userId matches the authenticated token
        const verifiedUid = this.verifiedUsers.get(sender.id);
        if (verifiedUid && verifiedUid !== msg.userId) {
          this.send(sender, { type: "error", code: "JOIN_FAILED", message: "userId does not match authenticated token" });
          sender.close(4001, "Identity mismatch");
          return;
        }
        const result = addUser(this.session, sender.id, msg.userId, msg.username);
        if (!result.ok) {
          this.send(sender, { type: "error", code: "JOIN_FAILED", message: result.error });
          sender.close(4001, result.error);
          return;
        }
        // Close the old connection if the same user rejoined (e.g., browser refresh)
        if (result.replacedConnId) {
          for (const conn of this.room.getConnections()) {
            if (conn.id === result.replacedConnId) {
              conn.close(1000, "Replaced by new connection");
              break;
            }
          }
        }
        const count = getUserCount(this.session);
        // Notify everyone (including the joiner)
        this.broadcastAll({ type: "user-joined", userId: msg.userId, username: msg.username, userCount: count });
        // Sync current language to the new joiner if it differs from the default
        if (this.session.language !== "python3") {
          this.send(sender, { type: "language-changed", language: this.session.language, changedBy: "system" });
        }
        break;
      }

      case "end-session": {
        const user = this.session.users.get(sender.id);
        endSession(this.session);
        this.broadcastAll({ type: "session-ended", endedBy: user?.username || "unknown" });
        // TODO: PLACEHOLDER — Implement explicit resource cleanup (persist session data, analytics)
        // Close all connections after brief delay for message delivery
        setTimeout(() => {
          for (const conn of this.room.getConnections()) {
            conn.close(1000, "Session ended");
          }
        }, 500);
        break;
      }

      case "language-change": {
        if (changeLanguage(this.session, msg.language)) {
          const user = this.session.users.get(sender.id);
          this.broadcastAll({
            type: "language-changed",
            language: msg.language,
            changedBy: user?.username || "unknown",
          });
        }
        break;
      }
    }
  }

  onClose(conn: Party.Connection) {
    this.verifiedUsers.delete(conn.id);
    const removed = removeUser(this.session, conn.id);
    if (removed) {
      // TODO: PLACEHOLDER — Add reconnection grace period before broadcasting user-disconnected
      this.broadcastAll({
        type: "user-disconnected",
        userId: removed.userId,
        username: removed.username,
      });
    }
  }

  private send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  private broadcastAll(msg: ServerMessage) {
    const data = JSON.stringify(msg);
    for (const conn of this.room.getConnections()) {
      conn.send(data);
    }
  }
}

CollaborationServer satisfies Party.Worker;
