export function getReportStyles() {
  return `
  /* Updated classic report style */
  body {
    font-family: "Garamond", serif;
    max-width: 50em;
    margin: 2rem auto;
    padding: 2rem;
    background: #fffdf7; /* warm, off-white paper tone */
    color: #222;
    line-height: 1.8;
  }
  h1, h2, h3 {
    font-family: "Baskerville", "Times New Roman", serif;
    margin-bottom: 0.75em;
    color: #111;
  }
  #scrollto {
    display: block;
    margin-top: 1.5em;
  }
  pre.debug {
    font-size: 0.8em;
    background: #f5f5f5;
    padding: 1em;
    border: 1px solid #ccc;
    overflow-x: auto;
  }
  .previous-report {
    margin-top: 2em;
    font-style: italic;
    border-top: 1px solid #aaa;
    padding-top: 0.75em;
  }
  .stats-data {
    margin-top: 2.5em;
    background: #fbfaf4;
    padding: 1.5em;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  .stats-columns {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5em;
  }
  .stats-column {
    flex: 1;
    min-width: 250px;
  }
  .stats-pre {
    font-family: "Courier New", monospace;
    font-size: 1.5em;
    line-height: 1.4;
    overflow-x: auto;
    background: #fff;
    padding: 0.75em;
    border: 1px solid #ccc;
  }
  `;
} 