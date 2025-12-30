# Tic Tac Toe Backend 
📌 Mô tả
Đây là phần Backend Game Logic của trò chơi Tic-Tac-Toe 3x3, được xây dựng bằng Node.js + Express + Socket.IO.
Server chịu trách nhiệm xử lý toàn bộ logic trò chơi và đồng bộ dữ liệu giữa các client theo thời gian thực.

🧱 Kiến trúc tổng thể
Client (Browser / React)
        │
        │ Socket.IO
        ▼
Node.js Server (Express + Socket.IO)
        │
        ├── Quản lý phòng chơi (Room)
        ├── Quản lý lượt đánh X / O
        ├── Kiểm tra thắng / hòa
        └── Đồng bộ trạng thái game

⚙️ Công nghệ sử dụng

Node.js (ES Module)
Express
Socket.IO
CORS

🚀 Cách chạy server
1️⃣ Cài đặt thư viện
npm install
2️⃣ Chạy server
npm start
Server sẽ chạy tại:
http://localhost:3000