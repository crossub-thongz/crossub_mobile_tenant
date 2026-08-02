import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, type RGB } from 'pdf-lib';

import { TENANT_APP_GUIDE } from '@/constants/tenant-app-guide';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = 36;

const BRAND = rgb(0 / 255, 184 / 255, 148 / 255);
const TEXT = rgb(0.08, 0.09, 0.12);
const MUTED = rgb(0.38, 0.42, 0.48);
const LINE = rgb(0.88, 0.9, 0.92);

type Layout = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  fonts: { regular: PDFFont; bold: PDFFont };
  pageNumber: number;
};

function sanitizePdfText(text: string): string {
  return text
    .replace(/\u2192/g, '->')
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u00a9/g, '(c)');
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = sanitizePdfText(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  return lines;
}

function drawFooter(layout: Layout) {
  const { page, fonts, pageNumber } = layout;
  page.drawLine({
    start: { x: MARGIN, y: FOOTER_Y + 14 },
    end: { x: PAGE_WIDTH - MARGIN, y: FOOTER_Y + 14 },
    thickness: 0.5,
    color: LINE,
  });
  page.drawText('CROSSUB Tenant App Guide', {
    x: MARGIN,
    y: FOOTER_Y,
    size: 8,
    font: fonts.regular,
    color: MUTED,
  });
  page.drawText(String(pageNumber), {
    x: PAGE_WIDTH - MARGIN - fonts.regular.widthOfTextAtSize(String(pageNumber), 8),
    y: FOOTER_Y,
    size: 8,
    font: fonts.regular,
    color: MUTED,
  });
}

function newPage(layout: Layout): Layout {
  const page = layout.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const pageNumber = layout.pageNumber + 1;
  const next: Layout = { ...layout, page, y: PAGE_HEIGHT - MARGIN, pageNumber };
  drawFooter(next);
  return next;
}

function ensureSpace(layout: Layout, needed: number): Layout {
  if (layout.y - needed >= MARGIN + 24) return layout;
  return newPage(layout);
}

function drawLines(
  layout: Layout,
  lines: string[],
  opts: { size: number; font: PDFFont; color: RGB; lineHeight: number },
): Layout {
  let current = layout;
  for (const line of lines) {
    current = ensureSpace(current, opts.lineHeight);
    current.page.drawText(sanitizePdfText(line), {
      x: MARGIN,
      y: current.y,
      size: opts.size,
      font: opts.font,
      color: opts.color,
    });
    current = { ...current, y: current.y - opts.lineHeight };
  }
  return current;
}

function drawParagraph(layout: Layout, text: string, size = 10.5, color = TEXT): Layout {
  const lines = wrapText(text, layout.fonts.regular, size, CONTENT_WIDTH);
  return drawLines(layout, lines, {
    size,
    font: layout.fonts.regular,
    color,
    lineHeight: size * 1.45,
  });
}

function drawHeading(layout: Layout, text: string, size = 16): Layout {
  let current = ensureSpace(layout, size * 2.2);
  current.page.drawText(sanitizePdfText(text), {
    x: MARGIN,
    y: current.y,
    size,
    font: current.fonts.bold,
    color: TEXT,
  });
  current = { ...current, y: current.y - size * 1.55 };
  current.page.drawLine({
    start: { x: MARGIN, y: current.y + 4 },
    end: { x: MARGIN + 48, y: current.y + 4 },
    thickness: 2.5,
    color: BRAND,
  });
  return { ...current, y: current.y - 14 };
}

function drawBullets(layout: Layout, items: string[], size = 10): Layout {
  let current = layout;
  for (const item of items) {
    const lines = wrapText(item, current.fonts.regular, size, CONTENT_WIDTH - 16);
    lines.forEach((line, index) => {
      current = ensureSpace(current, size * 1.45);
      if (index === 0) {
        current.page.drawText('*', {
          x: MARGIN,
          y: current.y,
          size: size + 1,
          font: current.fonts.bold,
          color: BRAND,
        });
      }
      current.page.drawText(sanitizePdfText(line), {
        x: MARGIN + 14,
        y: current.y,
        size,
        font: current.fonts.regular,
        color: TEXT,
      });
      current = { ...current, y: current.y - size * 1.45 };
    });
    current = { ...current, y: current.y - 4 };
  }
  return current;
}

async function loadLogoBytes(): Promise<Uint8Array> {
  const logoPath = join(process.cwd(), 'public', 'crossub-logo.png');
  return readFile(logoPath);
}

export async function buildTenantAppGuidePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(TENANT_APP_GUIDE.title);
  doc.setAuthor('CROSSUB');
  doc.setSubject('How to use the CROSSUB Tenant app');
  doc.setCreator('CROSSUB Tenant Portal');

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = await loadLogoBytes();
  const logo = await doc.embedPng(logoBytes);

  const cover = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const logoSize = 88;
  cover.drawImage(logo, {
    x: (PAGE_WIDTH - logoSize) / 2,
    y: PAGE_HEIGHT - 200,
    width: logoSize,
    height: logoSize,
  });

  const titleLines = wrapText(TENANT_APP_GUIDE.title, bold, 22, CONTENT_WIDTH);
  let titleY = PAGE_HEIGHT - 240;
  for (const line of titleLines) {
    const safeLine = sanitizePdfText(line);
    const width = bold.widthOfTextAtSize(safeLine, 22);
    cover.drawText(safeLine, {
      x: (PAGE_WIDTH - width) / 2,
      y: titleY,
      size: 22,
      font: bold,
      color: TEXT,
    });
    titleY -= 28;
  }

  const subtitleWidth = regular.widthOfTextAtSize(TENANT_APP_GUIDE.subtitle, 12);
  cover.drawText(sanitizePdfText(TENANT_APP_GUIDE.subtitle), {
    x: (PAGE_WIDTH - subtitleWidth) / 2,
    y: titleY - 8,
    size: 12,
    font: regular,
    color: MUTED,
  });

  const versionWidth = regular.widthOfTextAtSize(TENANT_APP_GUIDE.versionLabel, 10);
  cover.drawText(TENANT_APP_GUIDE.versionLabel, {
    x: (PAGE_WIDTH - versionWidth) / 2,
    y: 120,
    size: 10,
    font: regular,
    color: MUTED,
  });

  cover.drawText('crossub.com.au', {
    x: (PAGE_WIDTH - regular.widthOfTextAtSize('crossub.com.au', 9)) / 2,
    y: 100,
    size: 9,
    font: regular,
    color: BRAND,
  });

  let layout: Layout = {
    doc,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - MARGIN,
    fonts: { regular, bold },
    pageNumber: 2,
  };
  drawFooter(layout);

  layout = drawHeading(layout, 'Introduction', 18);
  layout = drawParagraph(layout, TENANT_APP_GUIDE.intro);
  layout = { ...layout, y: layout.y - 10 };

  layout = drawHeading(layout, 'Contents', 14);
  for (const section of TENANT_APP_GUIDE.sections) {
    layout = ensureSpace(layout, 16);
    layout.page.drawText(sanitizePdfText(section.title), {
      x: MARGIN,
      y: layout.y,
      size: 10,
      font: regular,
      color: TEXT,
    });
    layout = { ...layout, y: layout.y - 14 };
  }
  layout = newPage(layout);

  for (const section of TENANT_APP_GUIDE.sections) {
    layout = drawHeading(layout, section.title, 15);
    layout = drawParagraph(layout, section.summary, 10.5, MUTED);
    layout = { ...layout, y: layout.y - 6 };
    layout = ensureSpace(layout, 18);
    layout.page.drawText('Steps', {
      x: MARGIN,
      y: layout.y,
      size: 11,
      font: bold,
      color: TEXT,
    });
    layout = { ...layout, y: layout.y - 16 };
    layout = drawBullets(layout, section.steps);

    if (section.tips?.length) {
      layout = { ...layout, y: layout.y - 4 };
      layout = ensureSpace(layout, 18);
      layout.page.drawText('Tips', {
        x: MARGIN,
        y: layout.y,
        size: 11,
        font: bold,
        color: TEXT,
      });
      layout = { ...layout, y: layout.y - 16 };
      layout = drawBullets(layout, section.tips, 9.5);
    }

    layout = { ...layout, y: layout.y - 12 };
  }

  layout = ensureSpace(layout, 60);
  layout.page.drawRectangle({
    x: MARGIN,
    y: layout.y - 52,
    width: CONTENT_WIDTH,
    height: 56,
    color: rgb(0.97, 0.99, 0.98),
    borderColor: BRAND,
    borderWidth: 0.8,
  });
  layout.page.drawImage(logo, {
    x: MARGIN + 12,
    y: layout.y - 44,
    width: 36,
    height: 36,
  });
  const footerLines = wrapText(TENANT_APP_GUIDE.footer, regular, 9, CONTENT_WIDTH - 64);
  footerLines.forEach((line, index) => {
    layout.page.drawText(sanitizePdfText(line), {
      x: MARGIN + 56,
      y: layout.y - 14 - index * 12,
      size: 9,
      font: regular,
      color: MUTED,
    });
  });

  return doc.save();
}
