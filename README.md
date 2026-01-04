🎮 Game Tic-Tac-Toe 3x3 (Realtime Multiplayer)
1. Tổng quan về game
Game Tic-Tac-Toe 3x3 là trò chơi cờ caro đơn giản dành cho 2 người chơi, được xây dựng theo mô hình client–server và hoạt động theo thời gian thực (realtime).

-Mỗi người chơi sẽ lần lượt đánh ký hiệu X hoặc O lên bàn cờ 3x3
-Người chơi thắng khi có 3 ký hiệu giống nhau liên tiếp theo hàng, cột hoặc đường chéo
-Nếu toàn bộ bàn cờ được đánh mà không có người thắng, game sẽ kết thúc với kết quả hòa

Game được xây dựng nhằm mục đích học tập, thực hành:
-Lập trình mạng
-Xử lý realtime với Socket.IO
-Phân tách frontend – backend

2. Công nghệ sử dụng
🔹 Backend
-NodeJS
-ExpressJS
-Socket.IO

🔹 Frontend
-ReactJS
-Socket.IO Client

🔹 Giao tiếp
-Realtime communication thông qua WebSocket (Socket.IO)
-Dữ liệu trao đổi ở dạng JSON

3. Cách chạy server (Backend)
-Bước 1: Di chuyển vào thư mục server
bash
cd server

-Bước 2: Cài đặt các thư viện cần thiết
bash
npm install

-Bước 3: Chạy server
bash
node index.js

Hoặc (nếu có cài nodemon):
bash
nodemon index.js

📌 Sau khi chạy thành công, server sẽ lắng nghe kết nối từ client.

4. Cách chạy client (Frontend)
Bước 1: Di chuyển vào thư mục client
bash
cd client

Bước 2: Cài đặt thư viện
bash
npm install

Bước 3: Chạy client
bash
npm start

📌 Trình duyệt sẽ tự động mở tại địa chỉ:
arduino
http://localhost:3000

5. Cổng (Port) sử dụng
Thành phần	Cổng
Backend (Server)	3001
Frontend (Client)	3000

📌 Client kết nối tới server thông qua Socket.IO tại:
arduino
http://localhost:3001

6. Các tính năng của game
-Kết nối realtime giữa 2 người chơi
-Tạo và tham gia phòng chơi (room)
-Hiển thị bàn cờ 3x3
-Đánh X / O theo lượt
-Không cho đánh sai lượt
-Không cho đánh vào ô đã được đánh
-Kiểm tra thắng / thua / hòa
-Đồng bộ trạng thái game giữa 2 client
-Xử lý player thoát giữa chừng

7. Cách chơi
-Nhấp chuột vào bất kỳ ô trống nào để đánh dấu (X hoặc O).
-Người chơi luân phiên nhau chơi.
-Trò chơi tự động phát hiện thắng hoặc hòa.
-Nhấp vào "Khởi động lại" để chơi lại.

8. Tổng quan logic game
🔹 Luồng hoạt động chính
-Client kết nối tới server
-Người chơi join vào một room
-Khi room đủ 2 người → game bắt đầu
-Server gán:
  + Player 1: X
  + Player 2: O
-Người chơi đánh theo lượt
-Server:
-Cập nhật bàn cờ
-Kiểm tra điều kiện thắng hoặc hòa
-Gửi trạng thái game về client
-Game kết thúc khi có người thắng hoặc hòa

🔹 Logic kiểm tra thắng
Server kiểm tra:
- 3 hàng ngang
- 3 hàng dọc
- 2 đường chéo
Nếu có 3 ô liên tiếp giống nhau → người chơi đó thắng.

9. Thử nghiệm
✅ Xác thực điều kiện thắng cho mọi hướng
✅ Xử lý tốt các trường hợp ngoại lệ như thắng sớm và hòa toàn bộ bàn cờ.
✅ Đảm bảo khởi động lại sẽ khôi phục tất cả trạng thái một cách sạch sẽ

10. Ghi chú
-Game yêu cầu 2 người chơi để bắt đầu
-Nếu 1 player thoát giữa chừng, game sẽ tự động kết thúc
-Dự án phục vụ mục đích học tập và demo

**Cấu trúc thư mục**
```
README.md
client/
  eslint.config.js
  index.html
  package.json
  README.md
  vite.config.js
  public/
  src/
    App.css
    App.jsx
    index.css
    main.jsx
    assets/

server/
  index.js
  package.json
  src/
    app.js
```
