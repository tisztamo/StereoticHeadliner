const fs = require('fs');
const path = require('path');
const { slugify } = require('./utils');

function readPreviousReport() {
  try {
    const lastReportPath = path.join(__dirname, '..', 'latest_report.html');
    
    if (fs.existsSync(lastReportPath)) {
      const content = fs.readFileSync(lastReportPath, 'utf8');
      
      // Extract permalink
      const permalinkMatch = content.match(/This file is available under <a href="([^"]+)">([^<]+)<\/a>/);
      
      if (permalinkMatch && permalinkMatch.length >= 2) {
        const permalink = permalinkMatch[1];
        
        // Extract title from permalink
        let title = '';
        const filenameMatch = permalink.match(/([^\/]+)\.html$/);
        
        if (filenameMatch && filenameMatch.length >= 2) {
          // Convert filename to readable title
          const slugTitle = filenameMatch[1].split('-').slice(3).join('-'); // Remove date-time prefix
          title = slugTitle.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        
        return {
          permalink,
          title
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('[ERROR] Failed to read previous report:', error);
    return null;
  }
}

function generateHTMLReport({ hook, analysis, summary, debugLogs, statsData }) {
  const now = new Date();
  const fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${slugify(hook)}.html`;
  
  // Format timestamp with minutes resolution
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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
    statsHtml = `
  <section class="stats-data">
    <h2>Market Statistics</h2>
    <div class="stats-columns">
      <div class="stats-column">
        <h3>Top by Rank</h3>
        <pre class="stats-pre">${statsData.split('Top 7 by 4h Change:')[0].replace(/\n/g, '<br>')}</pre>
      </div>
      <div class="stats-column">
        <h3>Top by 4h Change</h3>
        <pre class="stats-pre">${statsData.split('Top 7 by 4h Change:')[1]?.replace(/\n/g, '<br>') || ''}</pre>
      </div>
    </div>
  </section>`;
  }

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${hook}</title>
  <style>
    /* Minimal Tufte-inspired design */
    body {
      font-family: Georgia, serif;
      max-width: 40em;
      margin: 2rem auto;
      padding: 1rem;
      background: #f9f9f9;
      color: #333;
      line-height: 1.6;
    }
    h1, h2, h3 {
      font-family: "Times New Roman", serif;
      margin-bottom: 0.5em;
    }
    #scrollto {
      display: block;
      margin-top: 1em;
    }
    pre.debug {
      font-size: 0.8em;
      background: #eee;
      padding: 1em;
      overflow-x: auto;
    }
    .previous-report {
      margin-top: 1em;
      font-style: italic;
      border-top: 1px solid #ddd;
      padding-top: 0.5em;
    }
    .stats-data {
      margin-top: 2em;
      background: #f0f0f0;
      padding: 1em;
      border-radius: 5px;
    }
    .stats-columns {
      display: flex;
      flex-wrap: wrap;
      gap: 1em;
    }
    .stats-column {
      flex: 1;
      min-width: 250px;
    }
    .stats-pre {
      font-family: monospace;
      font-size: 0.85em;
      line-height: 1.4;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  ${previousReportSection}
  <h1 id="scrollto">${hook}</h1>
  <section>
    <p>${summary}</p>
  </section>
  <section>
    <h2>Detailed Analysis</h2>
    ${analysis.split(/\n\s*\n/).map(para => `    <p>${para.trim()}</p>`).join('\n')}
  </section>
  ${statsHtml}
  <p>Generated on: ${timestamp}</p>
   <p>This file is available under <a href="https://stereotic.com/data/news/StereoticHeadliner/${fileName}">stereotic.com/news/${fileName.split('-').slice(0, 3).join('-')}-${slugify(hook)}</a></p>
  <details>
    <summary>Embed</summary>
    <pre><code>&lt;iframe 
  src="https://stereotic.com/news/${fileName}" 
  style="width: 100%; height: 600px; border: none; overflow: auto;"
  title="Crypto Market Report"
&gt;&lt;/iframe&gt;</code></pre>
    <p>Or link directly:</p>
    <pre><code>&lt;a href="https://stereotic.com/data/news/StereoticHeadliner/${fileName}"&gt;View Latest Crypto Market Report&lt;/a&gt;</code></pre>
  </details>
  <p>Generated with <a href="https://github.com/tisztamo/StereoticHeadliner">https://github.com/tisztamo/StereoticHeadliner</a></p>
 <details>
    <summary>Logs</summary>
    <pre class="debug">${debugLogs}</pre>
  </details>
</body>
</html>
`;

  fs.writeFileSync(path.join(__dirname, '..', fileName), htmlContent, 'utf8');
  fs.writeFileSync(path.join(__dirname, '..', 'last_report.html'), htmlContent, 'utf8');
  fs.writeFileSync(path.join(__dirname, '..', 'latest_report.html'), htmlContent, 'utf8');
  return fileName;
}

module.exports = { generateHTMLReport };
