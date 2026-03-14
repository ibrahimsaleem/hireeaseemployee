import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiFetch, type Client } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getInitials } from "@/lib/utils";
import { Search, ArrowRight, Users, PackageOpen, PlusCircle } from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  basic: "bg-gray-100 text-gray-800",
  standard: "bg-blue-100 text-blue-800",
  premium: "bg-purple-100 text-purple-800",
  enterprise: "bg-amber-100 text-amber-800",
};

export default function ClientListPage() {
  const [search, setSearch] = useState("");

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const filtered = (clients ?? []).filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.company?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> My Clients
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {clients?.length ?? 0} clients assigned to you
          </p>
        </div>
        <Link href="/apply">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Apply for Client</span>
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Client grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <PackageOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {search ? "No clients match your search." : "No clients assigned yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCard({ client }: { client: Client }) {
  const tier = client.packageTier?.toLowerCase() ?? "";
  const tierColor = TIER_COLORS[tier] ?? "bg-gray-100 text-gray-800";
  const appsLeft = client.applicationsRemaining;
  const appsLow = appsLeft < 10;

  return (
    <Link href={`/clients/${client.id}`}>
      <a className="block">
        <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full">
          <CardContent className="p-5 flex flex-col gap-4 h-full">
            {/* Top row */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                {getInitials(client.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{client.name}</p>
                <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                {client.company && (
                  <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                )}
              </div>
            </div>

            {/* Tier & status */}
            <div className="flex items-center gap-2 flex-wrap">
              {client.packageTier && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${tierColor}`}>
                  {client.packageTier}
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  client.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {client.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs mt-auto">
              <div className="rounded-md bg-muted px-2.5 py-2">
                <p className="text-muted-foreground">Applications Left</p>
                <p className={`font-bold text-sm mt-0.5 ${appsLow ? "text-orange-600" : "text-foreground"}`}>
                  {appsLeft}
                  {appsLow && " ⚠"}
                </p>
              </div>
              <div className="rounded-md bg-muted px-2.5 py-2">
                <p className="text-muted-foreground">Amount Due</p>
                <p className={`font-bold text-sm mt-0.5 ${client.amountDue > 0 ? "text-red-600" : "text-foreground"}`}>
                  {formatCurrency(client.amountDue)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end text-xs text-primary font-medium">
              View details <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}
