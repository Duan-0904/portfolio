import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "段韬 · 产品实习生",
  description:
    "从学术研究到产品实践：将调研方法论转化为 2000+ 中小融媒的增长飞轮，用 AI 语义理解重构求职匹配体验",
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
