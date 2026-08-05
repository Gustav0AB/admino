import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "@config/env";
import { JwtPayload } from "@/types";

export type SocketEvent =
  | "notification:received"
  | "plan:updated"
  | "plan:assigned"
  | "member:joined"
  | "member:left"
  | "client:updated";

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: [env.cors.webOrigin, env.cors.mobileOrigin],
      credentials: true,
    },
  });

  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Missing token"));
      return;
    }

    try {
      const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as JwtPayload;

    socket.join(`user:${user.sub}`);

    if (user.orgId) {
      socket.join(`org:${user.orgId}`);
    }

    socket.on("disconnect", () => {
      socket.leave(`user:${user.sub}`);
      if (user.orgId) socket.leave(`org:${user.orgId}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function emitToOrg(orgId: string, event: SocketEvent, data: unknown): void {
  getIO().to(`org:${orgId}`).emit(event, data);
}

export function emitToUser(userId: string, event: SocketEvent, data: unknown): void {
  getIO().to(`user:${userId}`).emit(event, data);
}

export function emitToAll(event: SocketEvent, data: unknown): void {
  getIO().emit(event, data);
}
