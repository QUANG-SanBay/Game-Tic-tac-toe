import { io } from "socket.io-client";

const url = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
export default io(url, { autoConnect: true });
