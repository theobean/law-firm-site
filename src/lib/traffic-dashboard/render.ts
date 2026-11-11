import type { TrafficLocale } from "../traffic";
import { trafficPeriods, type TrafficReport } from "./report";
import { dashboardStyles } from "./styles";

const basePath = "/private/traffic";
const languages: Record<TrafficLocale, string> = {
  el: "Ελληνικά",
  en: "Αγγλικά",
  de: "Γερμανικά",
};
const languageCodes: Record<TrafficLocale, string> = { el: "EL", en: "EN", de: "DE" };
const escaped: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const number = new Intl.NumberFormat("el-GR", { maximumFractionDigits: 1 });
const percentage = new Intl.NumberFormat("el-GR", { style: "percent", maximumFractionDigits: 1 });
const signed = new Intl.NumberFormat("el-GR", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});
const shortDate = new Intl.DateTimeFormat("el-GR", { day: "numeric", month: "short", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("el-GR", { dateStyle: "long", timeZone: "UTC" });

function escape(value: string) {
  return value.replace(/[&<>"']/g, char => escaped[char]);
}

function displayDate(day: string, formatter = fullDate) {
  return formatter.format(new Date(`${day}T12:00:00Z`));
}

function dateLabel(from: string, to: string) {
  return from === to ? displayDate(from) : `${displayDate(from)} – ${displayDate(to)}`;
}

function option(value: string, label: string, active: string) {
  return `<option value="${escape(value)}"${value === active ? " selected" : ""}>${escape(label)}</option>`;
}

function document(content: string, subtitle?: string, exportUrl?: string) {
  return `<!doctype html>
<html lang="el">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Επισκεψιμότητα | Παπαϊωάννου &amp; Συνεργάτες</title>
  <style>${dashboardStyles}</style>
</head>
<body>
  <header class="hero"><div class="wrap">
    <div>
      <p class="brand">Παπαϊωάννου &amp; Συνεργάτες</p>
      <h1>Επισκεψιμότητα</h1>
      ${subtitle ? `<p class="hero-range">${escape(subtitle)}</p>` : ""}
    </div>
    ${exportUrl ? `<a class="button export" href="${exportUrl}">Λήψη CSV</a>` : ""}
  </div></header>
  <main>${content}</main>
</body>
</html>`;
}

export function renderDashboardNotice(message: string) {
  return document(`<div class="card"><p>${escape(message)}</p></div>`);
}

function filterQuery(filters: TrafficReport["filters"], day = filters.day) {
  const query = new URLSearchParams({ period: filters.period });
  if (filters.period === "custom") {
    query.set("from", filters.from);
    query.set("to", filters.to);
  }
  if (filters.lang) query.set("lang", filters.lang);
  if (filters.page) query.set("page", filters.page);
  if (day) query.set("day", day);
  return query;
}

function dayLink(filters: TrafficReport["filters"], day = "") {
  return escape(`${basePath}?${filterQuery(filters, day)}#pages`);
}

function difference(current: number, previous: number) {
  if (current === previous) return '<span class="change">0%</span>';
  const direction = current > previous ? "up" : "down";
  const value = previous === 0 ? `+${number.format(current)}` : signed.format((current - previous) / previous);
  return `<span class="change change-${direction}">${value}</span>`;
}

function renderFilters(report: TrafficReport, today: string) {
  const { filters, pageOptions } = report;
  const options = filters.page && !pageOptions.includes(filters.page)
    ? [filters.page, ...pageOptions]
    : pageOptions;
  return `
  <form class="card controls" action="${basePath}" method="get" aria-label="Φίλτρα επισκεψιμότητας">
    <label>Περίοδος <select name="period">${trafficPeriods.map(days => option(String(days), `Τελευταίες ${days} ημέρες`, filters.period)).join("")}${option("custom", "Προσαρμοσμένο εύρος", filters.period)}</select></label>
    <label>Γλώσσα <select name="lang">${option("", "Όλες οι γλώσσες", filters.lang)}${Object.entries(languages).map(([code, name]) => option(code, name, filters.lang)).join("")}</select></label>
    <label class="page-filter">Σελίδα <select name="page">${option("", "Όλες οι σελίδες", filters.page)}${options.map(page => option(page, page, filters.page)).join("")}</select></label>
    <button type="submit">Εφαρμογή</button>
    <div class="custom-range">
      <label>Από <input name="from" type="date" value="${escape(filters.from)}" max="${escape(today)}"></label>
      <label>Έως <input name="to" type="date" value="${escape(filters.to)}" max="${escape(today)}"></label>
      <p class="caption">Διάλεξε ημερομηνίες και πάτησε «Εφαρμογή».</p>
    </div>
  </form>`;
}

function renderSummary(report: TrafficReport) {
  const { filters, total, previousTotal, average, recordedDays, activeDays, activePages, peak } = report;
  const hasCoverage = filters.day
    ? report.daily.some(row => row.day === filters.day && row.recorded)
    : recordedDays > 0;
  const totalNote = previousTotal === null
    ? hasCoverage ? "Στην επιλεγμένη περίοδο" : "Χωρίς μέτρηση για την επιλογή"
    : `<span data-previous="${previousTotal}">${difference(total, previousTotal)} · ${number.format(previousTotal)} προηγουμένως</span>`;
  const averageNote = filters.day
    ? "Για την επιλεγμένη ημέρα"
    : `${number.format(recordedDays)} ημέρες μέτρησης · ${number.format(activeDays)} με αιτήματα`;

  return `
  <section class="summary" aria-label="Σύνοψη επισκεψιμότητας">
    <div class="card kpi" data-kpi="total"><p class="kpi-label">Αιτήματα σελίδας</p>
      <p class="total number">${hasCoverage ? number.format(total) : "—"}</p><p class="kpi-note">${totalNote}</p></div>
    <div class="card kpi" data-kpi="average"><p class="kpi-label">Μέσος όρος ανά ημέρα</p>
      <p class="total number">${average === null ? "—" : number.format(average)}</p><p class="kpi-note">${averageNote}</p></div>
    <div class="card kpi" data-kpi="active-pages"><p class="kpi-label">Σελίδες με κίνηση</p>
      <p class="total number">${hasCoverage ? number.format(activePages) : "—"}</p><p class="kpi-note">Ξεχωριστά ανά γλώσσα</p></div>
    <div class="card kpi" data-kpi="peak"><p class="kpi-label">Υψηλότερη ημερήσια κίνηση</p>
      <p class="total number">${peak ? number.format(peak.total) : "—"}</p><p class="kpi-note">${peak ? displayDate(peak.day) : "Χωρίς καταγεγραμμένα αιτήματα"}</p></div>
  </section>`;
}

function renderDaily(report: TrafficReport, today: string) {
  const { daily, filters } = report;
  const hasComparison = daily.some(row => row.previousTotal !== null);
  const hasGaps = daily.some(row => !row.recorded);
  const maximum = Math.max(1, ...daily.map(row => Math.max(row.total, row.previousTotal ?? 0)));
  const step = Math.ceil(maximum / 4);
  const scale = step * 4;
  const tickCount = Math.min(daily.length, daily.length <= 7 ? daily.length : 5);
  const ticks = Array.from({ length: tickCount }, (_, index) => {
    const day = daily[Math.round(index * (daily.length - 1) / Math.max(1, tickCount - 1))].day;
    return `<span>${displayDate(day, shortDate)}</span>`;
  }).join("");
  const plotWidth = daily.length > 30 ? daily.length * 4 : 0;
  return `
  <section class="card" aria-labelledby="daily-title">
    <div class="section-heading">
      <div><h2 id="daily-title">Κίνηση ανά ημέρα</h2>
        <p class="caption">Ώρα Ελλάδας${filters.to === today ? " · Η σημερινή ημέρα είναι σε εξέλιξη" : ""}</p></div>
    </div>
    <div class="plot" aria-hidden="true" style="--plot-width:${plotWidth}px;--bar-gap:${daily.length > 90 ? 1 : 3}px">
      <div class="plot-y">${[4, 3, 2, 1, 0].map(tick => `<span>${number.format(tick * step)}</span>`).join("")}</div>
      <div class="plot-scroll">
        <div class="plot-inner">
          <div class="bars">${daily.map(row => {
            const label = `${displayDate(row.day)} · ${row.recorded ? number.format(row.total) + " αιτήματα" : "Χωρίς μέτρηση"}`;
            const barClass = row.day === filters.day ? " bar-active" : row.total === 0 ? " bar-zero" : "";
            return `<div class="bar-slot${row.recorded ? "" : " bar-missing"}" title="${escape(label)}">
              ${row.recorded ? `<span class="bar${barClass}" style="--height:${100 * row.total / scale}%"></span>` : ""}
              ${row.previousTotal === null ? "" : `<span class="bar-previous" style="--previous:${100 * row.previousTotal / scale}%"></span>`}
            </div>`;
          }).join("")}</div>
          <div class="plot-x">${ticks}</div>
        </div>
      </div>
    </div>
    <div class="legend" aria-hidden="true">
      <span><i class="swatch"></i>Αιτήματα</span>
      ${hasComparison ? '<span><i class="swatch swatch-previous"></i>Προηγούμενη περίοδος</span>' : ""}
      ${hasGaps ? '<span><i class="swatch swatch-missing"></i>Χωρίς μέτρηση</span>' : ""}
    </div>
    <details class="details" id="daily-totals"${filters.day ? " open" : ""}>
      <summary>Πίνακας ημερήσιων συνόλων</summary>
      <p class="caption">Επίλεξε ημερομηνία για να δεις την ανάλυση των σελίδων της.</p>
      <div class="table"><table>
        <thead><tr><th scope="col">Ημέρα</th><th scope="col" class="count">Αιτήματα</th>${hasComparison ? '<th scope="col" class="count">Προηγούμενη περίοδος</th>' : ""}</tr></thead>
        <tbody>${daily.slice().reverse().map(row => `<tr data-recorded="${row.recorded}"${row.day === filters.day ? ' class="active-day"' : ""}>
          <td><a href="${dayLink(filters, row.day)}"${row.day === filters.day ? ' aria-current="date"' : ""}>${displayDate(row.day)}</a></td>
          <td class="count number">${row.recorded ? number.format(row.total) : "Χωρίς μέτρηση"}</td>
          ${hasComparison ? `<td class="count number" data-previous="${row.previousTotal ?? ""}">${row.previousTotal === null ? "—" : number.format(row.previousTotal)}</td>` : ""}
        </tr>`).join("")}</tbody>
      </table></div>
    </details>
  </section>`;
}

function renderLanguages(report: TrafficReport) {
  const hasCoverage = report.recordedDays > 0;
  return `
  <section class="card" aria-labelledby="language-title">
    <h2 id="language-title">Γλώσσες</h2>
    <p class="caption">Μερίδιο ανά γλωσσική έκδοση</p>
    <dl class="language-list">${report.languageTotals.map(({ locale, total, share, previousTotal }) => `
      <div class="language-row locale-${locale}">
        <dt>${languages[locale]}</dt>
        <dd class="number">${hasCoverage ? `<strong>${number.format(total)}</strong> · ${percentage.format(share)}` : "—"}</dd>
        ${hasCoverage ? `<dd class="meter" aria-hidden="true"><span style="--share:${100 * share}%"></span></dd>` : ""}
        ${previousTotal === null ? "" : `<dd class="secondary-number" data-previous="${previousTotal}">${difference(total, previousTotal)} · ${number.format(previousTotal)} προηγουμένως</dd>`}
      </div>`).join("")}
    </dl>
  </section>`;
}

function renderPages(report: TrafficReport) {
  const { pages, filters } = report;
  const hasComparison = pages.some(row => row.previousTotal !== null);
  const hiddenFilters = Array.from(filterQuery(filters, ""), ([key, value]) =>
    `<input type="hidden" name="${escape(key)}" value="${escape(value)}">`,
  ).join("");
  const rows = pages.length
    ? `<div class="table"><table>
        <thead><tr><th scope="col" class="rank">#</th><th scope="col">Σελίδα</th><th scope="col">Γλώσσα</th><th scope="col" class="count">Αιτήματα</th>${hasComparison ? '<th scope="col" class="count" title="Προηγούμενη περίοδος">Προηγ.</th>' : ""}</tr></thead>
        <tbody>${pages.map((row, index) => {
          const path = `/${row.locale}${row.page === "/" ? "" : row.page}`;
          return `<tr>
            <td class="rank">${number.format(index + 1)}</td>
            <td class="page">${escape(path)}</td>
            <td class="locale"><span class="locale-badge locale-${row.locale}" aria-label="${languages[row.locale]}">${languageCodes[row.locale]}</span></td>
            <td class="count number">${number.format(row.total)}<small class="secondary-number">${percentage.format(row.share)}</small></td>
            ${hasComparison ? `<td class="count number" data-previous="${row.previousTotal ?? ""}">${row.previousTotal === null ? "—" : `${number.format(row.previousTotal)}<small class="secondary-number">${difference(row.total, row.previousTotal)}</small>`}</td>` : ""}
          </tr>`;
        }).join("")}</tbody>
      </table></div>`
    : '<p class="empty">Δεν υπάρχουν αιτήματα για την επιλογή σου.</p>';

  return `
  <section id="pages" class="card" aria-labelledby="pages-title">
    <div class="section-heading">
      <div><h2 id="pages-title">Σελίδες και γλώσσες</h2>
        <p class="caption">${filters.day ? displayDate(filters.day) : dateLabel(filters.from, filters.to)}</p></div>
      <form class="day-filter" action="${basePath}#pages" method="get" aria-label="Ανάλυση συγκεκριμένης ημέρας">
        ${hiddenFilters}
        <label>Ημέρα <input type="date" name="day" value="${escape(filters.day)}" min="${escape(filters.from)}" max="${escape(filters.to)}" required></label>
        <button class="subtle-button" type="submit">Προβολή</button>
      </form>
    </div>
    ${filters.day ? `<p class="day-selection">Επιλεγμένη ημέρα · ${displayDate(filters.day)} <a href="${dayLink(filters)}">Όλη η περίοδος</a></p>` : ""}
    ${rows}
  </section>`;
}

export function renderDashboard(report: TrafficReport, today: string, invalidRange = false) {
  const { filters, firstRecordedDay, previousTotal } = report;
  const query = filterQuery(filters);
  query.set("format", "csv");
  const exportUrl = escape(`${basePath}?${query}`);
  const comparison = previousTotal === null
    ? ""
    : filters.day ? "Σύγκριση με την αντίστοιχη ημέρα της προηγούμενης περιόδου."
      : `Σύγκριση με ${dateLabel(filters.previousFrom, filters.previousTo)}.`;
  let coverage = "";
  if (firstRecordedDay === null) {
    coverage = "Η καταγραφή ενεργοποιήθηκε. Τα πρώτα σύνολα θα εμφανιστούν όταν φτάσουν αιτήματα για δημόσιες σελίδες.";
  } else if (firstRecordedDay > filters.from) {
    coverage = `Η καταγραφή ξεκίνησε στις ${displayDate(firstRecordedDay)}. Οι προγενέστερες ημερομηνίες εμφανίζονται ως «Χωρίς μέτρηση».`;
  }

  return document(`
    ${renderFilters(report, today)}
    ${invalidRange ? '<p class="caption coverage" role="status">Το εύρος ημερομηνιών δεν είναι έγκυρο. Εμφανίζονται οι τελευταίες 30 ημέρες.</p>' : ""}
    ${coverage ? `<p class="caption coverage">${escape(coverage)}</p>` : ""}
    ${renderSummary(report)}
    ${comparison ? `<p class="caption">${escape(comparison)}</p>` : ""}
    ${renderDaily(report, today)}
    <div class="columns">${renderLanguages(report)}${renderPages(report)}</div>
    <p class="caption method">Μετράμε τις φορτώσεις και τις εσωτερικές μεταβάσεις σε δημόσιες σελίδες. Μια επαναφόρτωση μπορεί να προσθέσει μία προβολή.</p>`,
    filters.day ? displayDate(filters.day) : dateLabel(filters.from, filters.to),
    exportUrl,
  );
}
