import { io } from "socket.io-client";

const socket = io("http://localhost:3001"); // đổi port nếu backend khác
export default socket;
