// Minimal RSS 2.0 + Atom parser. Regex-based; covers the common shapes
// (single channel, <item> or <entry>). Not a full XML parser — gov RSS
// feeds and most news feeds are well-formed enough that this suffices.
// Stronger parser arrives in Sprint 1.4 alongside paid sources.

import { stripHtml } from './strip-html.js';

export interface FeedItem {
  readonly title?: string;
  readonly link?: string;
  readonly description?: string;
  readonly publishedAt?: string;     // ISO
  readonly guid?: string;
  readonly author?: string;
  readonly categories: readonly string[];
}

export interface Feed {
  readonly format: 'rss' | 'atom' | 'unknown';
  readonly title?: string;
  readonly link?: string;
  readonly items: readonly FeedItem[];
}

const ITEM_RE  = /<item\b[\s\S]*?<\/item>/gi;
const ENTRY_RE = /<entry\b[\s\S]*?<\/entry>/gi;
const TAG_RE   = (name: string) => new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i');
const SELF_HREF_RE = /<link\b[^>]*href="([^"]+)"[^>]*\/?>/i;
const CHANNEL_TITLE_RE = /<channel\b[\s\S]*?<title>([^<]*)<\/title>/i;
const FEED_TITLE_RE    = /<feed\b[\s\S]*?<title>([^<]*)<\/title>/i;

function decodeCData(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const m = s.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return m && m[1] !== undefined ? m[1] : s;
}

function pickTag(xml: string, tag: string): string | undefined {
  const m = xml.match(TAG_RE(tag));
  return m ? decodeCData(m[1])?.trim() : undefined;
}

function pickCategories(xml: string): readonly string[] {
  const out: string[] = [];
  const re = /<category\b[^>]*>([\s\S]*?)<\/category>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const v = decodeCData(m[1])?.trim();
    if (v) out.push(v);
  }
  return out;
}

function toIso(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function parseAtomItem(xml: string): FeedItem {
  const title = pickTag(xml, 'title');
  const summary = pickTag(xml, 'summary') ?? pickTag(xml, 'content');
  const updated = pickTag(xml, 'updated') ?? pickTag(xml, 'published');
  const id = pickTag(xml, 'id');
  const author = pickTag(xml, 'name');
  const hrefMatch = xml.match(SELF_HREF_RE);
  const link = hrefMatch?.[1];
  return {
    ...(title    !== undefined ? { title: stripHtml(title) }       : {}),
    ...(link     !== undefined ? { link }                          : {}),
    ...(summary  !== undefined ? { description: stripHtml(summary) } : {}),
    ...(toIso(updated) !== undefined ? { publishedAt: toIso(updated)! } : {}),
    ...(id       !== undefined ? { guid: id }                      : {}),
    ...(author   !== undefined ? { author }                        : {}),
    categories: pickCategories(xml),
  };
}

function parseRssItem(xml: string): FeedItem {
  const title = pickTag(xml, 'title');
  const link = pickTag(xml, 'link');
  const description = pickTag(xml, 'description');
  const pubDate = pickTag(xml, 'pubDate') ?? pickTag(xml, 'dc:date');
  const guid = pickTag(xml, 'guid');
  const author = pickTag(xml, 'author') ?? pickTag(xml, 'dc:creator');
  return {
    ...(title       !== undefined ? { title: stripHtml(title) }            : {}),
    ...(link        !== undefined ? { link }                               : {}),
    ...(description !== undefined ? { description: stripHtml(description) } : {}),
    ...(toIso(pubDate) !== undefined ? { publishedAt: toIso(pubDate)! }    : {}),
    ...(guid        !== undefined ? { guid }                               : {}),
    ...(author      !== undefined ? { author }                             : {}),
    categories: pickCategories(xml),
  };
}

export function parseFeed(xml: string): Feed {
  if (/<feed\b/i.test(xml) && /<entry\b/i.test(xml)) {
    const items: FeedItem[] = [];
    let m: RegExpExecArray | null;
    while ((m = ENTRY_RE.exec(xml))) items.push(parseAtomItem(m[0]));
    const titleMatch = xml.match(FEED_TITLE_RE);
    const title = titleMatch?.[1]?.trim();
    return {
      format: 'atom',
      ...(title ? { title } : {}),
      items,
    };
  }
  if (/<rss\b/i.test(xml) && /<item\b/i.test(xml)) {
    const items: FeedItem[] = [];
    let m: RegExpExecArray | null;
    while ((m = ITEM_RE.exec(xml))) items.push(parseRssItem(m[0]));
    const titleMatch = xml.match(CHANNEL_TITLE_RE);
    const title = titleMatch?.[1]?.trim();
    return {
      format: 'rss',
      ...(title ? { title } : {}),
      items,
    };
  }
  return { format: 'unknown', items: [] };
}
