const fs = require('fs');
const path = require('path');

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
          const slugTitle = filenameMatch[1].split('-').slice(5).join('-'); // Remove date-time prefix
          title = slugTitle.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        console.log("Previous report found:", permalink, title);
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

module.exports = { readPreviousReport }; 