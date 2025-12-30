import http from "http";
import 'dotenv/config';
import app from './src/app.js';
import setupSocket from "./src/socket.js";

console.log("APP =", app);
//const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
setupSocket(server);

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});