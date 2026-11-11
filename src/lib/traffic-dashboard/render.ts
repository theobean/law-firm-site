type Locale = "el" | "en" | "de";

type CountRow = {
  day: string;
  locale: Locale;
  page: string;
  count: number;
};

const periods = [7, 30, 90] as const;
const languages: Record<Locale, string> = {
  el: "Ελληνικά",
  en: "Αγγλικά",
  de: "Γερμανικά",
};
const labels: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const number = new Intl.NumberFormat("el-GR");
const shortDate = new Intl.DateTimeFormat("el-GR", { day: "numeric", month: "short", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("el-GR", { dateStyle: "long", timeZone: "UTC" });
const basePath = "/private/traffic";

const css = `
  :root {
    --navy: #0d2d3a;
    --gold: #c8922a;
    --ink: #213643;
    --muted: #50616b;
    --line: #dce3e7;
    --paper: #f5f5f2;
    font: 1rem/1.5 system-ui, sans-serif;
    color: var(--ink);
    background: var(--paper);
  }
  * { box-sizing: border-box; }
  body { margin: 0; }
  main, .wrap { width: min(calc(100% - 2.25rem), 70rem); margin-inline: auto; }
  header { background: var(--navy); color: white; padding: 2.5rem 0 3.75rem; border-bottom: 3px solid var(--gold); }
  header p { margin: .6rem 0 0; color: #e2e9ec; }
  h1, h2, p { margin: 0; }
  h1, h2 { color: var(--navy); line-height: 1.2; font-family: Georgia, serif; }
  h1 { color: white; font-size: clamp(2rem, 5vw, 3.2rem); }
  h2 { font-size: clamp(1.25rem, 3vw, 1.65rem); }
  main { margin-block: -1.3rem 2.5rem; display: grid; gap: 1rem; }
  .card { background: white; border: 1px solid var(--line); border-radius: .65rem; min-width: 0; padding: clamp(1rem, 3vw, 1.5rem); }
  .controls { display: grid; gap: .8rem; grid-template-columns: 1fr 1fr minmax(0, 2fr) auto; align-items: end; }
  label { display: grid; min-width: 0; gap: .3rem; font-size: .875rem; font-weight: 700; }
  select, button { font: inherit; min-width: 0; min-height: 2.75rem; border-radius: .35rem; padding: .5rem .65rem; }
  select { width: 100%; color: var(--navy); border: 1px solid #acbbc3; background: white; }
  button { color: white; background: var(--navy); border: 1px solid var(--navy); cursor: pointer; font-weight: 700; padding-inline: .95rem; }
  a { color: var(--navy); text-underline-offset: .2em; }
  :focus-visible { outline: 3px solid #946000; outline-offset: 3px; }
  .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
  .total { font-size: clamp(1.6rem, 4vw, 2.25rem); line-height: 1.15; color: var(--navy); font-weight: 750; margin-bottom: .3rem; }
  .number { font-variant-numeric: tabular-nums; }
  .languages { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .45rem 1rem; margin: .45rem 0 0; }
  .languages dt { font-size: .78rem; color: var(--muted); }
  .languages dd { margin: 0; color: var(--navy); font-weight: 750; font-size: 1.25rem; }
  .muted, .range, .caption { color: var(--muted); }
  .caption { font-size: .9rem; margin-top: .45rem; }
  .chart { display: flex; align-items: end; gap: clamp(1px, .45vw, 6px); margin-top: 1.25rem; height: 8.5rem; padding: 0 0 2px; border-bottom: 1px solid var(--line); }
  .bar { flex: 1 1 0; min-width: 0; height: max(2px, var(--height)); background: var(--navy); border-radius: 2px 2px 0 0; }
  .bar-zero { background: #c5ced3; }
  .bar-active { background: var(--gold); }
  .chart-dates { display: flex; justify-content: space-between; font-size: .8rem; color: var(--muted); margin-top: .35rem; }
  .details { margin-top: 1rem; }
  summary { color: var(--navy); cursor: pointer; font-weight: 650; width: fit-content; }
  .table { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; margin-top: .65rem; font-size: .925rem; }
  th, td { text-align: start; padding: .6rem .4rem; border-bottom: 1px solid var(--line); }
  th { color: var(--navy); font-weight: 700; }
  tr:last-child td { border-bottom: 0; }
  .count { text-align: end; white-space: nowrap; }
  .page { overflow-wrap: anywhere; }
  .active-day { background: #f7edda; }
  .page-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: .5rem 1rem; }
  .empty { padding-block: 1rem .2rem; color: var(--muted); }
  @media (max-width: 42rem) {
    .controls { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .page-filter { grid-column: 1 / -1; }
    .controls button { grid-column: 1 / -1; }
    .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .6rem; }
    .language-summary { grid-column: 1 / -1; }
    .summary .card { padding: .75rem; }
    .summary p { font-size: .85rem; }
  }
  @media (max-width: 23rem) {
    main, .wrap { width: calc(100% - 1.25rem); }
  }
`;

function escape(value: string) {
  return value.replace(/[&<>"']/g, char => labels[char]);
}

function displayDate(day: string, formatter = fullDate) {
  return formatter.format(new Date(`${day}T12:00:00Z`));
}

export function dateRange(today: string, requested: string | null): string[] {
  const length = periods.find(days => String(days) === requested) ?? 30;
  const end = new Date(`${today}T12:00:00Z`);
  return Array.from({ length }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - length + index + 1);
    return date.toISOString().slice(0, 10);
  });
}

function option(value: string, label: string, active: string) {
  return `<option value="${escape(value)}"${value === active ? " selected" : ""}>${escape(label)}</option>`;
}

function document(content: string, subtitle?: string) {
  return `<!doctype html>
<html lang="el">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Επισκεψιμότητα | Παπαϊωάννου &amp; Συνεργάτες</title>
  <style>${css}</style>
</head>
<body>
  <header><div class="wrap">
    <h1>Επισκεψιμότητα</h1>
    ${subtitle ? `<p>${escape(subtitle)}</p>` : ""}
  </div></header>
  <main>${content}</main>
</body>
</html>`;
}

export function renderDashboardNotice(message: string) {
  return document(`<div class="card"><p>${escape(message)}</p></div>`);
}

export function renderDashboard(days: string[], params: URLSearchParams, rows: CountRow[]) {
  const period = String(days.length);
  const requestedLanguage = params.get("lang");
  const language = Object.keys(languages).find(key => key === requestedLanguage) ?? "";
  const languageRows = language ? rows.filter(row => row.locale === language) : rows;
  const pageOptions = Array.from(new Set(languageRows.map(row => row.page))).sort();
  const selectedPage = pageOptions.find(page => page === params.get("page")) ?? "";
  const visibleRows = selectedPage ? languageRows.filter(row => row.page === selectedPage) : languageRows;
  const selectedDay = days.find(day => day === params.get("day"));
  const daily = new Map(days.map(day => [day, 0]));
  const byLanguage: Record<Locale, number> = { el: 0, en: 0, de: 0 };
  const byPage = new Map<string, Omit<CountRow, "day">>();
  for (const row of visibleRows) {
    daily.set(row.day, (daily.get(row.day) ?? 0) + row.count);
    if (selectedDay && row.day !== selectedDay) continue;
    byLanguage[row.locale] += row.count;
    const key = `${row.locale}:${row.page}`;
    const previous = byPage.get(key);
    byPage.set(key, { locale: row.locale, page: row.page, count: (previous?.count ?? 0) + row.count });
  }

  const pageTotals = Array.from(byPage.values()).sort((a, b) => b.count - a.count || a.page.localeCompare(b.page));
  const total = Object.values(byLanguage).reduce((sum, count) => sum + count, 0);
  const peak = Math.max(1, ...daily.values());
  const range = `${displayDate(days[0])} – ${displayDate(days[days.length - 1])}`;

  function dayLink(day?: string) {
    const query = new URLSearchParams({ period });
    if (language) query.set("lang", language);
    if (selectedPage) query.set("page", selectedPage);
    if (day) query.set("day", day);
    return escape(`${basePath}?${query}#pages`);
  }

  const controls = `
  <form class="card controls" action="${basePath}" method="get" aria-label="Φίλτρα επισκεψιμότητας">
    <label>Περίοδος <select name="period">${periods.map(days => option(String(days), `Τελευταίες ${days} ημέρες`, period)).join("")}</select></label>
    <label>Γλώσσα <select name="lang">${option("", "Όλες οι γλώσσες", language)}${Object.entries(languages).map(([code, name]) => option(code, name, language)).join("")}</select></label>
    <label class="page-filter">Σελίδα <select name="page">${option("", "Όλες οι σελίδες", selectedPage)}${pageOptions.map(page => option(page, page, selectedPage)).join("")}</select></label>
    <button type="submit">Εφαρμογή</button>
  </form>`;

  const totals = `
  <div class="summary" aria-label="Σύνολα επιλεγμένης περιόδου ή ημέρας">
    <div class="card"><div class="total number">${number.format(total)}</div><p class="muted">Αιτήματα σελίδας</p></div>
    <div class="card"><div class="total number">${number.format(new Set(pageTotals.map(row => row.page)).size)}</div><p class="muted">Σελίδες με κίνηση</p></div>
    <div class="card language-summary">
      <p class="muted">Αιτήματα ανά γλώσσα</p>
      <dl class="languages">${(Object.keys(languages) as Locale[]).map(locale => `<div><dt>${languages[locale]}</dt><dd class="number">${number.format(byLanguage[locale])}</dd></div>`).join("")}</dl>
    </div>
  </div>`;

  const chart = `
  <section class="card" aria-labelledby="daily-title">
    <h2 id="daily-title">Κίνηση ανά ημέρα</h2>
    <p class="caption">Ώρα Ελλάδας. Άνοιξε τον πίνακα για να δεις τις σελίδες μιας ημέρας.</p>
    <div class="chart" aria-hidden="true">
      ${days.map(day => {
        const count = daily.get(day) ?? 0;
        const variant = day === selectedDay ? " bar-active" : count === 0 ? " bar-zero" : "";
        return `<div class="bar${variant}" style="--height:${100 * count / peak}%" title="${escape(displayDate(day))} · ${number.format(count)}"></div>`;
      }).join("")}
    </div>
    <div class="chart-dates" aria-hidden="true">
      <span>${displayDate(days[0], shortDate)}</span>
      <span>${displayDate(days[days.length - 1], shortDate)}</span>
    </div>
    <details class="details"${selectedDay ? " open" : ""}>
      <summary>Ημερήσια σύνολα</summary>
      <div class="table"><table>
        <thead><tr><th scope="col">Ημέρα</th><th scope="col" class="count">Αιτήματα</th></tr></thead>
        <tbody>${days.slice().reverse().map(day => `<tr${day === selectedDay ? ' class="active-day"' : ""}>
          <td><a href="${dayLink(day)}"${day === selectedDay ? ' aria-current="true"' : ""}>${displayDate(day)}</a></td>
          <td class="count number">${number.format(daily.get(day) ?? 0)}</td>
        </tr>`).join("")}</tbody>
      </table></div>
    </details>
  </section>`;

  const pageTable = pageTotals.length > 0
    ? `<div class="table"><table>
        <thead><tr><th scope="col">Σελίδα</th><th scope="col">Γλώσσα</th><th scope="col" class="count">Αιτήματα</th></tr></thead>
        <tbody>${pageTotals.map(row => `<tr>
          <td class="page">${escape(row.page)}</td><td>${languages[row.locale]}</td><td class="count number">${number.format(row.count)}</td>
        </tr>`).join("")}</tbody>
      </table></div>`
    : '<p class="empty">Δεν υπάρχουν καταγεγραμμένα αιτήματα για την επιλογή σου.</p>';

  const pages = `
  <section id="pages" class="card" aria-labelledby="pages-title">
    <div class="page-heading">
      <h2 id="pages-title">Σελίδες και γλώσσες</h2>
      ${selectedDay ? `<a href="${dayLink()}">Εμφάνιση όλης της περιόδου</a>` : ""}
    </div>
    <p class="caption">${selectedDay ? displayDate(selectedDay) : range}</p>
    ${pageTable}
  </section>`;

  return document(`${controls}${totals}${chart}${pages}
    <p class="caption">Ο μετρητής αθροίζει αιτήματα για δημόσιες σελίδες. Μία επαναφόρτωση μπορεί να προσθέσει άλλο ένα αίτημα.</p>`,
    selectedDay ? displayDate(selectedDay) : range);
}
