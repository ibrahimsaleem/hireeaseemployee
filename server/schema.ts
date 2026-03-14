import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  date,
  boolean,
  pgEnum,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["ADMIN", "CLIENT", "EMPLOYEE"]);
export const statusEnum = pgEnum("status", [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
  "On Hold",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    role: roleEnum("role").notNull(),
    company: text("company"),
    packageTier: text("package_tier"),
    applicationsRemaining: integer("applications_remaining").notNull().default(sql`0`),
    amountPaid: integer("amount_paid").notNull().default(sql`0`),
    amountDue: integer("amount_due").notNull().default(sql`0`),
    isActive: boolean("is_active").default(sql`true`).notNull(),
    passwordHash: text("password_hash").notNull(),
    whatsappNumber: text("whatsapp_number"),
    geminiApiKey: text("gemini_api_key"),
    preferredGeminiModel: text("preferred_gemini_model").default(sql`'gemini-2.5-flash'`).notNull(),
    fallbackGeminiApiKey: text("fallback_gemini_api_key"),
    resumeCredits: integer("resume_credits").notNull().default(sql`10`),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_users_email").on(t.email),
    index("idx_users_role_active").on(t.role, t.isActive),
  ]
);

export const jobApplications = pgTable(
  "job_applications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    clientId: uuid("client_id").notNull().references(() => users.id),
    employeeId: uuid("employee_id").notNull().references(() => users.id),
    dateApplied: date("date_applied").notNull(),
    appliedByName: text("applied_by_name").notNull(),
    jobTitle: text("job_title").notNull(),
    companyName: text("company_name").notNull(),
    location: text("location"),
    portalName: text("portal_name"),
    jobLink: text("job_link"),
    jobPage: text("job_page"),
    resumeUrl: text("resume_url"),
    additionalLink: text("additional_link"),
    status: statusEnum("status").default("Applied").notNull(),
    mailSent: boolean("mail_sent").default(sql`false`).notNull(),
    notes: text("notes"),
    flaggedAt: timestamp("flagged_at"),
    flaggedBy: uuid("flagged_by").references(() => users.id),
    flaggedReason: text("flagged_reason"),
    penaltyCents: integer("penalty_cents"),
    penaltyAppliedAt: timestamp("penalty_applied_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_job_applications_client").on(t.clientId),
    index("idx_job_applications_employee").on(t.employeeId),
    index("idx_job_applications_status").on(t.status),
    index("idx_job_applications_date").on(t.dateApplied),
  ]
);

export const clientProfiles = pgTable(
  "client_profiles",
  {
    userId: uuid("user_id").primaryKey().references(() => users.id),
    fullName: text("full_name"),
    contactEmail: text("contact_email"),
    phoneNumber: text("phone_number"),
    mailingAddress: text("mailing_address"),
    situation: text("situation"),
    gender: text("gender"),
    ethnicity: text("ethnicity"),
    veteranStatus: text("veteran_status"),
    disabilityStatus: text("disability_status"),
    servicesRequested: text("services_requested").default(sql`'[]'`),
    applicationQuota: integer("application_quota").default(0),
    searchScope: text("search_scope").default(sql`'[]'`),
    states: text("states").default(sql`'[]'`),
    cities: text("cities").default(sql`'[]'`),
    desiredTitles: text("desired_titles"),
    targetCompanies: text("target_companies"),
    resumeUrl: text("resume_url"),
    linkedinUrl: text("linkedin_url"),
    workAuthorization: text("work_authorization"),
    sponsorshipAnswer: text("sponsorship_answer"),
    baseResumeLatex: text("base_resume_latex"),
    additionalNotes: text("additional_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("idx_client_profiles_user").on(t.userId)]
);

export const resumeProfiles = pgTable(
  "resume_profiles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    clientId: uuid("client_id").notNull().references(() => users.id),
    name: text("name").notNull(),
    baseResumeLatex: text("base_resume_latex").notNull(),
    isDefault: boolean("is_default").default(sql`false`).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("idx_resume_profiles_client").on(t.clientId)]
);

export const employeeAssignments = pgTable(
  "employee_assignments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    clientId: uuid("client_id").notNull().references(() => users.id),
    employeeId: uuid("employee_id").notNull().references(() => users.id),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_employee_assignments_client").on(t.clientId),
    index("idx_employee_assignments_employee").on(t.employeeId),
  ]
);

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    clientId: uuid("client_id").notNull().references(() => users.id),
    amount: integer("amount").notNull(),
    paymentDate: timestamp("payment_date").defaultNow().notNull(),
    notes: text("notes"),
    recordedBy: uuid("recorded_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_payment_transactions_client").on(t.clientId),
    index("idx_payment_transactions_date").on(t.paymentDate),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  clientApplications: many(jobApplications, { relationName: "client" }),
  employeeApplications: many(jobApplications, { relationName: "employee" }),
  clientProfile: one(clientProfiles, {
    fields: [users.id],
    references: [clientProfiles.userId],
  }),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  client: one(users, {
    fields: [jobApplications.clientId],
    references: [users.id],
    relationName: "client",
  }),
  employee: one(users, {
    fields: [jobApplications.employeeId],
    references: [users.id],
    relationName: "employee",
  }),
}));

export const employeeAssignmentsRelations = relations(employeeAssignments, ({ one }) => ({
  client: one(users, {
    fields: [employeeAssignments.clientId],
    references: [users.id],
    relationName: "assignedClient",
  }),
  employee: one(users, {
    fields: [employeeAssignments.employeeId],
    references: [users.id],
    relationName: "assignedEmployee",
  }),
}));

export type User = typeof users.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type ClientProfile = typeof clientProfiles.$inferSelect;
export type ResumeProfile = typeof resumeProfiles.$inferSelect;
export type EmployeeAssignment = typeof employeeAssignments.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
