// ============================================================
// PDF 生成脚本 v2
// - ASCII 表格 → 自动解析为 HTML <table>
// - 图片引用 → 嵌入 public/images/ 中的真实图片
// - ASCII 框图 → 转 CSS 信息卡片
// - 其余 → 保留 <pre> 兜底
// 用法: node scripts/generate-pdfs.mjs
// ============================================================

import puppeteer from "puppeteer";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const pdfDir = resolve(rootDir, "public", "pdf");
const imagesDir = resolve(rootDir, "public", "images");
const txtDir = resolve(rootDir, "..");

if (!existsSync(pdfDir)) mkdirSync(pdfDir, { recursive: true });

// ============================================================
// 图片映射：文件名 → 说明
// ============================================================
const IMAGE_FILES = {
  t1: { file: "t1.png", desc: "资源对比表格：中小融媒 vs 头部融媒" },
  t2: { file: "t2.png", desc: "竞品三层圈分析" },
  t3: { file: "t3.png", desc: "天津四区融媒横向对比" },
  t4: { file: "t4.PNG", desc: "三层飞轮模型架构图" },
  p1: { file: "p1.PNG", desc: "简程 AI 产品首页截图" },
  p2: { file: "p2.PNG", desc: "简程 AI 产品界面" },
  p3: { file: "p3.PNG", desc: "简程 AI 界面展示" },
  p4: { file: "p4.PNG", desc: "匹配结果页面" },
  p5: { file: "p5.PNG", desc: "改写建议页面" },
  p6: { file: "p6.PNG", desc: "简程 AI 其他展示" },
};

function imagePath(key) {
  const info = IMAGE_FILES[key];
  if (!info) return null;
  const p = resolve(imagesDir, info.file);
  // Puppeteer 需要 file:/// 协议
  return existsSync(p) ? `file:///${p.replace(/\\/g, "/")}` : null;
}

// ============================================================
// 预处理：扫描图片指令，建立占位符 → 图片映射
// ============================================================
function preprocessImages(lines) {
  // 找到所有 "（用替换...）" / "（替换用...）" 行及其前面的 [📷] 行
  const imageMap = []; // [{ lineIdx, images: ['p1','p2'] }]
  const photoLines = []; // [{ lineIdx, desc }]

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();

    // 记录 [📷 ...] 占位符
    if (t.startsWith("[📷") && t.includes("]")) {
      const desc = t.replace(/\[📷[^\]]*\]/, "").trim();
      photoLines.push({ lineIdx: i, desc });
    }

    // 处理替换指令
    const replaceMatch = t.match(/[（(]用替换[^)）]*[）)]|[（(]替换用[^)）]*[）)]/);
    if (replaceMatch) {
      // 提取图片编号
      const imgRefs = [];
      const refStr = replaceMatch[0];
      for (const key of Object.keys(IMAGE_FILES)) {
        if (refStr.includes(key)) imgRefs.push(key);
      }

      if (imgRefs.length > 0) {
        // 找到这条指令前面的 [📷] 行
        const precedingPhotos = photoLines.filter((p) => {
          // 在同一条指令之前、且之间没有其他指令
          return p.lineIdx < i;
        });

        if (precedingPhotos.length > 0) {
          // 从最近的开始配对
          const toPair = Math.min(imgRefs.length, precedingPhotos.length);
          for (let j = 0; j < toPair; j++) {
            const photo = precedingPhotos[precedingPhotos.length - toPair + j];
            imageMap.push({ lineIdx: photo.lineIdx, images: [imgRefs[j]], desc: photo.desc });
          }
          // 移除已配对的
          precedingPhotos.splice(precedingPhotos.length - toPair, toPair);
        } else {
          // 没有 [📷] 占位符，创建独立图片条目
          imageMap.push({ lineIdx: i, images: imgRefs, desc: "" });
        }
      }
    }
  }

  return imageMap;
}

// ============================================================
// 块分类
// ============================================================

function isHeading(line) {
  const t = line.trim();
  return /^#{1,3}\s/.test(t) || /^【模块\d+】/.test(t);
}

function isDivider(line) {
  const t = line.trim();
  return /^[=]{3,}$/.test(t) || /^[-]{3,}$/.test(t);
}

function isTableRow(line) {
  // 一行中有至少 2 个 │ 分隔符
  return (line.match(/│/g) || []).length >= 2;
}

function isTableSeparator(line) {
  // 表格分隔行：主要由 ─ ┼ 组成
  return /^[\s]*[│├┼┤─┴┬]+[│├┼┤─┴┬\s]*$/.test(line.trim()) &&
    (line.includes("─") || line.includes("┼")) &&
    (line.match(/│/g) || []).length >= 1;
}

function isBoxDrawing(line) {
  // 包含框图字符但不是表格行
  const t = line.trim();
  return /[┌┐└┘├┤╭╮╰╯★☆●○◆◇■□]/.test(t) && !isTableRow(line);
}

function isBullet(line) {
  return /^\s*[-·•]\s/.test(line.trim());
}

function isNumbered(line) {
  return /^\s*\d+[.)]\s/.test(line.trim());
}

// ============================================================
// HTML 转义
// ============================================================
function esc(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ============================================================
// 内联 Markdown 处理
// ============================================================
function inlineMarkdown(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

// ============================================================
// 块级解析器
// ============================================================

function parseTableBlock(blockLines) {
  // 过滤掉分隔行，保留数据行
  const dataRows = blockLines.filter((l) => !isTableSeparator(l) && isTableRow(l));
  if (dataRows.length === 0) return null;

  const rows = dataRows.map((line) => {
    // 按 │ 分割，去首尾空格
    return line.split("│").map((c) => c.trim()).filter((c, i, arr) => {
      // 去掉首尾可能的空列（由表格边框 │ 产生）
      if (i === 0 && c === "" && arr.length > 2) return false;
      if (i === arr.length - 1 && c === "" && arr.length > 2) return false;
      return true;
    });
  }).filter((r) => r.length >= 2);

  if (rows.length === 0) return null;

  // 判断第一行是否为表头（如果后面跟着一个分隔行）
  const firstIsHeader = blockLines.length >= 2 && isTableSeparator(blockLines[1]);

  let html = '<table class="data-table">\n';
  let startIdx = 0;

  if (firstIsHeader && rows.length >= 1) {
    html += "<thead>\n<tr>\n";
    for (const cell of rows[0]) {
      html += `<th>${inlineMarkdown(cell)}</th>\n`;
    }
    html += "</tr>\n</thead>\n<tbody>\n";
    startIdx = 1;
  } else {
    html += "<tbody>\n";
  }

  for (let i = startIdx; i < rows.length; i++) {
    html += "<tr>\n";
    for (const cell of rows[i]) {
      html += `<td>${inlineMarkdown(cell)}</td>\n`;
    }
    html += "</tr>\n";
  }

  html += "</tbody>\n</table>";
  return html;
}

function parseBoxBlock(blockLines) {
  // 提取框图中的纯文本内容，转为信息卡片
  const textContent = [];
  let title = "";

  for (const line of blockLines) {
    // 移除框图字符，提取文本
    const cleaned = line.replace(/[┌┐└┘├┤│─┬┴┼╭╮╰╯★☆●○◆◇■□▸▶→←↑↓↔⇒⇐]/g, "").trim();
    if (cleaned) {
      if (!title && (cleaned.includes("Persona") || cleaned.includes("：") || cleaned.includes(":"))) {
        // 第一个有意义的行作为标题
        title = cleaned;
      } else {
        textContent.push(cleaned);
      }
    }
  }

  if (!title && textContent.length === 0) return null;

  let html = '<div class="info-card">\n';
  if (title) {
    html += `<div class="info-card-title">${inlineMarkdown(title)}</div>\n`;
  }
  if (textContent.length > 0) {
    html += `<div class="info-card-body">${inlineMarkdown(textContent.join("<br>"))}</div>\n`;
  }
  html += "</div>";
  return html;
}

// ============================================================
// 主转换函数
// ============================================================

function txtToHtml(content, title) {
  const rawLines = content.split("\n");

  // 预处理图片指令
  const imageMap = preprocessImages(rawLines);
  const imageByLine = {};
  for (const entry of imageMap) {
    imageByLine[entry.lineIdx] = entry;
  }

  // 将内容按空行分块
  const blocks = [];
  let currentBlock = [];
  let currentBlockStart = 0;

  function flushBlock(endIdx) {
    if (currentBlock.length > 0) {
      // 检查这个块内是否有图片指令
      let hasImage = false;
      for (let i = currentBlockStart; i <= endIdx; i++) {
        if (imageByLine[i]) {
          hasImage = true;
          break;
        }
      }
      blocks.push({
        lines: currentBlock,
        startLine: currentBlockStart,
        hasImage,
      });
      currentBlock = [];
    }
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 跳过替换指令行本身
    if (/[（(]用替换|[（(]替换用/.test(trimmed)) continue;

    if (trimmed === "") {
      flushBlock(i);
      currentBlockStart = i + 1;
    } else {
      if (currentBlock.length === 0) currentBlockStart = i;
      currentBlock.push(line);
    }
  }
  flushBlock(rawLines.length - 1);

  // 辅助：获取块关联的图片
  function getBlockImages(block) {
    const imgs = [];
    // 图片指令行在块结束行之后、下一个块之前（被 skip 了）
    const searchEnd = block.startLine + block.lines.length + 2; // 留 2 行余量
    for (let i = block.startLine; i <= searchEnd; i++) {
      if (imageByLine[i]) {
        imgs.push(imageByLine[i]);
      }
    }
    return imgs;
  }

  // 辅助：输出图片 HTML
  function renderImages(images) {
    const parts = [];
    for (const img of images) {
      for (const key of img.images) {
        const src = imagePath(key);
        if (src) {
          const info = IMAGE_FILES[key];
          parts.push(
            `<figure class="doc-image">
              <img src="${src}" alt="${info.desc}" />
              <figcaption>${info.desc}</figcaption>
            </figure>`
          );
        }
      }
    }
    return parts;
  }

  // 按块类型转换
  const bodyParts = [];

  for (const block of blocks) {
    const firstLine = block.lines[0].trim();
    const allLines = block.lines.map((l) => l.trim());
    const embeddedImages = getBlockImages(block);

    // 跳过纯空块
    if (allLines.every((l) => l === "")) continue;

    // ===== 处理正文内容 =====
    let contentHtml = null;
    let skipImageMerge = false; // 如果图片已经在内容中处理，跳过末尾追加

    // 1. 标题
    if (isHeading(firstLine) && block.lines.length === 1) {
      const match = firstLine.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        contentHtml = `<h${match[1].length}>${match[2]}</h${match[1].length}>`;
      } else if (/^【模块\d+】/.test(firstLine)) {
        contentHtml = `<h2>${firstLine}</h2>`;
      } else {
        contentHtml = `<h3>${firstLine}</h3>`;
      }
    }

    // 2. 分隔线
    else if (isDivider(firstLine) && block.lines.length === 1) {
      contentHtml = "<hr>";
    }

    // 3. ASCII 框图 → 必须在表格检测之前。框图含 ┌┐└┘├┤ 字符，这些行的 │ 同时满足 isTableRow
    //    优先检查：只要块中有框图特有字符（┌┐└┘├┤╭╮╰╯等），就优先判为框图
    else if (block.lines.some((l) => /[┌┐└┘├┤╭╮╰╯]/.test(l.trim()))) {
      const cardHtml = parseBoxBlock(block.lines);
      if (cardHtml) {
        contentHtml = cardHtml;
      } else {
        // 无法解析的框图用 <pre> 保留原文
        contentHtml = `<pre>${block.lines.map((l) => esc(l)).join("\n")}</pre>`;
      }
    }

    // 4. 表格（纯 │ 分隔，无框图字符）
    else if (block.lines.filter((l) => isTableRow(l.trim()) || isTableSeparator(l.trim())).length >= block.lines.length * 0.8 && block.lines.filter((l) => isTableRow(l.trim()) || isTableSeparator(l.trim())).length >= 2) {
      contentHtml = parseTableBlock(block.lines);
    }

    // 5. 列表
    else if (allLines.every((l) => isBullet(l) || isNumbered(l)) && allLines.length >= 1) {
      const items = allLines.map((l) => {
        const text = l.replace(/^\s*[-·●•]\s*/, "").replace(/^\s*\d+[.)]\s*/, "");
        return `<li>${inlineMarkdown(text)}</li>`;
      });
      contentHtml = `<ul>\n${items.join("\n")}\n</ul>`;
    }

    // 6. 混合内容（含 [📷] 占位符的文本块）
    else if (allLines.some((l) => l.startsWith("[📷"))) {
      // 图片由 getBlockImages 处理，这里只输出文本
      const textLines = allLines.filter((l) => !l.startsWith("[📷"));
      if (textLines.length > 0) {
        const text = textLines.join("").trim();
        if (text) contentHtml = `<p>${inlineMarkdown(text)}</p>`;
      }
    }

    // 7. 普通段落
    else {
      const text = block.lines.join("").trim();
      if (text) contentHtml = `<p>${inlineMarkdown(text)}</p>`;
    }

    // 输出正文
    if (contentHtml) {
      bodyParts.push(contentHtml);
    }

    // 在正文之后输出关联图片（图片在 txt 中位于内容之后）
    if (embeddedImages.length > 0) {
      bodyParts.push(...renderImages(embeddedImages));
    }
  }

  const bodyHtml = bodyParts.join("\n");

  // ============================================================
  // 完整 HTML 页面
  // ============================================================
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @page { margin: 2.5cm 2cm; size: A4; }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
      "Noto Sans SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    font-size: 11pt;
    line-height: 1.8;
    color: #1a1a1a;
    background: #fff;
  }

  /* 封面 */
  .cover {
    text-align: center;
    padding: 120px 0 80px;
    page-break-after: always;
  }
  .cover h1 {
    font-size: 24pt;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 24px;
  }
  .cover .meta {
    font-size: 10pt;
    color: #666;
    line-height: 2;
  }

  h1 {
    font-size: 18pt;
    font-weight: 700;
    margin: 48px 0 16px;
    line-height: 1.3;
    page-break-after: avoid;
  }
  h2 {
    font-size: 14pt;
    font-weight: 600;
    margin: 36px 0 12px;
    line-height: 1.4;
    page-break-after: avoid;
  }
  h3 {
    font-size: 12pt;
    font-weight: 600;
    margin: 28px 0 10px;
    line-height: 1.4;
    page-break-after: avoid;
  }

  p {
    margin: 8px 0;
    text-align: justify;
  }

  ul {
    margin: 8px 0 8px 1.5em;
  }
  li {
    margin: 4px 0;
  }
  strong { font-weight: 600; }

  hr {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 36px 0;
  }

  /* ========== HTML 表格 ========== */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }
  .data-table th,
  .data-table td {
    border: 1px solid #d0d0d0;
    padding: 7px 10px;
    text-align: left;
    vertical-align: top;
    line-height: 1.5;
  }
  .data-table th {
    background: #f5f5f5;
    font-weight: 600;
    font-size: 9pt;
  }
  .data-table td {
    font-size: 9pt;
  }
  .data-table tr:nth-child(even) td {
    background: #fafafa;
  }

  /* ========== 信息卡片 ========== */
  .info-card {
    border: 1px solid #d0d0d0;
    border-left: 3px solid #333;
    padding: 14px 18px;
    margin: 16px 0;
    background: #fafafa;
    page-break-inside: avoid;
  }
  .info-card-title {
    font-weight: 600;
    font-size: 10.5pt;
    margin-bottom: 6px;
    color: #1a1a1a;
  }
  .info-card-body {
    font-size: 9.5pt;
    line-height: 1.7;
    color: #444;
  }

  /* ========== 图片 ========== */
  .doc-image {
    margin: 20px 0;
    text-align: center;
    page-break-inside: avoid;
  }
  .doc-image img {
    max-width: 100%;
    height: auto;
    border: 1px solid #e5e5e5;
    border-radius: 2px;
  }
  .doc-image figcaption {
    margin-top: 8px;
    font-size: 9pt;
    color: #999;
    text-align: center;
  }

  /* ========== ASCII 兜底 ========== */
  pre {
    font-family: "SF Mono", "Cascadia Code", "Fira Code", "Microsoft YaHei", monospace;
    font-size: 7pt;
    line-height: 1.25;
    background: #f8f8f8;
    border: 1px solid #e5e5e5;
    border-radius: 2px;
    padding: 12px 16px;
    margin: 12px 0;
    overflow-x: auto;
    white-space: pre;
    color: #555;
  }

  @media print {
    body { font-size: 10.5pt; }
    pre { font-size: 6.5pt; }
    h1, h2, h3 { page-break-after: avoid; }
    .data-table, .info-card, .doc-image { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="cover">
  <h1>${title}</h1>
  <div class="meta">
    <p>段韬 · 作品集项目文档</p>
    <p>2026 年 6 月</p>
  </div>
</div>
${bodyHtml}
</body>
</html>`;
}

// ============================================================
// 生成 PDF
// ============================================================

async function generatePdf(txtPath, outputPath, title) {
  console.log(`📄 读取: ${txtPath}`);
  const content = readFileSync(txtPath, "utf-8");

  console.log(`🔄 转换 HTML...`);
  const html = txtToHtml(content, title);

  // 写入临时 HTML
  const tempHtmlPath = outputPath.replace(".pdf", ".html");
  writeFileSync(tempHtmlPath, html, "utf-8");
  console.log(`📝 临时 HTML: ${tempHtmlPath}`);

  console.log(`🌐 启动浏览器...`);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--allow-file-access-from-files"],
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "networkidle0",
    timeout: 30000,
  });

  console.log(`🖨️  生成 PDF...`);
  await page.pdf({
    path: outputPath,
    format: "A4",
    margin: { top: "2.5cm", bottom: "2.5cm", left: "2cm", right: "2cm" },
    printBackground: true,
    displayHeaderFooter: false,
  });

  await browser.close();
  console.log(`✅ 完成: ${outputPath} (${(statSync(outputPath).size / 1024).toFixed(0)} KB)\n`);
}

async function main() {
  console.log("🚀 开始生成 PDF 文档 (v2: 智能表格 + 真实图片 + 信息卡片)\n");

  const doc1Path = resolve(txtDir, "中小融媒内容运营体系_产品项目.txt");
  if (existsSync(doc1Path)) {
    await generatePdf(doc1Path, resolve(pdfDir, "中小融媒内容运营体系.pdf"), "中小融媒轻量级内容运营体系");
  } else {
    console.error(`❌ 文件不存在: ${doc1Path}`);
  }

  const doc2Path = resolve(txtDir, "简程项目说明文档2.txt");
  if (existsSync(doc2Path)) {
    await generatePdf(doc2Path, resolve(pdfDir, "简程AI.pdf"), "简程 AI — AI 驱动的求职匹配工具");
  } else {
    console.error(`❌ 文件不存在: ${doc2Path}`);
  }

  console.log("🎉 全部完成！");
}

main().catch((err) => {
  console.error("❌ 生成失败:", err);
  process.exit(1);
});
