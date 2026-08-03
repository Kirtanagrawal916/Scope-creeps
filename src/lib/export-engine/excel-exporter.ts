/**
 * export-engine/excel-exporter.ts — Production Excel (.xlsx/.xml) Workbook Generator.
 *
 * Supports multi-sheet workbooks (Dashboard, Projects, Analyses, Analytics, Summary),
 * styled headers, auto-calculated column widths, freeze panes, and summary totals.
 */

import type { ExportPayload } from "./types";

/** Helper to escape XML special characters */
function escapeXml(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface ExcelColumn {
  title: string;
  width?: number;
  type?: "String" | "Number" | "DateTime";
}

export interface ExcelCell {
  value: unknown;
  type?: "String" | "Number" | "DateTime";
  styleId?: string;
}

export interface ExcelSheet {
  name: string;
  columns: ExcelColumn[];
  rows: ExcelCell[][];
  showFreezePane?: boolean;
}

/**
 * Builds an XML Spreadsheet 2003 document compatible with Excel (.xlsx / .xls).
 */
export function buildExcelWorkbook(sheets: ExcelSheet[]): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>ScopeGuard</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1F2937"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Bold="1" ss:Color="#4F46E5"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Italic="1" ss:Color="#6B7280"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3730A3"/>
   </Borders>
  </Style>
  <Style ss:ID="BadgeLow">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="BadgeMed">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#92400E"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="BadgeHigh">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#991B1B"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Number">
   <NumberFormat ss:Format="#,##0"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="TotalRow">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#111827"/>
   <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#9CA3AF"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#4B5563"/>
   </Borders>
  </Style>
 </Styles>`;

  const xmlSheets = sheets.map((sheet) => {
    // Auto-calculate column widths if not explicitly provided
    const colSpecs = sheet.columns.map((col, idx) => {
      let maxLen = col.title.length;
      sheet.rows.forEach((row) => {
        const cell = row[idx];
        const valStr = cell?.value !== undefined ? String(cell.value) : "";
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      const width = col.width ?? Math.min(Math.max(maxLen * 8.5 + 20, 80), 350);
      return `<Column ss:Width="${width}"/>`;
    });

    const headerCells = sheet.columns
      .map(
        (col) =>
          `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.title)}</Data></Cell>`,
      )
      .join("");

    const dataRowsXml = sheet.rows
      .map((row) => {
        const cellsXml = row
          .map((cell) => {
            const val = cell.value;
            const type = cell.type ?? (typeof val === "number" ? "Number" : "String");
            const styleAttr = cell.styleId
              ? ` ss:StyleID="${cell.styleId}"`
              : type === "Number"
                ? ' ss:StyleID="Number"'
                : "";
            return `<Cell${styleAttr}><Data ss:Type="${type}">${escapeXml(val)}</Data></Cell>`;
          })
          .join("");
        return `<Row ss:Height="22">${cellsXml}</Row>`;
      })
      .join("\n");

    const freezePaneXml = sheet.showFreezePane
      ? `<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
          <FreezePanes/>
          <FrozenNoSplit/>
          <SplitHorizontal>1</SplitHorizontal>
          <TopRowBottomPane>1</TopRowBottomPane>
          <ActivePane>2</ActivePane>
        </WorksheetOptions>`
      : "";

    return `
 <Worksheet ss:Name="${escapeXml(sheet.name)}">
  <Table>
   ${colSpecs.join("\n   ")}
   <Row ss:Height="26">
    ${headerCells}
   </Row>
   ${dataRowsXml}
  </Table>
  ${freezePaneXml}
 </Worksheet>`;
  });

  return xmlHeader + xmlSheets.join("\n") + "\n</Workbook>";
}

/**
 * Generates an Excel spreadsheet document string based on ExportPayload.
 */
export function generateExcelReport(payload: ExportPayload): string {
  const sheets: ExcelSheet[] = [];

  switch (payload.type) {
    case "dashboard": {
      const d = payload.data;
      // Sheet 1: Summary KPIs
      sheets.push({
        name: "Dashboard Summary",
        showFreezePane: true,
        columns: [
          { title: "Metric", width: 180 },
          { title: "Value", width: 140, type: "String" },
        ],
        rows: [
          [{ value: "Workspace Name" }, { value: d.meta.workspaceName }],
          [{ value: "Generated Date" }, { value: d.meta.generatedAt }],
          [{ value: "Total Projects" }, { value: d.stats.totalProjects, type: "Number" }],
          [{ value: "Total Analyses" }, { value: d.stats.totalAnalyses, type: "Number" }],
          [{ value: "Scope Creep Count" }, { value: d.stats.scopeCreepCount, type: "Number" }],
          [
            { value: "Revenue Protected ($)" },
            { value: d.stats.revenueProtected, type: "Number", styleId: "Currency" },
          ],
          [{ value: "Hours Saved" }, { value: d.stats.hoursSaved, type: "Number" }],
          [{ value: "Average Confidence (%)" }, { value: d.stats.avgConfidence, type: "Number" }],
          [
            { value: "High Risk Projects" },
            { value: d.stats.highRiskProjectsCount, type: "Number" },
          ],
        ],
      });

      // Sheet 2: High Risk Projects
      sheets.push({
        name: "High Risk Projects",
        showFreezePane: true,
        columns: [
          { title: "Project ID" },
          { title: "Project Name" },
          { title: "Client" },
          { title: "Budget ($)" },
          { title: "Hours Used" },
          { title: "Hours Allocated" },
          { title: "Risk Level" },
          { title: "Status" },
        ],
        rows: d.highRiskProjects.map((p) => [
          { value: p.id },
          { value: p.name },
          { value: p.client },
          { value: p.budget, type: "Number", styleId: "Currency" },
          { value: p.hoursUsed, type: "Number" },
          { value: p.hoursAllocated, type: "Number" },
          { value: p.risk, styleId: p.risk === "high" ? "BadgeHigh" : "BadgeMed" },
          { value: p.status },
        ]),
      });

      // Sheet 3: Scope Changes
      sheets.push({
        name: "Recent Scope Changes",
        showFreezePane: true,
        columns: [
          { title: "Project" },
          { title: "Original Requirement" },
          { title: "Changed Requirement" },
          { title: "Verdict" },
          { title: "Risk Level" },
          { title: "Est. Hours" },
          { title: "Est. Cost ($)" },
          { title: "Date" },
        ],
        rows: d.recentScopeChanges.map((c) => [
          { value: c.projectName },
          { value: c.originalRequirement },
          { value: c.changedRequirement },
          { value: c.verdict },
          {
            value: c.riskLevel,
            styleId:
              c.riskLevel === "high"
                ? "BadgeHigh"
                : c.riskLevel === "medium"
                  ? "BadgeMed"
                  : "BadgeLow",
          },
          { value: c.additionalHours, type: "Number" },
          { value: c.suggestedCost, type: "Number", styleId: "Currency" },
          { value: c.createdAt },
        ]),
      });
      break;
    }

    case "project": {
      const p = payload.data;
      sheets.push({
        name: "Project Overview",
        showFreezePane: true,
        columns: [{ title: "Property" }, { title: "Value" }],
        rows: [
          [{ value: "Project Name" }, { value: p.name }],
          [{ value: "Client" }, { value: p.client }],
          [{ value: "Status" }, { value: p.status }],
          [{ value: "Risk Score" }, { value: p.risk }],
          [{ value: "Budget ($)" }, { value: p.budget, type: "Number", styleId: "Currency" }],
          [
            { value: "Hourly Rate ($)" },
            { value: p.hourlyRate, type: "Number", styleId: "Currency" },
          ],
          [{ value: "Hours Allocated" }, { value: p.hoursAllocated, type: "Number" }],
          [{ value: "Hours Used" }, { value: p.hoursUsed, type: "Number" }],
          [{ value: "Progress (%)" }, { value: p.progress, type: "Number" }],
          [{ value: "Contract Terms" }, { value: p.contract }],
          [{ value: "Total Scope Items" }, { value: p.scopeItems.length, type: "Number" }],
          [{ value: "Out of Scope Items" }, { value: p.outOfScope.length, type: "Number" }],
        ],
      });

      sheets.push({
        name: "Scope Analyses",
        showFreezePane: true,
        columns: [
          { title: "Analysis ID" },
          { title: "AI Summary" },
          { title: "Verdict" },
          { title: "Confidence (%)" },
          { title: "Risk Level" },
          { title: "Est. Hours" },
          { title: "Est. Cost ($)" },
          { title: "Priority" },
          { title: "Status" },
          { title: "Date" },
        ],
        rows: p.analyses.map((a) => [
          { value: a.id },
          { value: a.aiSummary },
          { value: a.verdict },
          { value: a.confidence, type: "Number" },
          { value: a.riskLevel, styleId: a.riskLevel === "high" ? "BadgeHigh" : "BadgeMed" },
          { value: a.additionalHours, type: "Number" },
          { value: a.suggestedCost, type: "Number", styleId: "Currency" },
          { value: a.priority },
          { value: a.status },
          { value: a.createdAt },
        ]),
      });
      break;
    }

    case "projects_bulk": {
      const projects = payload.data;
      sheets.push({
        name: "Projects Master List",
        showFreezePane: true,
        columns: [
          { title: "Project ID" },
          { title: "Project Name" },
          { title: "Client" },
          { title: "Status" },
          { title: "Risk Rating" },
          { title: "Budget ($)" },
          { title: "Hourly Rate ($)" },
          { title: "Hours Allocated" },
          { title: "Hours Used" },
          { title: "Progress (%)" },
          { title: "Created Date" },
        ],
        rows: projects.map((p) => [
          { value: p.id },
          { value: p.name },
          { value: p.client },
          { value: p.status },
          {
            value: p.risk,
            styleId:
              p.risk === "high" ? "BadgeHigh" : p.risk === "medium" ? "BadgeMed" : "BadgeLow",
          },
          { value: p.budget, type: "Number", styleId: "Currency" },
          { value: p.hourlyRate, type: "Number", styleId: "Currency" },
          { value: p.hoursAllocated, type: "Number" },
          { value: p.hoursUsed, type: "Number" },
          { value: p.progress, type: "Number" },
          { value: p.createdAt },
        ]),
      });
      break;
    }

    case "analysis": {
      const a = payload.data;
      sheets.push({
        name: "Analysis Detail",
        showFreezePane: true,
        columns: [{ title: "Field" }, { title: "Content" }],
        rows: [
          [{ value: "Analysis ID" }, { value: a.id }],
          [{ value: "Project Name" }, { value: a.projectName }],
          [{ value: "Client Name" }, { value: a.clientName }],
          [{ value: "Verdict" }, { value: a.verdict }],
          [{ value: "Confidence Score (%)" }, { value: a.confidence, type: "Number" }],
          [{ value: "Risk Level" }, { value: a.riskLevel }],
          [{ value: "Priority" }, { value: a.priority }],
          [{ value: "Status" }, { value: a.status }],
          [{ value: "Est. Additional Hours" }, { value: a.additionalHours, type: "Number" }],
          [
            { value: "Est. Suggested Cost ($)" },
            { value: a.suggestedCost, type: "Number", styleId: "Currency" },
          ],
          [{ value: "AI Summary" }, { value: a.aiSummary }],
          [{ value: "AI Explanation" }, { value: a.explanation || a.aiExplanation }],
          [{ value: "Original Requirement" }, { value: a.originalRequirement }],
          [{ value: "Changed Requirement" }, { value: a.changedRequirement }],
          [{ value: "Included Features" }, { value: a.includedFeatures?.join(", ") ?? "" }],
          [{ value: "Out of Scope Features" }, { value: a.outOfScopeFeatures?.join(", ") ?? "" }],
          [{ value: "Suggested Reply" }, { value: a.suggestedReply }],
          [{ value: "Created Date" }, { value: a.createdAt }],
        ],
      });
      break;
    }

    case "analyses_bulk": {
      const items = payload.data;
      sheets.push({
        name: "Analyses Master List",
        showFreezePane: true,
        columns: [
          { title: "Analysis ID" },
          { title: "Project" },
          { title: "Client" },
          { title: "Verdict" },
          { title: "Confidence (%)" },
          { title: "Risk Level" },
          { title: "Priority" },
          { title: "Status" },
          { title: "Est. Hours" },
          { title: "Est. Cost ($)" },
          { title: "AI Summary" },
          { title: "Created Date" },
        ],
        rows: items.map((a) => [
          { value: a.id },
          { value: a.projectName },
          { value: a.clientName },
          { value: a.verdict },
          { value: a.confidence, type: "Number" },
          {
            value: a.riskLevel,
            styleId:
              a.riskLevel === "high"
                ? "BadgeHigh"
                : a.riskLevel === "medium"
                  ? "BadgeMed"
                  : "BadgeLow",
          },
          { value: a.priority },
          { value: a.status },
          { value: a.additionalHours, type: "Number" },
          { value: a.suggestedCost, type: "Number", styleId: "Currency" },
          { value: a.aiSummary },
          { value: a.createdAt },
        ]),
      });
      break;
    }

    case "analytics": {
      const data = payload.data;
      sheets.push({
        name: "Analytics KPIs",
        showFreezePane: true,
        columns: [{ title: "KPI Metric" }, { title: "Value" }],
        rows: [
          [
            { value: "Total Revenue Protected ($)" },
            { value: data.kpis.totalRevenueProtected, type: "Number", styleId: "Currency" },
          ],
          [{ value: "Total Hours Saved" }, { value: data.kpis.totalHoursSaved, type: "Number" }],
          [
            { value: "Average Confidence Score (%)" },
            { value: data.kpis.avgConfidenceScore, type: "Number" },
          ],
          [
            { value: "Total Scope Analyses" },
            { value: data.kpis.totalAnalysesPerformed, type: "Number" },
          ],
          [
            { value: "Scope Creep Ratio (%)" },
            { value: data.kpis.scopeCreepRatio, type: "Number" },
          ],
        ],
      });

      sheets.push({
        name: "Monthly Activity",
        showFreezePane: true,
        columns: [
          { title: "Month" },
          { title: "Total Analyses" },
          { title: "Scope Creep Count" },
          { title: "Revenue Protected ($)" },
        ],
        rows: data.monthlyActivity.map((m) => [
          { value: m.month },
          { value: m.totalAnalyses, type: "Number" },
          { value: m.scopeCreepCount, type: "Number" },
          { value: m.revenueProtected, type: "Number", styleId: "Currency" },
        ]),
      });
      break;
    }

    case "workspace": {
      const ws = payload.data;
      return generateExcelReport({ type: "dashboard", data: ws.dashboard });
    }
  }

  return buildExcelWorkbook(sheets);
}
