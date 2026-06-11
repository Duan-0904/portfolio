import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "段韬 · 产品实习生",
  description:
    "数据驱动、有产品思维的实践者 — 为 2000+ 中小融媒设计增长飞轮，用 AI 重构求职匹配体验",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
