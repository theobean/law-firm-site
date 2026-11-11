export const dashboardStyles = `
  :root {
    --navy: #0d2d3a;
    --navy-deep: #0a2430;
    --gold: #c8922a;
    --ink: #172d3a;
    --muted: #526674;
    --line: #e0e7eb;
    --paper: #f4f6f7;
    --positive: #146044;
    --negative: #96382c;
    font: 1rem/1.45 system-ui, sans-serif;
    color: var(--ink);
    background: var(--paper);
    color-scheme: light;
  }
  * { box-sizing: border-box; }
  body, h1, h2, p, dl, dd { margin: 0; }
  .wrap, main { width: min(calc(100% - 3rem), 76rem); margin-inline: auto; }
  .hero { background: linear-gradient(115deg, var(--navy-deep), #154254); border-bottom: 2px solid var(--gold); color: white; }
  .hero .wrap { display: flex; justify-content: space-between; align-items: end; gap: 1.25rem; padding-block: clamp(1.75rem, 4vw, 3.25rem) clamp(2.4rem, 4vw, 3.9rem); }
  .brand { color: #ebcf9b; font-size: .85rem; font-weight: 650; margin-bottom: .5rem; }
  h1 { font: 700 clamp(2rem, 5vw, 3.15rem)/1.12 Georgia, serif; }
  h2 { color: var(--navy); font-size: clamp(1.12rem, 2.5vw, 1.38rem); line-height: 1.25; }
  .hero-range { color: #d9e5eb; margin-top: .55rem; font-size: .93rem; }
  main { display: grid; min-width: 0; gap: 1rem; margin-block: -1.15rem 2.5rem; }
  .card { background: white; border: 1px solid var(--line); border-radius: .7rem; min-width: 0; padding: clamp(.9rem, 2.5vw, 1.4rem); box-shadow: 0 1px 3px #0d2d3a08; }
  .number { font-variant-numeric: tabular-nums; }
  .muted { color: var(--muted); }
  .caption { color: var(--muted); font-size: .875rem; }
  .section-heading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: start; gap: .65rem 1.25rem; }
  .section-heading p { margin-top: .3rem; }
  .controls { display: grid; gap: .85rem; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr) auto; align-items: end; }
  label { display: grid; min-width: 0; gap: .35rem; font-size: .84rem; font-weight: 680; }
  select, input[type="date"], button, .button { font: inherit; min-width: 0; min-height: 2.7rem; border-radius: .4rem; padding: .53rem .65rem; }
  select, input[type="date"] { width: 100%; color: var(--navy); border: 1px solid #b6c5cd; background: white; font-size: .9rem; }
  button, .button { display: inline-flex; align-items: center; justify-content: center; background: var(--navy); color: white; border: 1px solid var(--navy); cursor: pointer; font-size: .9rem; font-weight: 700; padding-inline: .9rem; text-decoration: none; }
  button:hover, .button:hover { background: #17495d; }
  .export { background: #f5e6c7; border-color: #f5e6c7; color: var(--navy-deep); white-space: nowrap; }
  .export:hover { background: #faefd9; }
  .subtle-button { border-color: #c7d5dd; background: #f8fafb; color: var(--navy); }
  .subtle-button:hover { background: #edf4f7; }
  a { color: #16536d; text-underline-offset: .18em; }
  :focus-visible { outline: 2px solid #9d6813; outline-offset: 3px; }
  .hero :focus-visible { outline-color: #ffe0a7; }
  .custom-range { grid-column: 1 / -1; display: grid; gap: .65rem .85rem; grid-template-columns: repeat(2, minmax(0, 11rem)); align-items: end; border-top: 1px solid var(--line); padding-top: .85rem; }
  .custom-range .caption { grid-column: 1 / -1; }
  @supports selector(:has(option:checked)) {
    .controls:not(:has(option[value="custom"]:checked)) .custom-range { display: none; }
  }
  .day-selection { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .45rem 1rem; background: #faf3e3; color: #5e4117; border: 1px solid #ecd9af; border-radius: .5rem; padding: .6rem .9rem; margin-top: .8rem; font-size: .88rem; }
  .day-selection a { color: #594018; font-weight: 700; }
  .coverage { color: #4c5e68; border-left: 3px solid #bd8e39; padding-left: .7rem; }
  .summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .85rem; }
  .kpi { display: grid; gap: .35rem; align-content: start; }
  .kpi-label { font-weight: 670; font-size: .88rem; color: var(--muted); }
  .total { font-size: clamp(1.45rem, 3vw, 2.15rem); line-height: 1.05; color: var(--navy); font-weight: 790; letter-spacing: -.04em; }
  .kpi-note { color: var(--muted); font-size: .77rem; }
  .change { display: inline-block; color: var(--muted); font-weight: 700; }
  .change-up { color: var(--positive); }
  .change-down { color: var(--negative); }
  .plot { margin-top: 1rem; display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: .5rem; }
  .plot-y { display: flex; flex-direction: column; justify-content: space-between; align-items: end; height: 10rem; padding-block: .05rem; color: var(--muted); font-size: .76rem; line-height: 1; }
  .plot-scroll { overflow-x: auto; direction: rtl; }
  .plot-inner { direction: ltr; min-width: min(max(var(--plot-width), 100%), 1400px); }
  .bars { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: var(--bar-gap, 2px); align-items: end; height: 10rem; border-bottom: 1px solid #d6e1e7; background: repeating-linear-gradient(to bottom, #e5edf1 0 1px, transparent 1px 25%); }
  .bar-slot { position: relative; display: flex; align-items: end; justify-content: center; height: 100%; min-width: 0; }
  .bar { display: block; width: 100%; max-width: 4rem; height: max(2px, var(--height)); border-radius: 3px 3px 0 0; background: #215670; }
  .bar-zero { background: #bfcbd1; }
  .bar-active { background: var(--gold); }
  .bar-missing { background: repeating-linear-gradient(135deg, #edf1f3 0 3px, transparent 3px 7px); }
  .bar-previous { position: absolute; inset-inline: 0; bottom: var(--previous); height: 2px; background: #b16d2b; }
  .plot-x { display: flex; justify-content: space-between; gap: .25rem; padding-block: .35rem .15rem; color: var(--muted); font-size: .75rem; }
  .legend { display: flex; flex-wrap: wrap; gap: .4rem 1rem; margin-top: .85rem; font-size: .78rem; color: var(--muted); }
  .legend span { display: inline-flex; gap: .4rem; align-items: center; }
  .swatch { width: .8rem; height: .55rem; border-radius: .12rem; background: #215670; }
  .swatch-previous { height: 2px; background: #b16d2b; }
  .swatch-missing { border: 1px solid #dbe3e7; background: repeating-linear-gradient(135deg, #dbe3e7 0 2px, transparent 2px 4px); }
  .details { margin-top: 1rem; border-top: 1px solid var(--line); padding-top: .75rem; }
  summary { color: var(--navy); cursor: pointer; font-size: .9rem; font-weight: 700; width: fit-content; }
  .columns { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 8fr); gap: 1rem; align-items: start; }
  .language-list { display: grid; gap: .8rem; margin-top: .95rem; }
  .language-row { display: grid; grid-template-columns: 1fr auto; gap: .35rem .5rem; font-size: .88rem; align-items: baseline; }
  .language-row dt { font-weight: 700; }
  .language-row dd { color: var(--muted); white-space: nowrap; }
  .language-row strong { color: var(--ink); }
  .language-row [data-previous] { grid-column: 1 / -1; }
  .meter { grid-column: 1 / -1; height: .42rem; overflow: hidden; border-radius: .3rem; background: #edf1f3; }
  .meter span { display: block; width: var(--share); height: 100%; border-radius: inherit; background: #215670; }
  .locale-en .meter span { background: #52796b; }
  .locale-de .meter span { background: #b47d22; }
  .day-filter { display: flex; flex-wrap: wrap; gap: .5rem; align-items: end; }
  .day-filter input { width: auto; max-width: 100%; }
  .day-filter button { min-height: 2.7rem; }
  .table { overflow-x: auto; margin-top: .6rem; }
  table { width: 100%; border-collapse: collapse; font-size: .86rem; }
  th, td { text-align: start; padding: .55rem .4rem; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { color: var(--navy); font-weight: 700; background: #f6f8fa; }
  tbody tr:last-child td { border-bottom: 0; }
  .count { text-align: end; white-space: nowrap; }
  .rank { width: 2.1rem; color: var(--muted); }
  .page { overflow-wrap: anywhere; color: var(--navy); font-weight: 630; }
  .locale { white-space: nowrap; }
  .locale-badge { display: inline-block; padding: .12rem .34rem; border-radius: .2rem; background: #eaf1f5; color: #1c485d; font-size: .74rem; font-weight: 720; }
  .locale-badge.locale-en { background: #eaf1ed; color: #285745; }
  .locale-badge.locale-de { background: #faf0db; color: #664714; }
  .active-day td { background: #faf3e3; }
  tr[data-recorded="false"] { color: var(--muted); }
  .secondary-number { display: block; font-size: .73rem; color: var(--muted); }
  .empty { padding-top: .8rem; color: var(--muted); font-size: .9rem; }
  .method { display: grid; gap: .4rem; padding: .25rem .2rem; }
  @media (max-width: 57rem) {
    .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .kpi-bounce { grid-column: 1 / -1; }
    .columns { grid-template-columns: minmax(0, 1fr); }
    .language-list { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .language-row { gap: .3rem; }
  }
  @media (max-width: 43rem) {
    .wrap, main { width: calc(100% - 1.6rem); }
    .hero .wrap { flex-wrap: wrap; gap: .85rem; }
    .hero .export { min-height: 2.4rem; }
    .controls { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; }
    .controls button { grid-column: 1 / -1; }
    .page-filter { grid-column: 1 / -1; }
    .custom-range { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .6rem; }
    .summary { gap: .65rem; }
    .plot-y, .bars { height: 8rem; }
    .plot-x span:nth-child(even) { display: none; }
    .plot-x span:last-child { display: inline; }
    .language-list { grid-template-columns: minmax(0, 1fr); gap: .7rem; }
    .rank { display: none; }
  }
  @media (max-width: 23rem) {
    .wrap, main { width: calc(100% - 1.15rem); }
    .controls { grid-template-columns: minmax(0, 1fr); }
    table { font-size: .78rem; }
    th, td { padding-inline: .26rem; }
    .day-filter button { flex: 1; }
  }
`;
