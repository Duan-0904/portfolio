import type { projects, StructuredDataItem } from "@/lib/data";

type Project = (typeof projects)[number];

// ============================================================
// 结构化数据子组件
// ============================================================

function StructuredBlock({ data }: { data: StructuredDataItem[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="mt-14 space-y-14">
      {data.map((item, idx) => {
        if (item.type === "table") {
          return (
            <div key={idx}>
              {item.title && (
                <p className="mb-4 text-[14px] text-text-tertiary">{item.title}</p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-[14px] leading-relaxed border-collapse">
                  <thead>
                    <tr className="border-b border-[#d5d5d5]">
                      {item.headers.map((h, i) => (
                        <th
                          key={i}
                          className={`py-2 pr-4 text-left font-normal ${
                            i === 0 ? "text-text-secondary" : "text-text"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {item.rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-[#e5e5e5]">
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={`py-2 pr-4 ${
                              ci === 0 ? "text-text-secondary" : "text-text"
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        if (item.type === "concentric") {
          return (
            <div key={idx}>
              {item.title && (
                <p className="mb-5 text-[14px] text-text-tertiary">{item.title}</p>
              )}
              <div className="space-y-0">
                {item.layers.map((layer, li) => (
                  <div
                    key={li}
                    className="border border-[#d5d5d5] px-5 py-4"
                    style={{
                      marginLeft: `${li * 24}px`,
                      marginRight: `${(item.layers.length - 1 - li) * 24}px`,
                    }}
                  >
                    <span className="text-[14px] text-text-secondary">
                      {layer.label}
                    </span>
                    <p className="mt-1 text-[14px] leading-relaxed text-text">
                      {layer.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

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

        {/* 结构化数据（表格/结构图，替代文档截图） */}
        {"structuredData" in project && project.structuredData && (
          <StructuredBlock data={project.structuredData} />
        )}

        {/* 辅助产品截图（仅简程等有产品截图的项���使用） */}
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

        {/* PDF 下载链接 */}
        <p className="mt-10">
          <a
            href={
              project.id === "zhongxiaorongmei"
                ? "/pdf/中小融媒内容运营体系.pdf"
                : "/pdf/简程AI.pdf"
            }
            className="inline-flex items-center gap-1 text-[15px] text-text-secondary hover:text-text transition-colors duration-150"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看完整文档（PDF）→
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
