import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const STATUS_COLORS: Record<string, string> = {
  Applied: "bg-blue-100 text-blue-800",
  Screening: "bg-yellow-100 text-yellow-800",
  Interview: "bg-purple-100 text-purple-800",
  Offer: "bg-green-100 text-green-800",
  Hired: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-800",
  "On Hold": "bg-gray-100 text-gray-800",
};
