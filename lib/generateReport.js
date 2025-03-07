const fs = require('fs');
const path = require('path');
const { slugify } = require('./utils');

function generateHTMLReport({ hook, analysis, summary, debugLogs }) {
  const now = new Date();
  const fileName = \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}-\${String(now.getDate()).padStart(2, '0')}-\${String(now.getHours()).padStart(2, '0')}-\${slugify(hook)}.html\`;

  const htmlContent = \`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>\${hook}</title>
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
  </style>
</head>
<body>
  <h1 id="scrollto">\${hook}</h1>
  <section>
    <h2>Detailed Analysis</h2>
    <p>\${analysis}</p>
  </section>
  <section>
    <h2>Summary</h2>
    <p>\${summary}</p>
  </section>
  <section>
    <h2>Debug Logs</h2>
    <pre class="debug">\${debugLogs}</pre>
  </section>
</body>
</html>
\`;

  fs.writeFileSync(path.join(__dirname, '..', fileName), htmlContent, 'utf8');
  return fileName;
}

module.exports = { generateHTMLReport };
