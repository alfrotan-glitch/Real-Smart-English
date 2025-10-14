// src/utils/srt.ts
// =============================================================================
// Tiny, dependency-free SRT helpers for podcast/SEO pipeline.
// Safe for TS5 with `noUncheckedIndexedAccess: true`.
// =============================================================================

export type SrtEntry = {
  index: number;
  start: number; // seconds
  end: number;   // seconds
  text: string;  // cleaned single-line text
};

/** 00:00:00,000 --> 00:00:01,234 */
const TS_RE =
  /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/;

/** "00:01:23,456" parts -> seconds (float). */
function tsToSec(h: string, m: string, s: string, ms: string): number {
  const hh = Number(h) || 0;
  const mm = Number(m) || 0;
  const ss = Number(s) || 0;
  const mss = Number(ms) || 0;
  return hh * 3600 + mm * 60 + ss + mss / 1000;
}

/** seconds -> "HH:MM" for YouTube chapters (omits hours if zero). */
export function secToHHMM(sec: number): string {
  const t = Math.max(0, Math.floor(sec));
  const hh = Math.floor(t / 3600);
  const mm = Math.floor((t % 3600) / 60);
  return (hh > 0 ? String(hh).padStart(2, "0") + ":" : "") + String(mm).padStart(2, "0");
}

/** Basic HTML/markup/noise cleaner for a subtitle line. */
export function cleanLine(s: string): string {
  let txt = s || "";

  // strip BOM and control chars
  txt = txt.replace(/\ufeff/g, "").replace(/[\u0000-\u001F]/g, " ");

  // remove HTML tags and ASS-like tags
  txt = txt.replace(/<[^>]+>/g, " ").replace(/\{\\[^}]+\}/g, " ");

  // remove speaker labels like "LUKE:" or "[Luke]" at start
  txt = txt.replace(/^[\[\(]?[A-Z][A-Za-z0-9._ -]{0,30}[\]\)]?:\s+/, "");

  // remove bracketed cues [music], (laughs), ♪ … ♪
  txt = txt.replace(/[\[\(]?[♪\*]?[A-Za-z ]{2,40}[♪\*]?[\]\)]/gi, " ");

  // normalize quotes and dashes
  txt = txt.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-");

  // collapse whitespace
  txt = txt.replace(/\s+/g, " ").trim();

  // drop pure punctuation lines
  if (/^[\.\,\-\—\–\!\?\:;]+$/.test(txt)) return "";
  return txt;
}

/** Safe getter for arrays when noUncheckedIndexedAccess is on. */
function at<T>(arr: ReadonlyArray<T>, i: number): T | undefined {
  return i >= 0 && i < arr.length ? arr[i] : undefined;
}

/** Parse raw SRT into time-aligned entries with cleaned one-line text. */
export function parseSrt(raw: string): SrtEntry[] {
  if (!raw) return [];
  const lines = raw.replace(/\r/g, "").split("\n");

  const entries: SrtEntry[] = [];
  let i = 0;
  let idx = 0;

  while (i < lines.length) {
    // skip empty lines
    // guard each access to satisfy TS with noUncheckedIndexedAccess
    for (; i < lines.length; i++) {
      const l = at(lines, i);
      if (!l || !l.trim()) continue;
      break;
    }
    if (i >= lines.length) break;

    // optional numeric index
    const maybeIndexRaw = at(lines, i);
    if (!maybeIndexRaw) break;
    const maybeIndex = maybeIndexRaw.trim();
    const numericIndex = /^\d+$/.test(maybeIndex) ? Number(maybeIndex) : null;
    if (numericIndex !== null) {
      idx = numericIndex;
      i++;
    } else {
      idx = entries.length + 1;
    }

    // expect timestamp
    if (i >= lines.length) break;
    const tsLineRaw = at(lines, i);
    if (!tsLineRaw) break;
    const tsLine = tsLineRaw.trim();
    const m = tsLine.match(TS_RE);
    if (!m) {
      i++;
      continue;
    }
    const start = tsToSec(m[1], m[2], m[3], m[4]);
    const end = tsToSec(m[5], m[6], m[7], m[8]);
    i++;

    // collect text until blank
    const buf: string[] = [];
    for (; i < lines.length; i++) {
      const lineRaw = at(lines, i);
      if (!lineRaw) break;
      const trimmed = lineRaw.trim();
      if (!trimmed) break;
      const cleaned = cleanLine(lineRaw);
      if (cleaned) buf.push(cleaned);
    }

    const text = buf.join(" ").replace(/\s+/g, " ").trim();
    if (text) {
      entries.push({ index: idx, start, end, text });
    }

    // skip the blank after block
    for (; i < lines.length; i++) {
      const l = at(lines, i);
      if (!l || !l.trim()) continue;
      break;
    }
  }

  // sort by start just in case
  entries.sort((a, b) => a.start - b.start);
  return entries;
}

/**
 * Convert SRT to readable paragraphs for model ingestion.
 * - Drops indices and timestamps
 * - Cleans noise
 * - Merges consecutive short lines into one paragraph
 */
export function srtToPlainText(raw: string): string {
  if (!raw) return "";
  const entries = parseSrt(raw);
  if (entries.length === 0) return "";

  const merged: string[] = [];
  let buf = "";

  const pushBuf = () => {
    const t = buf.trim();
    if (t) merged.push(t);
    buf = "";
  };

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const line = e.text;
    if ((buf ? buf + " " + line : line).length <= 280) {
      buf = buf ? buf + " " + line : line;
    } else {
      pushBuf();
      buf = line;
    }
  }
  pushBuf();

  return merged.join("\n");
}

/**
 * Heuristic chapter extraction from SRT.
 * Returns HH:MM + short title, sized for YouTube chapters.
 */
export function extractChaptersFromSrt(
  rawOrEntries: string | SrtEntry[],
  opts?: {
    minGapSec?: number;           // minimum gap between chapter anchors
    titleMaxLen?: number;         // max title length
    preferSentenceEnds?: boolean; // prefer lines ending with . ! ?
  }
): { at: string; title: string }[] {
  const {
    minGapSec = 60,
    titleMaxLen = 48,
    preferSentenceEnds = true,
  } = opts || {};

  const entries = Array.isArray(rawOrEntries) ? rawOrEntries : parseSrt(rawOrEntries);
  if (entries.length === 0) return [];

  const chapters: { at: string; title: string }[] = [];
  let lastAnchor = -Infinity;

  const pickTitle = (txt: string) => {
    let t = txt.trim();

    if (preferSentenceEnds) {
      const m = t.match(/^(.+?[\.!\?])\s+/);
      if (m) t = m[1];
    }

    t = t.replace(/\s*[\.\!\?]+$/, "");

    if (t.length > titleMaxLen) {
      const cut = t.slice(0, titleMaxLen + 5);
      const lastSep = Math.max(
        cut.lastIndexOf(" - "),
        cut.lastIndexOf(" — "),
        cut.lastIndexOf(", "),
        cut.lastIndexOf(": ")
      );
      t = (lastSep > 20 ? cut.slice(0, lastSep) : cut).trim();
      if (t.length > titleMaxLen) t = t.slice(0, titleMaxLen - 1).trim() + "…";
    }

    t = t.replace(/\b([a-z])/g, (_: string, c: string) => c.toUpperCase());
    return t || "Chapter";
  };

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const gapOk = e.start - lastAnchor >= minGapSec;
    const contentful = /\w/.test(e.text) && e.text.length >= 18;

    if (!gapOk || !contentful) continue;

    const at = secToHHMM(e.start);
    const title = pickTitle(e.text);

    if (!chapters.some((c) => c.at === at)) {
      chapters.push({ at, title });
      lastAnchor = e.start;
    }
  }

  if (!chapters.some((c) => c.at === "00")) {
    const firstText = entries[0]?.text || "Intro";
    chapters.unshift({ at: "00", title: pickTitle(firstText) });
  }

  const deduped: { at: string; title: string }[] = [];
  let prev = "";
  for (let i = 0; i < chapters.length; i++) {
    const c = chapters[i]!;
    const k = c.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (k && k !== prev) deduped.push(c);
    prev = k;
  }

  return deduped;
}
