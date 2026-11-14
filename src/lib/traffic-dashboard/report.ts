import type { TrafficCount, TrafficLocale } from "../traffic";

export const trafficPeriods = [7, 30, 90, 365] as const;
const locales: readonly TrafficLocale[] = ["el", "en", "de"];
const dayMs = 86_400_000;
const earliestDay = Date.parse("0001-01-01T00:00:00Z");

export type TrafficFilters = {
  period: string;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  days: string[];
  lang: TrafficLocale | "";
  page: string;
  day: string;
  unclassifiedOnly: boolean;
};

type DailyTraffic = {
  day: string;
  counts: Record<TrafficLocale, number>;
  total: number;
  previousTotal: number | null;
  recorded: boolean;
};

type TrafficTotals = {
  locale: TrafficLocale;
  total: number;
  share: number;
  previousTotal: number | null;
};

export type TrafficReport = {
  filters: TrafficFilters;
  firstRecordedDay: string | null;
  pageOptions: string[];
  daily: DailyTraffic[];
  total: number;
  requestKinds: { prefetch: number; suspected_bot: number; unclassified: number };
  average: number | null;
  recordedDays: number;
  activeDays: number;
  activePages: number;
  peak: { day: string; total: number } | null;
  previousTotal: number | null;
  languageTotals: TrafficTotals[];
  pages: (TrafficTotals & { page: string })[];
  detailRows: TrafficCount[];
};

function isoDay(time: number) {
  return new Date(time).toISOString().slice(0, 10);
}

function dayTime(day: string | null) {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const time = Date.parse(`${day}T00:00:00Z`);
  return time >= earliestDay && isoDay(time) === day ? time : null;
}

function publicPage(value: string | null) {
  if (!value || value.length > 400 || value.trim() !== value) return "";
  if (value === "/") return value;
  if (!/^\/(?:[a-zA-Z0-9_-]|%[0-9A-F]{2})+(?:\/(?:[a-zA-Z0-9_-]|%[0-9A-F]{2})+)*$/.test(value)) return "";
  return /^(?:el|en|de|api|studio|private)$/.test(value.split("/")[1]) ? "" : value;
}

export function trafficFilters(today: string, params: URLSearchParams): TrafficFilters {
  const end = Date.parse(`${today}T00:00:00Z`);
  const requested = params.get("period");
  const preset = trafficPeriods.find(length => String(length) === requested) ?? 30;
  let period = String(preset);
  let fromTime = end - (preset - 1) * dayMs;
  let toTime = end;

  if (requested === "custom") {
    const from = dayTime(params.get("from"));
    const to = dayTime(params.get("to"));
    if (from !== null && to !== null && from <= to && to <= end && to - from < 366 * dayMs) {
      period = "custom";
      fromTime = from;
      toTime = to;
    }
  }

  const length = (toTime - fromTime) / dayMs + 1;
  const days = Array.from({ length }, (_, index) => isoDay(fromTime + index * dayMs));
  const requestedDay = params.get("day") ?? "";

  return {
    period,
    from: days[0],
    to: days[days.length - 1],
    previousFrom: isoDay(Math.max(earliestDay, fromTime - length * dayMs)),
    previousTo: isoDay(Math.max(earliestDay, fromTime - dayMs)),
    days,
    lang: locales.find(locale => locale === params.get("lang")) ?? "",
    page: publicPage(params.get("page")),
    day: days.includes(requestedDay) ? requestedDay : "",
    unclassifiedOnly: params.get("traffic") === "unclassified",
  };
}

function emptyCounts(): Record<TrafficLocale, number> {
  return { el: 0, en: 0, de: 0 };
}

export function trafficReport(filters: TrafficFilters, firstRecordedDay: string | null, rows: TrafficCount[]): TrafficReport {
  const previousDays = new Map<string, DailyTraffic>();
  const daily = filters.days.map(day => {
    const pairedTime = Date.parse(`${day}T00:00:00Z`) - filters.days.length * dayMs;
    const pairedDay = pairedTime >= earliestDay ? isoDay(pairedTime) : "";
    const knownPrevious = firstRecordedDay !== null && pairedDay > firstRecordedDay;
    const entry: DailyTraffic = {
      day,
      counts: emptyCounts(),
      total: 0,
      previousTotal: knownPrevious ? 0 : null,
      recorded: firstRecordedDay !== null && day >= firstRecordedDay,
    };
    if (knownPrevious) previousDays.set(pairedDay, entry);
    return entry;
  });

  const visibleDays = filters.day ? daily.filter(entry => entry.day === filters.day) : daily;
  const canCompare = visibleDays.every(entry => entry.previousTotal !== null);
  const currentDays = new Map(daily.map(entry => [entry.day, entry]));
  const pageOptions = new Set(filters.page ? [filters.page] : []);
  const pageTotals = new Map<string, TrafficReport["pages"][number]>();
  const languageCounts = emptyCounts();
  const previousLanguageCounts = emptyCounts();
  const detailRows: TrafficCount[] = [];
  let prefetch = 0;
  let suspectedBots = 0;

  function pageTotal(row: TrafficCount) {
    const key = `${row.locale}:${row.page}`;
    const existing = pageTotals.get(key);
    if (existing) return existing;
    const entry = { page: row.page, locale: row.locale, total: 0, previousTotal: canCompare ? 0 : null, share: 0 };
    pageTotals.set(key, entry);
    return entry;
  }

  for (const storedRow of rows) {
    if (filters.lang && storedRow.locale !== filters.lang) continue;
    if (storedRow.day >= filters.previousFrom && storedRow.day <= filters.to) pageOptions.add(storedRow.page);
    if (filters.page && storedRow.page !== filters.page) continue;

    // Keep the original buckets intact and use the selected count throughout the report.
    const row = filters.unclassifiedOnly ? {
      ...storedRow,
      count: storedRow.count - (storedRow.prefetchRequests ?? 0) - (storedRow.suspectedBotRequests ?? 0),
      prefetchRequests: 0,
      suspectedBotRequests: 0,
    } : storedRow;
    if (row.count === 0) continue;

    const current = currentDays.get(row.day);
    if (current?.recorded) {
      current.counts[row.locale] += row.count;
      current.total += row.count;
      if (!filters.day || filters.day === row.day) {
        detailRows.push(row);
        prefetch += row.prefetchRequests ?? 0;
        suspectedBots += row.suspectedBotRequests ?? 0;
        languageCounts[row.locale] += row.count;
        pageTotal(row).total += row.count;
      }
    }

    const previous = previousDays.get(row.day);
    if (previous) {
      previous.previousTotal = (previous.previousTotal ?? 0) + row.count;
      if (canCompare && (!filters.day || filters.day === previous.day)) {
        previousLanguageCounts[row.locale] += row.count;
        const page = pageTotal(row);
        page.previousTotal = (page.previousTotal ?? 0) + row.count;
      }
    }
  }

  const total = visibleDays.reduce((sum, entry) => sum + entry.total, 0);
  const recordedDays = visibleDays.filter(entry => entry.recorded).length;
  const active = visibleDays.filter(entry => entry.total > 0);
  const peak = active.reduce<DailyTraffic | null>((best, entry) => !best || entry.total >= best.total ? entry : best, null);
  const pages = [...pageTotals.values()]
    .map(entry => ({ ...entry, share: total ? entry.total / total : 0 }))
    .sort((a, b) => b.total - a.total || (b.previousTotal ?? 0) - (a.previousTotal ?? 0) || a.page.localeCompare(b.page) || a.locale.localeCompare(b.locale));

  return {
    filters,
    firstRecordedDay,
    pageOptions: [...pageOptions].sort(),
    daily,
    total,
    requestKinds: { prefetch, suspected_bot: suspectedBots, unclassified: total - prefetch - suspectedBots },
    average: recordedDays ? total / recordedDays : null,
    recordedDays,
    activeDays: active.length,
    activePages: pages.filter(page => page.total > 0).length,
    peak: peak && { day: peak.day, total: peak.total },
    previousTotal: canCompare ? visibleDays.reduce((sum, entry) => sum + (entry.previousTotal ?? 0), 0) : null,
    languageTotals: locales.map(locale => ({
      locale,
      total: languageCounts[locale],
      share: total ? languageCounts[locale] / total : 0,
      previousTotal: canCompare ? previousLanguageCounts[locale] : null,
    })),
    pages,
    detailRows: detailRows.sort((a, b) => a.day.localeCompare(b.day) || a.locale.localeCompare(b.locale) || a.page.localeCompare(b.page)),
  };
}
