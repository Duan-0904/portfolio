"use client";

import { useState, useEffect, useRef } from "react";
import { navbarData } from "@/lib/data";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Hero 区块高度约 100vh，滚动超过 80% 视口高度后切换
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    };
    handleScroll(); // 初始检查
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer：检测当前可见的项目区块
  useEffect(() => {
    const ids = navbarData.links.map((l) => l.id);
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 找到当前最接近视口顶部的可见区块
        let closest: { id: string; top: number } | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const top = entry.boundingClientRect.top;
            if (!closest || top < closest.top) {
              closest = { id: entry.target.id, top };
            }
          }
        }
        if (closest) {
          setActiveId(closest.id);
        }
      },
      {
        // 当区块顶部进入视口上半部分时触发
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
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
          {navbarData.links.map((link) => {
            const isActive = activeId === link.id;
            return (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`text-[14px] transition-colors duration-150 ${
                  isActive
                    ? "text-text"
                    : "text-text-secondary hover:text-text"
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
