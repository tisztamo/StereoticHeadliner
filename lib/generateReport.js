import fs from 'fs';
import path from 'path';
import { slugify } from './utils.js';
import { readPreviousReport } from './readPreviousReport.js';

export function generateHTMLReport({ hook, analysis, summary, debugLogs, statsData }) {
  // Clean up the hook title by removing *, #, and spaces from beginning and end
  const cleanedHook = hook.trim().replace(/^[*#\s]+|[*#\s]+$/g, '');
  
  const now = new Date();
  const fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${slugify(cleanedHook)}.html`;
  
  // Format timestamp with minutes resolution in GMT
  const timestamp = `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 16)} GMT`;

  // Ensure reports directory exists
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Read previous report details if available
  const previousReport = readPreviousReport();
  const previousReportSection = previousReport ? 
    `  <section class="previous-report">
    <p><strong>Previous Report:</strong> <a href="${previousReport.permalink}">${previousReport.title}</a></p>
  </section>
` : '';

  // Format the stats data for HTML display
  let statsHtml = '';
  if (statsData) {
    // Extract the parts and clean up the prefix
    const parts = statsData.split('Top by 4h Change:');
    let topByRankData = parts[0].replace(/^Top by Rank:\s*\n/i, ''); // Remove the "Top by Rank:" prefix
    let topByChangeData = parts[1] ? parts[1].trim() : ''; // Trim to remove empty lines at beginning
    
    statsHtml = `
  <section class="stats-data">
    <h2>Market Statistics</h2>
    <div class="stats-columns">
      <div class="stats-column">
        <h3>Top by Rank</h3>
        <pre class="stats-pre">${topByRankData.replace(/\n/g, '<br>').replace(/(\w+): ([\d.$%-]+)/g, '$1: <span class="stats-number">$2</span>')}</pre>
      </div>
      <div class="stats-column">
        <h3>Top by 4h Change</h3>
        <pre class="stats-pre">${topByChangeData.replace(/\n/g, '<br>').replace(/(\w+): ([\d.$%-]+)/g, '$1: <span class="stats-number">$2</span>')}</pre>
      </div>
    </div>
  </section>`;
  }

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${cleanedHook}</title>
<style>
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
</style>
</head>
<body>
  ${previousReportSection}
  <h1 id="scrollto">${cleanedHook}</h1>
  <section>
    <p>${summary}</p>
  </section>
  <section>
    <h2>Detailed Analysis</h2>
    ${analysis.split(/\n\s*\n/).map(para => `    <p>${para.trim()}</p>`).join('\n')}
  </section>
  ${statsHtml}
  <p>Generated on: ${timestamp}</p>
   <p>This file is available under <a href="https://stereotic.com/data/news/StereoticHeadliner/reports/${fileName}">stereotic.com/news/reports/${fileName.split('-').slice(0, 3).join('-')}-${slugify(cleanedHook)}</a></p>
  <details>
    <summary>Embed</summary>
    <p>Latest report:</p>
        <pre><code>&lt;iframe 
  src="https://stereotic.com/news/latest_report.html" 
  style="width: 100%; height: 600px; border: none; overflow: auto;"
  title="Latest Stereotic Crypto Market Report"
&gt;&lt;/iframe&gt;</code></pre>
    <p>Or link directly:</p>
    <pre><code>&lt;a href="https://stereotic.com/data/news/StereoticHeadliner/latest_report.html"&gt;View Latest Stereotic Crypto Market Report&lt;/a&gt;</code></pre>
    <p>Permalink to this report:</p>
    <pre><code>&lt;iframe 
  src="https://stereotic.com/news/reports/${fileName}" 
  style="width: 100%; height: 600px; border: none; overflow: auto;"
  title="${cleanedHook}"
&gt;&lt;/iframe&gt;</code></pre>

    <pre><code>&lt;a href="https://stereotic.com/data/news/StereoticHeadliner/reports/${fileName}"&gt;${cleanedHook}&lt;/a&gt;</code></pre>
  </details>
  <p>Generated with <a href="https://github.com/tisztamo/StereoticHeadliner">https://github.com/tisztamo/StereoticHeadliner</a></p>
 <details>
    <summary>Logs</summary>
    <pre class="debug">${debugLogs}</pre>
  </details>
</body>
</html>
`;

  // Save to reports directory
  fs.writeFileSync(path.join(reportsDir, fileName), htmlContent, 'utf8');
  fs.writeFileSync('last_report.html', htmlContent, 'utf8');
  fs.writeFileSync('latest_report.html', htmlContent, 'utf8');
  return fileName;
}