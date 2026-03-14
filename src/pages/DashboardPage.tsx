import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiFetch, type EmployeeStats, type JobApplication, type Client } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, STATUS_COLORS } from "@/lib/utils";
import {
  Briefcase,
  FileText,
  Users,
  TrendingUp,
  Calendar,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats } = useQuery<EmployeeStats>({
    queryKey: [`/api/stats/employee/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: appsData } = useQuery<{ applications: JobApplication[]; total: number }>({
    queryKey: [`/api/applications?employeeId=${user?.id}&limit=8&page=1`],
    enabled: !!user?.id,
  });

  const { data: clientsData } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const recentApps = appsData?.applications?.slice(0, 6) ?? [];
  const assignedClients = clientsData?.length ?? 0;

  const getStatusIcon = (status: string) => {
    if (status === "Hired" || status === "Offer") return <CheckCircle2 className="h-3 w-3" />;
    if (status === "Rejected") return <XCircle className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  const today = new Date();
  const greeting =
    today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/apply">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">New Application</span>
            <span className="sm:hidden">Apply</span>
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Total Applications"
          value={stats?.totalApplications ?? "—"}
          icon={FileText}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="This Month"
          value={stats?.applicationsThisMonth ?? "—"}
          icon={Calendar}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Today"
          value={stats?.applicationsToday ?? "—"}
          icon={TrendingUp}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Active Clients"
          value={assignedClients}
          icon={Users}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/apply">
          <a className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <PlusCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Apply for Client</p>
              <p className="text-xs text-muted-foreground">7-step application wizard</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
          </a>
        </Link>
        <Link href="/clients">
          <a className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">My Clients</p>
              <p className="text-xs text-muted-foreground">{assignedClients} active clients</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
          </a>
        </Link>
        <Link href="/applications">
          <a className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">All Applications</p>
              <p className="text-xs text-muted-foreground">Track & manage</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
          </a>
        </Link>
      </div>

      {/* Recent applications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
            <Link href="/applications">
              <a className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </a>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentApps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No applications yet.</p>
              <Link href="/apply">
                <Button variant="link" className="mt-1 h-auto p-0 text-sm">
                  Submit your first application
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentApps.map((app) => (
                <div key={app.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{app.jobTitle}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {app.companyName} {app.clientName ? `· ${app.clientName}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {formatDate(app.dateApplied)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {getStatusIcon(app.status)}
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
