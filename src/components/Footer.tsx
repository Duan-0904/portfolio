import { footerData } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="border-t border-[#e5e5e5]">
      <div className="mx-auto max-w-content px-4 py-14 sm:px-0">
        <h2 className="text-[28px] leading-tight tracking-tight sm:text-[1.75rem]">
          联系方式
        </h2>

        <div className="mt-8 space-y-3 text-[17px] leading-relaxed text-text-secondary">
          <p>
            邮箱：{" "}
            <a href={`mailto:${footerData.email}`}>{footerData.email}</a>
          </p>
          <p>
            GitHub：{" "}
            <a
              href={`https://${footerData.github}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {footerData.github}
            </a>
          </p>
        </div>

        <p className="mt-14 text-[14px] text-text-tertiary">
          {footerData.copyright}
        </p>
      </div>
    </footer>
  );
}
