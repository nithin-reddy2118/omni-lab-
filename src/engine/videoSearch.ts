import type { ScienceVideoItem } from '../types/science';

const FETCH_TIMEOUT_MS = 4500;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  const stopWords = new Set([
    'why', 'how', 'does', 'do', 'what', 'when', 'where', 'is', 'are', 'the', 'a', 'an',
    'in', 'on', 'at', 'of', 'to', 'for', 'with', 'from', 'and', 'or', 'that', 'this',
    'happen', 'happens', 'work', 'works', 'move', 'moves', 'science', 'video',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));
}

function scoreRelevance(itemTitle: string, itemDesc: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const titleLower = itemTitle.toLowerCase();
  const descLower = itemDesc.toLowerCase();
  let score = 0;
  for (const tok of tokens) {
    if (titleLower.includes(tok)) score += 3;
    else if (descLower.includes(tok)) score += 1;
  }
  return score;
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function searchWikimediaVideos(query: string): Promise<ScienceVideoItem[]> {
  const endpoint =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
    `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(`filetype:video ${query}`)}` +
    `&gsrlimit=6&prop=videoinfo&viprop=url|mime|size|extmetadata&viurlwidth=640`;

  const res = await fetchWithTimeout(endpoint, {
    headers: {
      'User-Agent': 'BreakTheRulesScienceLab/1.0 (Educational STEM Platform)',
    },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          pageid: number;
          title: string;
          videoinfo?: Array<{
            url?: string;
            descriptionurl?: string;
            thumburl?: string;
            mime?: string;
            duration?: number;
            extmetadata?: {
              Artist?: { value?: string };
              ImageDescription?: { value?: string };
              LicenseShortName?: { value?: string };
              ObjectName?: { value?: string };
            };
          }>;
        }
      >;
    };
  };

  const pages = Object.values(data.query?.pages ?? {});
  const results: ScienceVideoItem[] = [];

  for (const page of pages) {
    const info = page.videoinfo?.[0];
    if (!info?.url || !info.thumburl || !info.descriptionurl) continue;
    const mime = (info.mime ?? '').toLowerCase();
    const isBrowserPlayable =
      mime.includes('webm') ||
      mime.includes('mp4') ||
      mime.includes('ogg') ||
      /\.(webm|mp4|ogv)(\?|$)/i.test(info.url);
    if (!isBrowserPlayable) continue;

    const cleanFileTitle = page.title
      .replace(/^File:/i, '')
      .replace(/\.(webm|mp4|ogv|ogg)$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    const meta = info.extmetadata;
    const rawDesc = stripHtml(meta?.ImageDescription?.value || '');
    const creator = stripHtml(meta?.Artist?.value || '') || 'Wikimedia Commons Contributor';
    const license = stripHtml(meta?.LicenseShortName?.value || '') || 'Open Educational License';

    results.push({
      id: `wm-${page.pageid}`,
      title: stripHtml(meta?.ObjectName?.value || '') || cleanFileTitle,
      creator: creator.slice(0, 110),
      provider: 'Wikimedia Commons',
      durationSeconds: info.duration ? Math.round(info.duration) : undefined,
      thumbnailUrl: info.thumburl,
      playableUrl: info.url,
      sourceUrl: info.descriptionurl,
      description:
        (rawDesc || `Educational science demonstration file from Wikimedia Commons: ${cleanFileTitle}.`).slice(0, 260),
      license,
    });
  }

  return results;
}

async function searchNasaVideos(query: string): Promise<ScienceVideoItem[]> {
  const endpoint = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=video&page_size=4`;
  const res = await fetchWithTimeout(endpoint);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    collection?: {
      items?: Array<{
        href?: string;
        data?: Array<{
          nasa_id?: string;
          title?: string;
          description?: string;
          center?: string;
        }>;
        links?: Array<{ href?: string; rel?: string; render?: string }>;
      }>;
    };
  };

  const items = (data.collection?.items ?? []).slice(0, 3);
  const resolved = await Promise.all(
    items.map(async (item): Promise<ScienceVideoItem | null> => {
      const meta = item.data?.[0];
      const thumb = item.links?.find((l) => l.rel === 'preview')?.href;
      if (!meta?.nasa_id || !meta.title || !item.href || !thumb) return null;

      try {
        const assetRes = await fetchWithTimeout(item.href);
        if (!assetRes.ok) return null;
        const assetUrls = (await assetRes.json()) as string[];
        const mp4Url =
          assetUrls.find((u) => u.endsWith('~medium.mp4')) ||
          assetUrls.find((u) => u.endsWith('~small.mp4')) ||
          assetUrls.find((u) => u.endsWith('.mp4'));
        if (!mp4Url) return null;

        return {
          id: `nasa-${meta.nasa_id}`,
          title: meta.title,
          creator: meta.center ? `NASA (${meta.center})` : 'NASA Video Library',
          provider: 'NASA Video Library',
          thumbnailUrl: thumb,
          playableUrl: mp4Url.replace(/^http:\/\//i, 'https://'),
          sourceUrl: `https://images.nasa.gov/details-${encodeURIComponent(meta.nasa_id)}`,
          description: stripHtml(meta.description || meta.title).slice(0, 260),
          license: 'NASA Public Domain Media',
        };
      } catch {
        return null;
      }
    })
  );

  return resolved.filter((v): v is ScienceVideoItem => v !== null);
}

export async function searchEducationalVideos(args: {
  keywords: string[];
  question: string;
  subject?: string;
  excludeIds?: string[];
}): Promise<ScienceVideoItem[]> {
  const { keywords, question, subject = '', excludeIds = [] } = args;
  const excludeSet = new Set(excludeIds);
  const queryList = Array.from(
    new Set(
      [...keywords.slice(0, 2), question]
        .map((q) => q.trim())
        .filter((q) => q.length >= 2)
    )
  ).slice(0, 2);

  if (queryList.length === 0) return [];

  const tokens = tokenize(`${keywords.join(' ')} ${question}`);
  const isSpaceOrAero = /space|astro|rocket|orbit|planet|moon|solar|heat\s*shield|satellite|mars/i.test(
    `${subject} ${question} ${keywords.join(' ')}`
  );

  const searchPromises: Promise<ScienceVideoItem[]>[] = [];
  for (const q of queryList) {
    searchPromises.push(searchWikimediaVideos(q).catch(() => []));
  }
  if (isSpaceOrAero) {
    searchPromises.push(searchNasaVideos(queryList[0]).catch(() => []));
  }

  const settled = await Promise.all(searchPromises);
  const allCandidates = settled.flat();

  // Deduplicate by ID and exclude previously skipped IDs
  const uniqueMap = new Map<string, ScienceVideoItem>();
  for (const item of allCandidates) {
    if (!excludeSet.has(item.id) && !uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  }

  // Score and filter strictly for genuine relevance (never show unrelated videos just to fill space)
  const scored = Array.from(uniqueMap.values())
    .map((item) => ({
      item,
      score: scoreRelevance(item.title, item.description, tokens),
    }))
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 4).map((s) => s.item);
}
