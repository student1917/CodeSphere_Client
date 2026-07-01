# CodeSphere Client

CodeSphere Client là giao diện web của một nền tảng luyện lập trình, thi contest và thảo luận cộng đồng. Ứng dụng được xây dựng bằng React + TypeScript + Vite, hỗ trợ đăng nhập, quản lý bài toán, contest, bài viết thảo luận, tin nhắn, thông báo và khu vực admin.

## Tính năng chính

- Luyện tập bài toán theo mức độ, chủ đề và trạng thái làm bài.
- Xem chi tiết bài toán, nộp bài và theo dõi lịch sử submission.
- Tham gia contest public/private, contest practice và contest official.
- Thảo luận, đăng bài, bình luận, follow người dùng và lọc bài viết theo tag.
- Nhắn tin thời gian thực, nhận thông báo và xem bảng xếp hạng.
- Khu vực admin để quản lý languages, categories, tags, problems, testcases, users, posts, contests và audit logs.

## Công nghệ

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios
- React Hook Form + Zod
- STOMP / SockJS cho realtime
- Monaco Editor, TipTap, Markdown editor

## Yêu cầu môi trường

- Node.js 18+ hoặc mới hơn
- npm
- Backend API đang chạy

## Cài đặt và chạy

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev`: chạy ứng dụng ở chế độ development.
- `npm run build`: build production.
- `npm run lint`: kiểm tra lint.
- `npm run preview`: xem bản build local.

## Biến môi trường

Tạo file `.env` ở thư mục gốc nếu cần cấu hình riêng:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_OAUTH2_REDIRECT_URI=http://localhost:5173/oauth2/redirect
VITE_APP_NAME=CodeSphere
VITE_APP_VERSION=1.0.0
```

## Cấu trúc chính

- `src/apis`: các lớp gọi API.
- `src/components`: component dùng lại.
- `src/pages`: các trang chức năng.
- `src/routes`: cấu hình router và route protection.
- `src/context`: auth context.
- `src/services`: websocket/realtime.
- `src/types`: kiểu dữ liệu TypeScript.
- `src/utils`: hằng số, storage, format.
