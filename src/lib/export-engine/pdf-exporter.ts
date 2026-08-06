/**
 * export-engine/pdf-exporter.ts — Professional PDF Report Generator & Print Renderer.
 *
 * Provides printable PDF documents with header, company logo placeholder,
 * metadata header, Executive Summary, Table of Contents, KPI cards, paginated tables,
 * dark mode / print friendliness, and header/footer page numbers.
 */

import type { ExportPayload } from "./types";

export function generatePdfHtml(payload: ExportPayload): string {
  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const baseStyles = `
    <style>
      @page {
        size: A4 portrait;
        margin: 20mm 15mm 20mm 15mm;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #1e293b;
        background-color: #ffffff;
        font-size: 13px;
        line-height: 1.5;
        padding: 0;
      }
      .header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #6366f1;
        padding-bottom: 12px;
        margin-bottom: 24px;
      }
      .brand-logo {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .logo-icon {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: bold;
        font-size: 16px;
      }
      .brand-name {
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
        letter-spacing: -0.5px;
      }
      .report-meta {
        text-align: right;
        font-size: 11px;
        color: #64748b;
      }
      .report-title {
        font-size: 22px;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 6px;
      }
      .report-subtitle {
        font-size: 13px;
        color: #64748b;
        margin-bottom: 20px;
      }
      .toc-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 14px 18px;
        margin-bottom: 24px;
      }
      .toc-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #475569;
        margin-bottom: 8px;
      }
      .toc-list {
        display: flex;
        gap: 20px;
        list-style: none;
        font-size: 12px;
      }
      .toc-list a {
        color: #4f46e5;
        text-decoration: none;
        font-weight: 500;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 24px;
      }
      .kpi-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        text-align: left;
      }
      .kpi-label {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .kpi-value {
        font-size: 18px;
        font-weight: 800;
        color: #0f172a;
      }
      .section-title {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
        margin: 24px 0 12px 0;
        padding-bottom: 6px;
        border-bottom: 1px solid #e2e8f0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 24px;
        font-size: 12px;
      }
      th {
        background: #f1f5f9;
        color: #334155;
        font-weight: 700;
        text-align: left;
        padding: 8px 12px;
        border: 1px solid #cbd5e1;
      }
      td {
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        color: #1e293b;
        vertical-align: top;
      }
      tr:nth-child(even) td {
        background: #fafafa;
      }
      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 9999px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .badge-low { background: #dcfce7; color: #15803d; }
      .badge-medium { background: #fef9c3; color: #a16207; }
      .badge-high { background: #fee2e2; color: #b91c1c; }
      .badge-in_scope { background: #dcfce7; color: #15803d; }
      .badge-scope_creep { background: #fee2e2; color: #b91c1c; }
      .footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        font-size: 10px;
        color: #94a3b8;
        display: flex;
        justify-content: space-between;
        border-top: 1px solid #e2e8f0;
        padding-top: 8px;
      }
      .page-break {
        page-break-after: always;
      }
      @media print {
        .no-print { display: none !important; }
        body { padding: 0; background: white; }
      }
    </style>
  `;

  let contentHtml = "";

  switch (payload.type) {
    case "dashboard": {
      const d = payload.data;
      contentHtml = `
        <h1 class="report-title">Workspace Dashboard Report</h1>
        <p class="report-subtitle">Executive summary for <strong>${d.meta.workspaceName}</strong> as of ${generatedAt}</p>
        
        <div class="toc-box">
          <div class="toc-title">Table of Contents</div>
          <ul class="toc-list">
            <li><a href="#kpis">1. Key Metrics</a></li>
            <li><a href="#high-risk">2. High Risk Projects</a></li>
            <li><a href="#recent-changes">3. Scope Changes</a></li>
          </ul>
        </div>

        <div id="kpis" class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Active Projects</div>
            <div class="kpi-value">${d.stats.totalProjects}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Total Analyses</div>
            <div class="kpi-value">${d.stats.totalAnalyses}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Revenue Protected</div>
            <div class="kpi-value">$${d.stats.revenueProtected.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Hours Saved</div>
            <div class="kpi-value">${d.stats.hoursSaved} hrs</div>
          </div>
        </div>

        <div id="high-risk">
          <h2 class="section-title">High Risk Projects</h2>
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Client</th>
                <th>Budget</th>
                <th>Hours Used / Alloc</th>
                <th>Risk Rating</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${d.highRiskProjects
                .map(
                  (p) => `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td>${p.client}</td>
                  <td>$${p.budget.toLocaleString()}</td>
                  <td>${p.hoursUsed} / ${p.hoursAllocated} hrs</td>
                  <td><span class="badge badge-${p.risk}">${p.risk}</span></td>
                  <td>${p.status}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div id="recent-changes">
          <h2 class="section-title">Recent Scope Changes</h2>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Original Requirement</th>
                <th>Changed Requirement</th>
                <th>Verdict</th>
                <th>Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              ${d.recentScopeChanges
                .map(
                  (c) => `
                <tr>
                  <td><strong>${c.projectName}</strong></td>
                  <td>${c.originalRequirement}</td>
                  <td>${c.changedRequirement}</td>
                  <td><span class="badge badge-${c.riskLevel}">${c.verdict}</span></td>
                  <td>$${c.suggestedCost.toLocaleString()}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
      break;
    }

    case "project": {
      const p = payload.data;
      contentHtml = `
        <h1 class="report-title">Project Scope Report: ${p.name}</h1>
        <p class="report-subtitle">Client: <strong>${p.client}</strong> | Status: ${p.status.toUpperCase()} | Generated: ${generatedAt}</p>
        
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Project Budget</div>
            <div class="kpi-value">$${p.budget.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Hourly Rate</div>
            <div class="kpi-value">$${p.hourlyRate}/hr</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Hours Used</div>
            <div class="kpi-value">${p.hoursUsed} / ${p.hoursAllocated} hrs</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Risk Rating</div>
            <div class="kpi-value"><span class="badge badge-${p.risk}">${p.risk}</span></div>
          </div>
        </div>

        <h2 class="section-title">Scope Analyses History (${p.analyses.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Analysis ID</th>
              <th>AI Summary</th>
              <th>Verdict</th>
              <th>Est. Hours</th>
              <th>Est. Cost</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${p.analyses
              .map(
                (a) => `
              <tr>
                <td><code>${a.id}</code></td>
                <td>${a.aiSummary}</td>
                <td><span class="badge badge-${a.riskLevel}">${a.verdict}</span></td>
                <td>+${a.additionalHours} hrs</td>
                <td>$${a.suggestedCost.toLocaleString()}</td>
                <td>${a.createdAt}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `;
      break;
    }

    case "analysis": {
      const a = payload.data;
      contentHtml = `
        <h1 class="report-title">Scope Analysis Report</h1>
        <p class="report-subtitle">Analysis ID: <code>${a.id}</code> | Project: <strong>${a.projectName}</strong> (${a.clientName})</p>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Verdict</div>
            <div class="kpi-value"><span class="badge badge-${a.riskLevel}">${a.verdict}</span></div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">AI Confidence</div>
            <div class="kpi-value">${a.confidence}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Est. Additional Hours</div>
            <div class="kpi-value">+${a.additionalHours} hrs</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Est. Suggested Cost</div>
            <div class="kpi-value">$${a.suggestedCost.toLocaleString()}</div>
          </div>
        </div>

        <h2 class="section-title">AI Summary & Risk Assessment</h2>
        <div class="toc-box">
          <p><strong>AI Model:</strong> ${a.aiModel || "gemini-2.5-flash"} ${a.isFallback ? "(Rule-Based Fallback Engine Active)" : ""}</p>
          <p style="margin-top: 6px;"><strong>Summary:</strong> ${a.executiveSummary || a.aiSummary}</p>
          <p style="margin-top: 6px;"><strong>Technical Details:</strong> ${a.technicalExplanation || a.explanation || a.aiExplanation}</p>
          ${
            a.potentialRisks && a.potentialRisks.length > 0
              ? `<p style="margin-top: 8px;"><strong>Potential Risks:</strong> ${a.potentialRisks.join("; ")}</p>`
              : ""
          }
          ${
            a.recommendations && a.recommendations.length > 0
              ? `<p style="margin-top: 6px;"><strong>AI Recommendations:</strong> ${a.recommendations.join("; ")}</p>`
              : ""
          }
        </div>

        <h2 class="section-title">Requirement Comparison</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 50%;">Original Requirement</th>
              <th style="width: 50%;">Changed / New Request</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${a.originalRequirement || "N/A"}</td>
              <td>${a.changedRequirement || "N/A"}</td>
            </tr>
          </tbody>
        </table>

        ${
          a.suggestedReply
            ? `
          <h2 class="section-title">Suggested Client Communication</h2>
          <div class="toc-box" style="background: #f1f5f9; border-color: #cbd5e1;">
            <pre style="white-space: pre-wrap; font-family: inherit;">${a.suggestedReply}</pre>
          </div>
        `
            : ""
        }
      `;
      break;
    }

    default: {
      contentHtml = `<h1 class="report-title">ScopeGuard Report</h1><p class="report-subtitle">Generated: ${generatedAt}</p>`;
      break;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>ScopeGuard Report</title>
        ${baseStyles}
      </head>
      <body>
        <div class="header-container">
          <div class="brand-logo">
            <div class="logo-icon">SG</div>
            <span class="brand-name">ScopeGuard AI</span>
          </div>
          <div class="report-meta">
            <div><strong>ScopeGuard Production Reports</strong></div>
            <div>Generated: ${generatedAt}</div>
          </div>
        </div>

        ${contentHtml}

        <div class="footer">
          <span>Confidential — Internal Use Only</span>
          <span>ScopeGuard AI Risk Management Engine</span>
        </div>

        <script>
          // Auto trigger window print dialog if requested
          if (window.location.search.includes('print=true')) {
            window.addEventListener('load', () => window.print());
          }
        </script>
      </body>
    </html>
  `;
}
