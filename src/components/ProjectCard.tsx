import type { projects } from "@/lib/data";

type Project = (typeof projects)[number];

// ============================================================
// ProjectCard 主组件
// ============================================================

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <section id={project.id}>
      {/* ========== 速览版（默认可见） ========== */}
      <div>
        {/* 项目标题 */}
        <h2 className="text-[32px] font-semibold leading-tight tracking-tight sm:text-[2rem]">
          {project.title}
        </h2>

        {/* 一句话定位 */}
        <p className="mt-4 max-w-[640px] text-[17px] leading-relaxed text-text-secondary">
          {project.subtitle}
        </p>

        {/* 核心架构图 / 截图 */}
        <div className="mt-10">
          <img
            src={project.image}
            alt={project.imageAlt}
            className="w-full rounded-sm border border-[#e5e5e5] bg-[#f0f0f0]"
            loading="lazy"
          />
        </div>

        {/* 关键指标 / 亮点 */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {project.keyMetrics.map((m) => (
            <div key={m.label}>
              <p className="text-[14px] text-text-tertiary">{m.label}</p>
              <p className="mt-1 text-[16px] leading-relaxed text-text">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* 辅助产品截图（仅简程等有产品截图的项目使用） */}
        {project.keyDataImages && project.keyDataImages.length > 0 && (
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {project.keyDataImages.map((img) => (
              <figure key={img.src}>
                <div className="overflow-hidden rounded-sm border border-[#e5e5e5] bg-[#f0f0f0]">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="mt-2 text-[13px] text-text-tertiary leading-relaxed">
                  {img.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {/* 完整文档链接 */}
        <p className="mt-10">
          <a
            href={
              project.id === "zhongxiaorongmei"
                ? "/pdf/中小融媒内容运营体系.html"
                : "/pdf/简程AI.html"
            }
            className="inline-flex items-center gap-1 text-[15px] text-text-secondary hover:text-text transition-colors duration-150"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看完整文档 →
          </a>
        </p>
      </div>

      {/* ========== 折叠详情 ========== */}
      <details className="mt-10 group border-t border-[#e5e5e5] pt-8">
        <summary className="text-[17px] text-text-secondary hover:text-text transition-colors duration-150 select-none">
          展开项目详情 ▾
        </summary>

        <div className="mt-8 space-y-14">
          {project.details.map((section) => (
            <div key={section.heading}>
              <h3 className="text-[22px] leading-snug text-text">
                {section.heading}
              </h3>
              <p className="mt-3 text-[17px] leading-relaxed text-text-secondary">
                {section.content}
              </p>
              {section.highlights && section.highlights.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {section.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="text-[15px] leading-relaxed text-text-secondary before:mr-2 before:text-text-tertiary before:content-['—']"
                    >
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
