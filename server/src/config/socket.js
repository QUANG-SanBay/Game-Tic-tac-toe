import { Server } from "socket.io";
import { gameController } from "../controllers/gameController.js";

export default function setupSocket(server) {
  const io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);
    
    // Đăng ký tất cả sự kiện game cho Controller xử lý
    gameController(io, socket);

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
}