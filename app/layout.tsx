import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Social Manager — GoldenSea Studios",
  description: "Tự động tạo content và đăng bài mạng xã hội bằng AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body style={{ backgroundColor: "#F0F2F5" }}>{children}</body>
    </html>
  );
}
