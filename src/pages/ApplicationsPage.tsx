import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, type JobApplication } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatDate, STATUS_COLORS } from "@/lib/utils";
import {
  Search,
  PlusCircle,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  Edit3,
  Check,
  X,
  Briefcase,
  Flag,
} from "lucide-react";

const STATUSES = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected", "On Hold"] as const;
type Status = (typeof STATUSES)[number];

const PAGE_SIZE = 20;

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<Status>("Applied");

  const queryParams = new URLSearchParams({
    employeeId: user?.id ?? "",
    page: String(page),
    limit: String(PAGE_SIZE),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(search ? { search } : {}),
  });

  const { data, isLoading } = useQuery<{ applications: JobApplication[]; total: number }>({
    queryKey: [`/api/applications?${queryParams}`],
    enabled: !!user?.id,
  });

  const apps = data?.applications ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      apiRequest("PATCH", `/api/applications/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/applications"] });
      setEditingId(null);
      toast({ title: "Status updated" });
    },
    onError: (err: any) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });

  const startEdit = (app: JobApplication) => {
    setEditingId(app.id);
    setEditStatus(app.status);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id: string) => updateMutation.mutate({ id, status: editStatus });

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handleStatusFilter = (v: string) => {
    setStatusFilter(v);
    setPage(1);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> Applications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} total applications
          </p>
        </div>
        <Link href="/apply">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">New Application</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by job title, company, or client…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="h-4 w-4 mr-2 shrink-0" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0 divide-y">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-5 py-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No applications found.</p>
              {(search || statusFilter !== "all") && (
                <Button
                  variant="link"
                  className="text-sm mt-1 h-auto p-0"
                  onClick={() => { setSearch(""); setStatusFilter("all"); setPage(1); }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {/* Header row — desktop */}
              <div className="hidden lg:grid grid-cols-[2fr,1.5fr,1fr,1fr,1fr,auto] gap-4 px-5 py-2.5 bg-muted/50 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <span>Job / Company</span>
                <span>Client</span>
                <span>Date</span>
                <span>Portal</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              {apps.map((app) => (
                <ApplicationRow
                  key={app.id}
                  app={app}
                  isEditing={editingId === app.id}
                  editStatus={editStatus}
                  onEditStatusChange={setEditStatus}
                  onEdit={() => startEdit(app)}
                  onSave={() => saveEdit(app.id)}
                  onCancel={cancelEdit}
                  saving={updateMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationRow({
  app,
  isEditing,
  editStatus,
  onEditStatusChange,
  onEdit,
  onSave,
  onCancel,
  saving,
}: {
  app: JobApplication;
  isEditing: boolean;
  editStatus: Status;
  onEditStatusChange: (s: Status) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const isFlagged = !!app.flaggedAt;

  return (
    <div
      className={`px-4 py-3 hover:bg-muted/30 transition-colors ${
        isFlagged ? "border-l-2 border-orange-400" : ""
      }`}
    >
      {/* Mobile layout */}
      <div className="lg:hidden space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{app.jobTitle}</p>
            <p className="text-xs text-muted-foreground truncate">{app.companyName}</p>
            {app.clientName && (
              <p className="text-xs text-muted-foreground">Client: {app.clientName}</p>
            )}
          </div>
          <div className="shrink-0">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <button onClick={onSave} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={onCancel} className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button onClick={onEdit} className="p-1 text-muted-foreground hover:text-foreground rounded">
                <Edit3 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{formatDate(app.dateApplied)}</span>
          {app.portalName && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{app.portalName}</span>
          )}
          {isFlagged && (
            <span className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Flag className="h-3 w-3" /> Flagged
            </span>
          )}
          {isEditing ? (
            <Select value={editStatus} onValueChange={(v) => onEditStatusChange(v as Status)}>
              <SelectTrigger className="h-7 text-xs w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected", "On Hold"].map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[app.status] ?? ""}`}>
              {app.status}
            </span>
          )}
          {app.jobLink && (
            <a href={app.jobLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              <ExternalLink className="h-3 w-3" /> Job
            </a>
          )}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:grid grid-cols-[2fr,1.5fr,1fr,1fr,1fr,auto] gap-4 items-center">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{app.jobTitle}</p>
          <p className="text-xs text-muted-foreground truncate">
            {app.companyName}
            {app.location ? ` · ${app.location}` : ""}
          </p>
        </div>
        <p className="text-sm truncate text-muted-foreground">{app.clientName ?? "—"}</p>
        <p className="text-sm text-muted-foreground">{formatDate(app.dateApplied)}</p>
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs text-muted-foreground truncate">{app.portalName ?? "—"}</span>
          {app.jobLink && (
            <a href={app.jobLink} target="_blank" rel="noopener noreferrer" className="text-primary shrink-0">
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div>
          {isEditing ? (
            <Select value={editStatus} onValueChange={(v) => onEditStatusChange(v as Status)}>
              <SelectTrigger className="h-7 text-xs w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected", "On Hold"].map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[app.status] ?? ""}`}>
              {app.status}
            </span>
          )}
        </div>
        <div className="flex items-center justify-end gap-1">
          {isFlagged && (
            <span title="Flagged by client">
              <Flag className="h-3.5 w-3.5 text-orange-500" />
            </span>
          )}
          {isEditing ? (
            <>
              <button onClick={onSave} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={onCancel} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md">
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button onClick={onEdit} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
              <Edit3 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
