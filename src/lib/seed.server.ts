import mongoose from "mongoose";
import { Project } from "../models/Project";
import { EmailThread } from "../models/EmailThread";
import { Analysis } from "../models/Analysis";
import {
  projects as mockProjects,
  emails as mockEmails,
  analyses as mockAnalyses,
} from "./mock-data";

/**
 * Automatically seeds the database for a user if they have no projects.
 * Generates valid ObjectIds and maintains correct relationships between
 * Projects, Emails, and Analyses.
 */
export async function seedUserData(userId: string | mongoose.Types.ObjectId) {
  const ownerId = typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

  // 1. Generate ObjectIds for projects and emails to map relationships correctly
  const projectIdMap = new Map<string, mongoose.Types.ObjectId>();
  const emailIdMap = new Map<string, mongoose.Types.ObjectId>();

  for (const mockProj of mockProjects) {
    projectIdMap.set(mockProj.id, new mongoose.Types.ObjectId());
  }

  for (const mockEmail of mockEmails) {
    emailIdMap.set(mockEmail.id, new mongoose.Types.ObjectId());
  }

  // 2. Prepare and save Projects
  const projectDocs = mockProjects.map((p) => {
    const newId = projectIdMap.get(p.id)!;
    return new Project({
      _id: newId,
      owner: ownerId,
      name: p.name,
      client: p.client,
      clientInitials: p.clientInitials,
      budget: p.budget,
      hourlyRate: 150, // default rate for mock projects
      hoursAllocated: p.hoursAllocated,
      hoursUsed: p.hoursUsed,
      progress: p.progress,
      status: p.status,
      risk: p.risk,
      contract: p.contract,
      scopeItems: p.scopeItems,
      outOfScope: p.outOfScope,
    });
  });

  await Project.insertMany(projectDocs);

  // 3. Prepare and save Email Threads
  const emailDocs = mockEmails.map((e) => {
    const newId = emailIdMap.get(e.id)!;
    const projectDbId = projectIdMap.get(e.projectId)!;
    return new EmailThread({
      _id: newId,
      owner: ownerId,
      projectId: projectDbId,
      from: e.from,
      fromInitials: e.fromInitials,
      subject: e.subject,
      preview: e.preview,
      body: e.body,
      receivedAt: parseMockRelativeDate(e.receivedAt),
      analyzed: e.analyzed,
      risk: e.risk,
      unread: e.unread ?? false,
    });
  });

  await EmailThread.insertMany(emailDocs);

  // 4. Prepare and save Analyses
  const analysisDocs = mockAnalyses.map((a) => {
    const projectDbId = projectIdMap.get(a.projectId)!;
    const emailDbId = emailIdMap.get(a.emailId)!;

    // Fallback logic for missing requirements and features in mock data
    const explanation = a.reasoning || "";
    const aiSummary =
      a.verdict === "in_scope"
        ? "Requested adjustments cleared as in-scope."
        : `Scope creep warning: out-of-scope items flagged.`;

    return new Analysis({
      owner: ownerId,
      userId: ownerId,
      projectId: projectDbId,
      emailId: emailDbId,
      originalRequirement: "Agreed statement of work specifications.",
      changedRequirement:
        mockEmails.find((e) => e.id === a.emailId)?.body || "Client requirement changes.",
      aiExplanation: explanation,
      verdict: a.verdict,
      confidence: a.confidence,
      riskLevel: a.additionalHours > 50 ? "high" : a.additionalHours > 15 ? "medium" : "low",
      additionalHours: a.additionalHours,
      timelineImpactDays: a.timelineImpactDays,
      suggestedCost: a.suggestedCost,
      includedFeatures: a.includedFeatures,
      outOfScopeFeatures: a.outOfScopeFeatures,
      reasoning: explanation,
      suggestedReply: a.suggestedReply,

      // New extended fields
      aiSummary,
      explanation,
      detectedFeatures: a.outOfScopeFeatures || [],
      missingRequirements: [],
      priority: a.additionalHours > 30 ? "high" : "medium",
      status: "active",
    });
  });

  await Analysis.insertMany(analysisDocs);
}

/**
 * Parses mock date strings like "2h ago", "5h ago", "1d ago", "yesterday", "last week"
 * into a valid Date object.
 */
function parseMockRelativeDate(relativeStr: string): Date {
  const now = new Date();
  if (relativeStr.includes("just now")) {
    return now;
  }
  const matchMin = relativeStr.match(/^(\d+)m/);
  if (matchMin) {
    now.setMinutes(now.getMinutes() - parseInt(matchMin[1], 10));
    return now;
  }
  const matchHour = relativeStr.match(/^(\d+)h/);
  if (matchHour) {
    now.setHours(now.getHours() - parseInt(matchHour[1], 10));
    return now;
  }
  const matchDay = relativeStr.match(/^(\d+)d/);
  if (matchDay) {
    now.setDate(now.getDate() - parseInt(matchDay[1], 10));
    return now;
  }
  if (relativeStr.includes("yesterday")) {
    now.setDate(now.getDate() - 1);
    return now;
  }
  if (relativeStr.includes("last week")) {
    now.setDate(now.getDate() - 7);
    return now;
  }
  return now;
}
