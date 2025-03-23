import fs from 'fs';
import path from 'path';
import { slugify } from './utils.js';
import { readPreviousReport } from './readPreviousReport.js';
import { sendReportEmail } from './emailSender.js';
import { generateHTMLContent } from './reportTemplate.js';

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

  // Generate HTML content using the template
  const htmlContent = generateHTMLContent({
    cleanedHook,
    fileName,
    timestamp,
    previousReportSection,
    statsData,
    summary,
    analysis,
    debugLogs
  });

  // Save to reports directory
  const reportPath = path.join(reportsDir, fileName);
  fs.writeFileSync(reportPath, htmlContent, 'utf8');
  fs.writeFileSync('last_report.html', htmlContent, 'utf8');
  fs.writeFileSync('latest_report.html', htmlContent, 'utf8');
  
  // Send email with the generated report
  sendReportEmail(cleanedHook, reportPath)
    .then(success => {
      if (success) {
        console.log(`\x1b[33m[${new Date().toISOString()}] Report email sent with subject: ${cleanedHook}\x1b[0m`);
      } else {
        console.error(`\x1b[33m[${new Date().toISOString()}] Failed to send report email\x1b[0m`);
      }
    })
    .catch(err => {
      console.error(`\x1b[33m[${new Date().toISOString()}] Error sending report email:\x1b[0m`, err);
    });
    
  console.log(`\x1b[33m[${new Date().toISOString()}] Report generated: ${fileName}\x1b[0m`);
  return fileName;
}