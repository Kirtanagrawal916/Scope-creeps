// Priority 4: Background Queue Worker System
// Processes async export jobs, AI token usage calculations, and telemetry background sweeps

export interface Job {
  id: string;
  name: string;
  type: "EXPORT_PDF" | "EXPORT_CSV" | "AI_SCOPE_ANALYSIS" | "AUDIT_CLEANUP";
  payload: Record<string, unknown>;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number; // 0 to 100
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  resultUrl?: string;
}

class QueueWorkerEngine {
  private jobs: Map<string, Job> = new Map();
  private isProcessing = false;

  constructor() {
    this.seedMockJobs();
  }

  private seedMockJobs() {
    const mockJobs: Job[] = [
      {
        id: "job-101",
        name: "Workspace Audit Report Export (CSV)",
        type: "EXPORT_CSV",
        payload: { scope: "workspace", format: "csv" },
        status: "COMPLETED",
        progress: 100,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 1.9).toISOString(),
        resultUrl: "/api/exports/download/job-101",
      },
      {
        id: "job-102",
        name: "Project Scope Comparison PDF Sync",
        type: "EXPORT_PDF",
        payload: { projectId: "proj-88", format: "pdf" },
        status: "COMPLETED",
        progress: 100,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        completedAt: new Date(Date.now() - 1750000).toISOString(),
        resultUrl: "/api/exports/download/job-102",
      },
      {
        id: "job-103",
        name: "Batch AI Contract Parsing",
        type: "AI_SCOPE_ANALYSIS",
        payload: { documentId: "doc-99" },
        status: "PROCESSING",
        progress: 65,
        createdAt: new Date(Date.now() - 30000).toISOString(),
        startedAt: new Date(Date.now() - 25000).toISOString(),
      },
    ];

    mockJobs.forEach((job) => this.jobs.set(job.id, job));
  }

  async addJob(type: Job["type"], name: string, payload: Record<string, unknown>): Promise<Job> {
    const job: Job = {
      id: `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      type,
      payload,
      status: "PENDING",
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(job.id, job);
    this.processQueue();
    return job;
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    for (const [id, job] of this.jobs.entries()) {
      if (job.status === "PENDING") {
        job.status = "PROCESSING";
        job.startedAt = new Date().toISOString();

        // Simulate async background execution
        for (let p = 10; p <= 100; p += 30) {
          job.progress = Math.min(p, 100);
          await new Promise((res) => setTimeout(res, 400));
        }

        job.status = "COMPLETED";
        job.completedAt = new Date().toISOString();
        job.resultUrl = `/api/exports/download/${job.id}`;
      }
    }

    this.isProcessing = false;
  }

  getJobs(): Job[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getMetrics() {
    const allJobs = this.getJobs();
    return {
      total: allJobs.length,
      pending: allJobs.filter((j) => j.status === "PENDING").length,
      processing: allJobs.filter((j) => j.status === "PROCESSING").length,
      completed: allJobs.filter((j) => j.status === "COMPLETED").length,
      failed: allJobs.filter((j) => j.status === "FAILED").length,
    };
  }
}

export const queueWorker = new QueueWorkerEngine();
