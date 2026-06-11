"use client";

import { useState, useEffect } from "react";
import { navbarData } from "@/lib/data";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Hero 区块高度约 100vh，滚动超过 80% 视口高度后切换
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    };
    handleScroll(); // 初始检查
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-none ${
        scrolled
          ? "bg-[#fafafa] border-b border-[#e5e5e5]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4 sm:px-0">
        {/* 品牌名 / 姓名 */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-[17px] leading-none text-text hover:text-text-secondary transition-colors duration-150"
        >
          {navbarData.brandName}
        </button>

        {/* 导航链接 */}
        <div className="flex gap-6">
          {navbarData.links.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-[14px] text-text-secondary hover:text-text transition-colors duration-150"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
