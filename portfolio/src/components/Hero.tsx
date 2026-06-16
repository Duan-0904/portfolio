import { heroData } from "@/lib/data";

export default function Hero() {
  return (
    <section className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-content text-center">
        {/* 姓名 */}
        <h1 className="text-[48px] leading-tight tracking-tight sm:text-[3rem]">
          {heroData.name}
        </h1>

        {/* 职位方向 */}
        <p className="mt-6 text-[17px] text-text-secondary">
          {heroData.title}
        </p>

        {/* 一句话定位 */}
        <p className="mx-auto mt-8 max-w-[480px] text-[17px] leading-relaxed text-text-secondary">
          {heroData.description}
        </p>

        {/* 向下提示 */}
        <p className="mt-20 text-[14px] text-text-tertiary">
          项目 ↓
        </p>
      </div>
    </section>
  );
}
