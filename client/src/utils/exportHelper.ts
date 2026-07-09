export const exportToTxt = (title: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
};

export const exportToMarkdown = (title: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
};

export const exportToDocx = (title: string, htmlContent: string) => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
        "xmlns:w='urn:schemas-microsoft-com:office:word' " +
        "xmlns='http://www.w3.org/TR/REC-html40'>" +
        "<head><title>" + title + "</title><style>body { font-family: Arial, sans-serif; line-height: 1.5; padding: 20px; }</style></head><body>";
    const footer = "</body></html>";
    const source = header + htmlContent + footer;

    const blob = new Blob(['\ufeff' + source], {
        type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
};

export const exportToPdf = (title: string, htmlContent: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          h1, h2, h3, h4 { color: #0f172a; font-family: Georgia, serif; }
          h1 { border-bottom: 2px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 24px; font-size: 24px; }
          h2 { font-size: 20px; margin-top: 24px; }
          h3 { font-size: 16px; }
          pre { background: #f1f5f9; padding: 16px; border-radius: 8px; font-family: monospace; overflow-x: auto; margin: 16px 0; }
          code { font-family: monospace; background: #e2e8f0; padding: 2px 4px; border-radius: 4px; font-size: 0.9em; }
          ul, ol { margin-left: 24px; margin-bottom: 16px; }
          li { margin-bottom: 6px; }
          blockquote { border-left: 4px solid #cbd5e1; padding-left: 16px; color: #475569; italic; margin: 16px 0; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div>${htmlContent}</div>
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);
    printWindow.document.close();
};
