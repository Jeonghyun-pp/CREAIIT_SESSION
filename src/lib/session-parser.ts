/**
 * Deterministic parser for raw session text format.
 *
 * Expected format uses ━━━ dividers, ■ section headers,
 * circled numbers ①–⑩ for blocks, and ▶ for transitions.
 */

export interface ParsedBlock {
  order: number;
  type: "FLOW";
  title: string;
  description: string;
}

export interface ParsedSession {
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  summary: string;
  goals: string[];
  prerequisites: string[];
  blocks: ParsedBlock[];
}

const CIRCLED_NUMS = "①②③④⑤⑥⑦⑧⑨⑩";
const DIVIDER_RE = /^[━─]{3,}/;
// Supports: "3/9 Session 1 — 제목", "2026-03-09 Session 1 — 제목", "2026-03-09 Session — 제목" (번호 생략 가능)
const HEADER_SHORT_RE = /(\d{1,2})\/(\d{1,2})\s+Session(?:\s+\d+)?\s*[—\-–]\s*(.+)/i;
const HEADER_ISO_RE = /(\d{4})-(\d{2})-(\d{2})\s+Session(?:\s+\d+)?\s*[—\-–]\s*(.+)/i;
const SECTION_RE = /^■\s*(.+)/;
const NUMBERED_RE = /^\d+[\.\)]\s*(.+)/;
const BLOCK_START_RE = new RegExp(`^[${CIRCLED_NUMS}]\\s*(.+)`);
const TRANSITION_RE = /^▶\s*(.+)/;

/** Split text into major sections delimited by ■ headers. */
function splitSections(text: string): Map<string, string> {
  const lines = text.split(/\r?\n/);
  const sections = new Map<string, string>();
  let currentKey = "__header__";
  let buf: string[] = [];

  for (const line of lines) {
    if (DIVIDER_RE.test(line.trim())) continue; // skip divider lines

    const sectionMatch = line.trim().match(SECTION_RE);
    if (sectionMatch) {
      sections.set(currentKey, buf.join("\n").trim());
      currentKey = sectionMatch[1].trim();
      buf = [];
    } else {
      buf.push(line);
    }
  }
  sections.set(currentKey, buf.join("\n").trim());
  return sections;
}

/** Extract title and date from the header section. */
function parseHeader(header: string): { title: string; date: string } {
  for (const line of header.split(/\r?\n/)) {
    const trimmed = line.trim();

    // Try ISO format first: 2026-03-09 Session 1 — 제목
    const iso = trimmed.match(HEADER_ISO_RE);
    if (iso) {
      return {
        title: iso[4].trim(),
        date: `${iso[1]}-${iso[2]}-${iso[3]}`,
      };
    }

    // Try short format: 3/9 Session 1 — 제목
    const short = trimmed.match(HEADER_SHORT_RE);
    if (short) {
      const month = short[1].padStart(2, "0");
      const day = short[2].padStart(2, "0");
      const year = new Date().getFullYear();
      return {
        title: short[3].trim(),
        date: `${year}-${month}-${day}`,
      };
    }
  }
  return { title: "", date: "" };
}

/** Extract summary from 세션 목표 section. */
function parseSummary(text: string): string {
  // Take all non-empty lines, skip meta phrases like "오늘의 목표는 단 하나다."
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.join("\n");
}

/** Extract goals from 오늘 배우는 것 section. */
function parseGoals(text: string): string[] {
  const goals: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().match(NUMBERED_RE);
    if (m) goals.push(m[1].trim());
  }
  return goals;
}

/** Parse detailed timeline blocks from the 타임라인 상세 section and beyond. */
function parseBlocks(sections: Map<string, string>): ParsedBlock[] {
  // Collect all text after "타임라인 상세" section header
  const keys = [...sections.keys()];
  const detailIdx = keys.findIndex((k) => k.includes("타임라인 상세"));
  if (detailIdx === -1) return [];

  // Gather all sections from detail onward
  const remainingKeys = keys.slice(detailIdx);
  let fullText = "";
  for (const key of remainingKeys) {
    const val = sections.get(key) || "";
    // If this is a separate ■ section after the detail (like 오늘의 진짜 의미),
    // include it with a marker
    if (key !== remainingKeys[0]) {
      fullText += `\n■ ${key}\n${val}\n`;
    } else {
      fullText += val + "\n";
    }
  }

  const lines = fullText.split(/\r?\n/);
  const rawBlocks: { title: string; lines: string[]; isTransition: boolean }[] =
    [];

  let current: { title: string; lines: string[]; isTransition: boolean } | null =
    null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || DIVIDER_RE.test(trimmed)) continue;

    // Check for circled number block start
    const blockMatch = trimmed.match(BLOCK_START_RE);
    if (blockMatch) {
      if (current) rawBlocks.push(current);
      current = { title: blockMatch[1].trim(), lines: [], isTransition: false };
      continue;
    }

    // Check for transition marker
    const transMatch = trimmed.match(TRANSITION_RE);
    if (transMatch) {
      if (current) rawBlocks.push(current);
      current = { title: transMatch[1].trim(), lines: [], isTransition: true };
      continue;
    }

    // Check for a new ■ section (like 오늘의 진짜 의미)
    const sectionMatch = trimmed.match(SECTION_RE);
    if (sectionMatch) {
      if (current) rawBlocks.push(current);
      current = {
        title: sectionMatch[1].trim(),
        lines: [],
        isTransition: false,
      };
      continue;
    }

    // Append to current block
    if (current) {
      current.lines.push(line);
    }
  }
  if (current) rawBlocks.push(current);

  // Merge transitions into the next block's description
  const merged: ParsedBlock[] = [];
  let pendingTransition = "";
  let order = 0;

  for (const raw of rawBlocks) {
    if (raw.isTransition) {
      const desc = raw.lines.join("\n").trim();
      pendingTransition = desc
        ? `[연결] ${desc}`
        : `[연결] ${raw.title}`;
      continue;
    }

    let description = raw.lines.join("\n").trim();
    if (pendingTransition) {
      description = pendingTransition + "\n\n" + description;
      pendingTransition = "";
    }

    merged.push({
      order,
      type: "FLOW",
      title: raw.title,
      description,
    });
    order++;
  }

  return merged;
}

/** Main entry point: parse raw session text into structured data. */
export function parseSessionText(raw: string): ParsedSession {
  const sections = splitSections(raw);
  const { title, date } = parseHeader(sections.get("__header__") || "");

  // Find summary section (세션 목표)
  const summaryKey = [...sections.keys()].find((k) => k.includes("세션 목표"));
  const summary = summaryKey ? parseSummary(sections.get(summaryKey)!) : "";

  // Find goals section (오늘 배우는 것)
  const goalsKey = [...sections.keys()].find((k) => k.includes("오늘 배우는 것"));
  const goals = goalsKey ? parseGoals(sections.get(goalsKey)!) : [];

  // Parse blocks from detailed timeline
  const blocks = parseBlocks(sections);

  return {
    title,
    date,
    summary,
    goals,
    prerequisites: [],
    blocks,
  };
}
