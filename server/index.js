import http from "http";
import dotenv from "dotenv";
import app from "./src/app.js";
import setupSocket from "./src/config/socket.js";

dotenv.config();

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

setupSocket(server);

server.listen(PORT, () => {
  console.log(`[INFO] HTTP + Socket.IO server listening on port ${PORT}`);
});
