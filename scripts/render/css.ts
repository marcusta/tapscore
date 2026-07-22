// Shared CSS for index + round HTML pages.

export const ROUND_CSS = `
  :root { color-scheme: light dark; --muted: #888; --dim: #bbb; --border: #d0d0d0; --sum-bg: #f3f3f3; --link: #0366d6; }
  @media (prefers-color-scheme: dark) { :root { --border: #333; --sum-bg: #222; --dim: #555; --link: #58a6ff; } }
  body { font: 13px/1.4 -apple-system, system-ui, sans-serif; margin: 2rem; max-width: 1400px; }
  h1 { margin: 0 0 .25rem 0; }
  h1 .sub { font-size: .6em; color: var(--muted); font-weight: normal; }
  h2 { margin-top: 2rem; border-bottom: 1px solid var(--border); padding-bottom: .25rem; }
  section { margin-bottom: 2rem; }
  table { border-collapse: collapse; }
  .scorecard, .grid, .kv { border: 1px solid var(--border); }
  .scorecard th, .scorecard td { border: 1px solid var(--border); padding: 4px 8px; text-align: center; min-width: 28px; }
  .scorecard .rowlabel { text-align: left; background: var(--sum-bg); font-weight: 600; }
  .scorecard .sum { background: var(--sum-bg); font-weight: 600; }
  .scorecard .si, .scorecard .given { color: var(--muted); font-size: 11px; }
  .scorecard .category { color: var(--link); font-size: 12px; }
  .scorecard .dim td { color: var(--muted); }
  .grid th, .grid td { border: 1px solid var(--border); padding: 4px 8px; text-align: left; vertical-align: top; }
  .grid th { background: var(--sum-bg); }
  .kv th, .kv td { border: 1px solid var(--border); padding: 4px 8px; text-align: left; }
  .kv th { background: var(--sum-bg); min-width: 120px; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .muted { color: var(--muted); }
  .dnp { color: var(--dim); }
  .pickup { color: #c00; font-weight: bold; }
  .arithmetic { font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: var(--muted); }
  .arithmetic .match { color: inherit; font-weight: 700; }
  .hint { color: var(--muted); font-size: 12px; }
  .scorecard-card { border: 1px solid var(--border); padding: 1rem; margin-bottom: 1rem; border-radius: 6px; }
  .scorecard-card--compact-match { border-color: #a77; }
  .scorecard-card--category-matrix .scorecard th,
  .scorecard-card--category-matrix .scorecard td { padding-left: 5px; padding-right: 5px; }
  .scorecard-card header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .5rem; }
  .scorecard-card h3 { margin: 0; }
  .mark { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; min-width: 1.6em; height: 1.6em; border: 2px solid currentColor; border-radius: 999px; position: relative; }
  .mark--double_ring { border-width: 3px; border-style: double; }
  .mark--diamond { border: none; }
  .mark--diamond::before { content: ''; position: absolute; left: 50%; top: 50%; width: 1.15em; height: 1.15em; transform: translate(-50%, -50%) rotate(45deg); border: 2px solid currentColor; }
  .mark--square { border-radius: 3px; }
  .mark--double_square { border-radius: 3px; border-width: 3px; border-style: double; }
  .mark--badge { width: auto; min-width: 1.8em; padding-left: .45em; padding-right: .45em; border-radius: 999px; }
  .mark--box_badge { width: auto; min-width: 1.8em; padding-left: .45em; padding-right: .45em; border-radius: 3px; }
  .mark-tone--success { color: #267348; }
  .mark-tone--warning { color: #946200; }
  .mark-tone--danger { color: #9b332a; }
  .pill { display: inline-block; min-width: 1.4em; padding: .05em .45em; border-radius: 999px; color: #fff; font-weight: 700; }
  .pill--a { background: #c2452f; }
  .pill--b { background: #2c6cae; }
  .pill .mark { color: #fff; }
  .totals { list-style: none; padding: 0; margin: .5rem 0 0 0; display: flex; gap: 1rem; }
  .lb-row { display: flex; gap: 2rem; flex-wrap: wrap; }
  .lb-col { min-width: 320px; }
  .lb-slot { margin-bottom: 1.5rem; }
  .lb-slot h3 { font-size: 1em; margin: .25rem 0 .5rem 0; color: var(--muted); font-weight: 600; border-bottom: 1px dashed var(--border); padding-bottom: .25rem; }
  .lb-slot h4 { font-size: .9em; margin: 0 0 .25rem 0; text-transform: lowercase; }
  a { color: var(--link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: var(--muted); }
`;
