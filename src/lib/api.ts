// In production the Express server serves both the API and the frontend from
// the same origin, so we use relative URLs (""). In local dev, Vite runs on a
// different port and VITE_API_URL must point at the backend (localhost:3001).
const API_URL: string =
  (import.meta as any).env?.VITE_API_URL ??
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "");

export function getToken(): string | null {
  return localStorage.getItem("ep_auth_token");
}

export function setToken(token: string): void {
  localStorage.setItem("ep_auth_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("ep_auth_token");
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem("ep_auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem("ep_auth_user", JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem("ep_auth_user");
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = unknown>(
  method: string,
  path: string,
  data?: unknown
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfNotOk(res);

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return res.text() as unknown as Promise<T>;
}

export async function apiFetch<T = unknown>(path: string): Promise<T> {
  return apiRequest<T>("GET", path);
}

// Types used across the portal
export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CLIENT" | "EMPLOYEE";
  isActive: boolean;
  whatsappNumber?: string | null;
  resumeCredits?: number;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  packageTier?: string | null;
  applicationsRemaining: number;
  amountPaid: number;
  amountDue: number;
  isActive: boolean;
  resumeCredits?: number;
  createdAt?: string;
}

export interface ClientProfile {
  userId: string;
  fullName?: string | null;
  contactEmail?: string | null;
  phoneNumber?: string | null;
  mailingAddress?: string | null;
  desiredTitles?: string[] | null;
  targetCompanies?: string[] | null;
  searchScope?: string | null;
  states?: string[] | null;
  cities?: string[] | null;
  gender?: string | null;
  ethnicity?: string | null;
  veteranStatus?: string | null;
  disabilityStatus?: string | null;
  resumeUrl?: string | null;
  linkedinUrl?: string | null;
  baseResumeLatex?: string | null;
  servicesRequested?: string[] | null;
  applicationQuota?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResumeProfile {
  id: string;
  clientId: string;
  name: string;
  baseResumeLatex: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobApplication {
  id: string;
  clientId: string;
  employeeId: string;
  dateApplied: string;
  appliedByName: string;
  jobTitle: string;
  companyName: string;
  location?: string | null;
  portalName?: string | null;
  jobLink?: string | null;
  jobPage?: string | null;
  resumeUrl?: string | null;
  additionalLink?: string | null;
  status: "Applied" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected" | "On Hold";
  mailSent: boolean;
  notes?: string | null;
  flaggedAt?: string | null;
  flaggedReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  clientName?: string;
  employeeName?: string;
}

export interface PaymentTransaction {
  id: string;
  clientId: string;
  amount: number;
  paymentDate: string;
  notes?: string | null;
  recordedBy?: string | null;
  createdAt?: string;
}

export interface EmployeeStats {
  totalApplications: number;
  applicationsThisMonth: number;
  applicationsToday: number;
  totalClients?: number;
  rejectionRate?: number;
  estimatedPayout?: number;
}
