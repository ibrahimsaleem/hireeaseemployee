import type { Express } from "express";
import { db } from "./db.js";
import {
  users,
  jobApplications,
  clientProfiles,
  resumeProfiles,
  employeeAssignments,
  paymentTransactions,
} from "./schema.js";
import {
  authenticateUser,
  generateJWT,
  requireAuth,
  requireEmployee,
} from "./auth.js";
import {
  eq,
  and,
  or,
  desc,
  ilike,
  count,
  sql,
  gte,
  lte,
  isNotNull,
} from "drizzle-orm";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

// ─── helpers ────────────────────────────────────────────────────────────────

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseClientProfile(profile: any) {
  if (!profile) return null;
  return {
    ...profile,
    desiredTitles: parseJsonArray(profile.desiredTitles),
    targetCompanies: parseJsonArray(profile.targetCompanies),
    servicesRequested: parseJsonArray(profile.servicesRequested),
    searchScope: parseJsonArray(profile.searchScope),
    states: parseJsonArray(profile.states),
    cities: parseJsonArray(profile.cities),
  };
}

// ─── register routes ─────────────────────────────────────────────────────────

export function registerRoutes(app: Express) {
  // ─── Health ────────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // ─── Auth ─────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      let authUser;
      try {
        authUser = await authenticateUser(email, password);
      } catch (err: any) {
        console.error("DB error during auth:", err);
        return res.status(503).json({ message: "Database temporarily unavailable. Please try again." });
      }

      if (!authUser) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Only EMPLOYEE and ADMIN can use this portal
      if (authUser.role !== "EMPLOYEE" && authUser.role !== "ADMIN") {
        return res.status(403).json({ message: "Access denied. This portal is for employees only." });
      }

      // Check isActive
      const fullUser = await db.query.users.findFirst({ where: eq(users.id, authUser.id) });
      if (!fullUser?.isActive) {
        return res.status(403).json({ message: "Your account is pending activation. Contact your administrator." });
      }

      const token = generateJWT(authUser);
      res.json({
        token,
        user: {
          id: fullUser.id,
          name: fullUser.name,
          email: fullUser.email,
          role: fullUser.role,
          isActive: fullUser.isActive,
          whatsappNumber: fullUser.whatsappNumber,
          resumeCredits: fullUser.resumeCredits,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.id) });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          whatsappNumber: user.whatsappNumber,
          resumeCredits: user.resumeCredits,
        },
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.json({ message: "Logged out" });
  });

  // ─── Clients ──────────────────────────────────────────────────────────────
  app.get("/api/clients", requireAuth, requireEmployee, async (req, res) => {
    try {
      const user = req.user!;

      if (user.role === "EMPLOYEE") {
        // Only return clients assigned to this employee
        const assignments = await db
          .select({ clientId: employeeAssignments.clientId })
          .from(employeeAssignments)
          .where(eq(employeeAssignments.employeeId, user.id));

        if (assignments.length === 0) return res.json([]);

        const clientIds = assignments.map((a) => a.clientId);
        const clients = await db.query.users.findMany({
          where: (u, { inArray, and, eq }) =>
            and(inArray(u.id, clientIds), eq(u.role, "CLIENT")),
          orderBy: [users.name],
        });

        return res.json(clients.filter((c) => c.isActive).map(safeUser));
      }

      // Admin sees all active clients
      const clients = await db.query.users.findMany({
        where: (u, { eq }) => eq(u.role, "CLIENT"),
        orderBy: [users.name],
      });
      return res.json(clients.filter((c) => c.isActive).map(safeUser));
    } catch (err) {
      console.error("GET /api/clients error:", err);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // ─── Client Profiles ──────────────────────────────────────────────────────
  app.get("/api/client-profiles/:userId", requireAuth, requireEmployee, async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await db.query.clientProfiles.findFirst({
        where: eq(clientProfiles.userId, userId),
      });
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(parseClientProfile(profile));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch client profile" });
    }
  });

  // ─── Resume Profiles ──────────────────────────────────────────────────────
  app.get("/api/resume-profiles/:clientId", requireAuth, requireEmployee, async (req, res) => {
    try {
      const { clientId } = req.params;
      const profiles = await db.query.resumeProfiles.findMany({
        where: eq(resumeProfiles.clientId, clientId),
        orderBy: [desc(resumeProfiles.isDefault), desc(resumeProfiles.updatedAt)],
      });
      res.json(profiles);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch resume profiles" });
    }
  });

  // ─── Applications ─────────────────────────────────────────────────────────
  app.get("/api/applications", requireAuth, requireEmployee, async (req, res) => {
    try {
      const user = req.user!;
      const {
        clientId,
        employeeId,
        status,
        search,
        page = "1",
        limit = "20",
      } = req.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      // Build WHERE conditions
      const conditions: any[] = [];

      // Role-based scoping: employees see only their own submissions
      if (user.role === "EMPLOYEE") {
        conditions.push(eq(jobApplications.employeeId, user.id));
      } else if (employeeId) {
        conditions.push(eq(jobApplications.employeeId, employeeId));
      }

      if (clientId) conditions.push(eq(jobApplications.clientId, clientId));
      if (status && status !== "all") conditions.push(eq(jobApplications.status, status as any));

      if (search) {
        const q = `%${search}%`;
        conditions.push(
          or(
            ilike(jobApplications.jobTitle, q),
            ilike(jobApplications.companyName, q)
          )
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, countRows] = await Promise.all([
        db.query.jobApplications.findMany({
          where,
          orderBy: [desc(jobApplications.createdAt)],
          limit: limitNum,
          offset,
          with: {
            client: true,
            employee: true,
          },
        }),
        db.select({ count: count() }).from(jobApplications).where(where),
      ]);

      const applications = rows.map((app) => ({
        ...app,
        clientName: (app as any).client?.name ?? null,
        employeeName: (app as any).employee?.name ?? null,
      }));

      res.json({ applications, total: countRows[0]?.count ?? 0 });
    } catch (err) {
      console.error("GET /api/applications error:", err);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", requireAuth, requireEmployee, async (req, res) => {
    try {
      const user = req.user!;
      const {
        clientId,
        jobTitle,
        companyName,
        location,
        portalName,
        jobLink,
        jobPage,
        resumeUrl,
        additionalLink,
        notes,
        mailSent,
        dateApplied,
      } = req.body;

      if (!clientId || !jobTitle || !companyName) {
        return res.status(400).json({ message: "clientId, jobTitle, and companyName are required" });
      }

      // Verify client exists and is active
      const client = await db.query.users.findFirst({ where: eq(users.id, clientId) });
      if (!client || !client.isActive) {
        return res.status(404).json({ message: "Client not found or inactive" });
      }

      if (client.applicationsRemaining <= 0) {
        return res.status(402).json({ message: "Client has no applications remaining" });
      }

      const today = dateApplied || new Date().toISOString().split("T")[0];

      const insertValues: Record<string, unknown> = {
        clientId,
        employeeId: user.id,
        dateApplied: today,
        appliedByName: user.name,
        jobTitle,
        companyName,
        mailSent: mailSent ?? false,
        status: "Applied" as const,
      };
      if (location) insertValues.location = location;
      if (portalName) insertValues.portalName = portalName;
      if (jobLink) insertValues.jobLink = jobLink;
      if (jobPage) insertValues.jobPage = jobPage;
      if (resumeUrl) insertValues.resumeUrl = resumeUrl;
      if (additionalLink) insertValues.additionalLink = additionalLink;
      if (notes) insertValues.notes = notes;

      const [newApp] = await db
        .insert(jobApplications)
        .values(insertValues as any)
        .returning();

      // Decrement client's remaining applications
      await db
        .update(users)
        .set({ applicationsRemaining: sql`${users.applicationsRemaining} - 1` } as any)
        .where(eq(users.id, clientId));

      res.status(201).json(newApp);
    } catch (err) {
      console.error("POST /api/applications error:", err);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.patch("/api/applications/:id", requireAuth, requireEmployee, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user!;
      const updates = req.body;

      // Verify ownership (employees can only edit their own)
      if (user.role === "EMPLOYEE") {
        const existing = await db.query.jobApplications.findFirst({
          where: eq(jobApplications.id, id),
        });
        if (!existing) return res.status(404).json({ message: "Application not found" });
        if (existing.employeeId !== user.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const allowed = ["status", "notes", "mailSent", "portalName", "resumeUrl", "additionalLink", "location"];
      const patch: Record<string, any> = {};
      for (const key of allowed) {
        if (key in updates) patch[key] = updates[key];
      }
      patch.updatedAt = new Date();

      const [updated] = await db
        .update(jobApplications)
        .set(patch)
        .where(eq(jobApplications.id, id))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error("PATCH /api/applications/:id error:", err);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // ─── Payment Transactions ─────────────────────────────────────────────────
  app.get("/api/payment-transactions/:clientId", requireAuth, requireEmployee, async (req, res) => {
    try {
      const { clientId } = req.params;
      const txns = await db.query.paymentTransactions.findMany({
        where: eq(paymentTransactions.clientId, clientId),
        orderBy: [desc(paymentTransactions.paymentDate)],
      });
      res.json(txns);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch payment transactions" });
    }
  });

  // ─── Employee Stats ───────────────────────────────────────────────────────
  app.get("/api/stats/employee/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      if (user.role === "EMPLOYEE" && user.id !== id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const nextDay = new Date(startOfDay.getTime() + 86_400_000);

      const [total, thisMonth, today] = await Promise.all([
        db.select({ count: count() }).from(jobApplications).where(eq(jobApplications.employeeId, id)),
        db
          .select({ count: count() })
          .from(jobApplications)
          .where(
            and(
              eq(jobApplications.employeeId, id),
              gte(jobApplications.createdAt, startOfMonth)
            )
          ),
        db
          .select({ count: count() })
          .from(jobApplications)
          .where(
            and(
              eq(jobApplications.employeeId, id),
              gte(jobApplications.createdAt, startOfDay),
              lte(jobApplications.createdAt, nextDay)
            )
          ),
      ]);

      // Assigned clients count
      const assignedCount = await db
        .select({ count: count() })
        .from(employeeAssignments)
        .where(eq(employeeAssignments.employeeId, id));

      const totalApps = Number(total[0]?.count ?? 0);
      const monthApps = Number(thisMonth[0]?.count ?? 0);
      const todayApps = Number(today[0]?.count ?? 0);
      const clients = Number(assignedCount[0]?.count ?? 0);

      res.json({
        totalApplications: totalApps,
        applicationsThisMonth: monthApps,
        applicationsToday: todayApps,
        totalClients: clients,
        estimatedPayout: (totalApps * 20) / 100,
      });
    } catch (err) {
      console.error("GET /api/stats/employee/:id error:", err);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ─── Generate Resume (AI tailor) ──────────────────────────────────────────
  app.post("/api/generate-resume/:clientId", requireAuth, requireEmployee, async (req, res) => {
    try {
      const { clientId } = req.params;
      const { jobTitle, companyName, jobPage, jobDescription, baseLatex, resumeProfileId } = req.body;

      const jd = jobPage || jobDescription || "";
      if (!jd) {
        return res.status(400).json({ message: "Job description is required" });
      }

      // Resolve base LaTeX
      let baseResumeLatex: string | undefined = baseLatex;

      if (!baseResumeLatex) {
        if (resumeProfileId) {
          const rp = await db.query.resumeProfiles.findFirst({
            where: and(eq(resumeProfiles.clientId, clientId), eq(resumeProfiles.id, resumeProfileId)),
          });
          baseResumeLatex = rp?.baseResumeLatex;
        } else {
          const defaultRp = await db.query.resumeProfiles.findFirst({
            where: and(eq(resumeProfiles.clientId, clientId), eq(resumeProfiles.isDefault, true)),
          });
          baseResumeLatex = defaultRp?.baseResumeLatex;

          if (!baseResumeLatex) {
            const cp = await db.query.clientProfiles.findFirst({
              where: eq(clientProfiles.userId, clientId),
            });
            baseResumeLatex = cp?.baseResumeLatex ?? undefined;
          }
        }
      }

      if (!baseResumeLatex) {
        return res.status(400).json({ message: "No LaTeX resume template found for this client" });
      }

      // Get employee's Gemini API key
      const employee = await db.query.users.findFirst({ where: eq(users.id, req.user!.id) });
      const apiKey =
        employee?.geminiApiKey ||
        process.env.GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY_2;

      if (!apiKey) {
        return res.status(400).json({
          message: "No Gemini API key configured. Please add your Gemini API key in the main portal settings.",
        });
      }

      const model = employee?.preferredGeminiModel || process.env.GEMINI_PUBLIC_MODEL || "gemini-2.5-flash";

      const prompt = `You are an expert LaTeX resume optimizer. Tailor the following LaTeX resume to precisely match the job requirements. Return ONLY the complete LaTeX code, no explanations.

REQUIREMENTS:
- Keep it one page maximum
- Integrate key terms from the job description naturally
- Reorder and prioritize experiences to match job requirements
- Convert general statements to measurable outcomes
- Use action verbs, avoid clichés
- Maintain perfect LaTeX syntax

Base Resume:
${baseResumeLatex}

Job Description (${jobTitle ? `${jobTitle} at ${companyName}` : ""}):
${jd}

Return the tailored LaTeX resume:`;

      const { GoogleGenAI } = await import("@google/genai");
      const genAI = new GoogleGenAI({ apiKey });

      const response = await genAI.models.generateContent({ model, contents: prompt });
      let latex = response.text || "";
      latex = latex.replace(/```latex\n?/g, "").replace(/```\n?/g, "").trim();

      res.json({ latex });
    } catch (err: any) {
      console.error("generate-resume error:", err);
      if (err.message?.includes("API key")) {
        return res.status(400).json({ message: "Invalid Gemini API key" });
      }
      if (err.message?.includes("quota")) {
        return res.status(429).json({ message: "Gemini API quota exceeded" });
      }
      res.status(500).json({ message: "Failed to generate resume", details: err.message });
    }
  });

  // ─── Generate PDF from LaTeX ──────────────────────────────────────────────
  app.post("/api/generate-pdf", requireAuth, async (req, res) => {
    const { latex } = req.body;
    if (!latex) return res.status(400).json({ message: "latex is required" });

    const tmpDir = os.tmpdir();
    const jobId = randomUUID();
    const texFile = path.join(tmpDir, `${jobId}.tex`);
    const pdfFile = path.join(tmpDir, `${jobId}.pdf`);

    try {
      await writeFile(texFile, latex, "utf8");
      await execAsync(`pdflatex -interaction=nonstopmode -output-directory ${tmpDir} ${texFile}`, {
        timeout: 30_000,
      });

      const { readFile } = await import("fs/promises");
      const pdfBuffer = await readFile(pdfFile);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
      res.send(pdfBuffer);
    } catch (err: any) {
      console.error("pdflatex error:", err.stderr || err.message);
      res.status(500).json({ message: "PDF generation failed. Ensure pdflatex is installed.", details: err.message });
    } finally {
      // Cleanup temp files
      for (const f of [texFile, pdfFile, texFile.replace(".tex", ".aux"), texFile.replace(".tex", ".log")]) {
        unlink(f).catch(() => {});
      }
    }
  });
}

// Strip sensitive fields from user objects
function safeUser(u: any) {
  const { passwordHash, geminiApiKey, fallbackGeminiApiKey, ...rest } = u;
  return rest;
}
