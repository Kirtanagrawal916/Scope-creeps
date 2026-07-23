/**
 * export-engine/docx-exporter.ts — Future-ready Word Document (.docx) Exporter.
 *
 * Generates Word-compatible HTML/MSO document payload that opens directly
 * in Microsoft Word and office suites with full document formatting.
 */

import type { ExportPayload } from "./types";
import { generatePdfHtml } from "./pdf-exporter";

export function generateDocxReport(payload: ExportPayload): string {
  const htmlBody = generatePdfHtml(payload);

  const docxHeader = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><title>ScopeGuard Report</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
</head>
<body>
`;

  const docxFooter = `</body></html>`;

  return docxHeader + htmlBody + docxFooter;
}
