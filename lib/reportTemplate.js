import { getReportStyles } from './reportStyles.js';

export function formatStatsData(statsData) {
  if (!statsData) return '';
  
  // Extract the parts and clean up the prefix
  const parts = statsData.split('Top by 4h Change:');
  let topByRankData = parts[0].replace(/^Top by Rank:\s*\n/i, ''); // Remove the "Top by Rank:" prefix
  let topByChangeData = parts[1] ? parts[1].trim() : ''; // Trim to remove empty lines at beginning
  
  return `
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

export function generateHTMLContent({
  cleanedHook,
  fileName,
  timestamp,
  previousReportSection,
  statsData,
  summary,
  analysis,
  debugLogs
}) {
  const statsHtml = formatStatsData(statsData);
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${cleanedHook}</title>
<style>
${getReportStyles()}
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
   <p>This file is available under <a href="https://stereotic.com/data/news/StereoticHeadliner/reports/${fileName}">stereotic.com/news/reports/${fileName.split('-').slice(0, 3).join('-')}-${fileName.split('-').slice(5).join('-')}</a></p>
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
</html>`;
} 