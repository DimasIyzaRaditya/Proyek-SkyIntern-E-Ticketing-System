import { Server as HttpServer } from "http"
import jwt from "jsonwebtoken"
import { Server, Socket } from "socket.io"

let io: Server | null = null

const getTokenFromSocket = (socket: Socket) => {
  const authToken = socket.handshake.auth?.token
  if (typeof authToken === "string" && authToken.trim()) return authToken

  const bearer = socket.handshake.headers.authorization
  if (typeof bearer === "string" && bearer.startsWith("Bearer ")) {
    return bearer.substring(7)
  }

  return ""
}

export const initSocketServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  })

  io.use((socket, next) => {
    try {
      const token = getTokenFromSocket(socket)
      if (!token) return next(new Error("Unauthorized: token missing"))

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: number
        email: string
        role: string
      }

      socket.data.user = {
        id: Number(decoded.id),
        email: decoded.email,
        role: decoded.role
      }

      return next()
    } catch {
      return next(new Error("Unauthorized: invalid token"))
    }
  })

  io.on("connection", (socket) => {
    const userId = socket.data?.user?.id
    if (userId) {
      socket.join(`user:${userId}`)
    }

    socket.emit("server:ping", {
      ok: true,
      message: "WebSocket connected",
      at: new Date().toISOString()
    })

    socket.on("client:ping", () => {
      socket.emit("server:ping", {
        ok: true,
        message: "pong",
        at: new Date().toISOString()
      })
    })
  })

  return io
}

export const emitToUser = (userId: number, event: string, payload: unknown) => {
  io?.to(`user:${userId}`).emit(event, payload)
}

export const emitBroadcast = (event: string, payload: unknown) => {
  io?.emit(event, payload)
}
