import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  apiFetch,
  apiRequest,
  type Client,
  type ClientProfile,
  type ResumeProfile,
  type PaymentTransaction,
  type JobApplication,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  formatCurrency,
  formatDate,
  getInitials,
  STATUS_COLORS,
} from "@/lib/utils";
import {
  ArrowLeft,
  User,
  CreditCard,
  FileText,
  MapPin,
  Mail,
  Phone,
  Linkedin,
  Building2,
  Target,
  Globe,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  PlusCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function TagList({ label, items }: { label: string; items?: string[] | null }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-md">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// Profile Tab
function ProfileTab({ profile, client }: { profile: ClientProfile | null; client: Client }) {
  if (!profile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No profile information available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow icon={User} label="Full Name" value={profile.fullName || client.name} />
          <InfoRow icon={Mail} label="Email" value={profile.contactEmail || client.email} />
          <InfoRow icon={Phone} label="Phone" value={profile.phoneNumber} />
          <InfoRow icon={MapPin} label="Mailing Address" value={profile.mailingAddress} />
          {profile.linkedinUrl && (
            <div className="flex items-start gap-3">
              <Linkedin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">LinkedIn</p>
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                  View Profile <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Job Search Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TagList label="Desired Titles" items={profile.desiredTitles} />
          <TagList label="Target Companies" items={profile.targetCompanies} />
          <InfoRow icon={Globe} label="Search Scope" value={profile.searchScope} />
          <TagList label="States" items={profile.states} />
          <TagList label="Cities" items={profile.cities} />
          <TagList label="Services Requested" items={profile.servicesRequested} />
          {profile.applicationQuota && (
            <InfoRow icon={Target} label="Application Quota" value={`${profile.applicationQuota} per day`} />
          )}
        </CardContent>
      </Card>

      {/* EEO */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">EEO Information</CardTitle>
          <CardDescription className="text-xs">Equal Employment Opportunity data (confidential)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow icon={User} label="Gender" value={profile.gender} />
          <InfoRow icon={User} label="Ethnicity" value={profile.ethnicity} />
          <InfoRow icon={User} label="Veteran Status" value={profile.veteranStatus} />
          <InfoRow icon={User} label="Disability Status" value={profile.disabilityStatus} />
          {!profile.gender && !profile.ethnicity && !profile.veteranStatus && !profile.disabilityStatus && (
            <p className="text-sm text-muted-foreground">No EEO data provided.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Payment Tab
function PaymentTab({ client, transactions }: { client: Client; transactions: PaymentTransaction[] }) {
  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Package</p>
            <p className="font-bold capitalize mt-1">{client.packageTier || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Apps Remaining</p>
            <p className={`font-bold mt-1 ${client.applicationsRemaining < 10 ? "text-orange-600" : ""}`}>
              {client.applicationsRemaining}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Amount Paid</p>
            <p className="font-bold mt-1 text-green-600">{formatCurrency(client.amountPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Amount Due</p>
            <p className={`font-bold mt-1 ${client.amountDue > 0 ? "text-red-600" : "text-foreground"}`}>
              {formatCurrency(client.amountDue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No payment records.</p>
          ) : (
            <div className="divide-y">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{formatDate(tx.paymentDate)}</p>
                    {tx.notes && <p className="text-xs text-muted-foreground">{tx.notes}</p>}
                  </div>
                  <p className="text-sm font-bold text-green-600">+{formatCurrency(tx.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Resume Tab
function ResumeTab({ clientId, resumeProfiles }: { clientId: string; resumeProfiles: ResumeProfile[] }) {
  const [generating, setGenerating] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDownloadPDF = async (profile: ResumeProfile) => {
    if (!profile.baseResumeLatex) {
      toast({ title: "No LaTeX", description: "This resume has no LaTeX content.", variant: "destructive" });
      return;
    }
    setGenerating(profile.id);
    try {
      const res = await fetch(
        `${(import.meta as any).env?.VITE_API_URL || "http://localhost:5000"}/api/generate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("ep_auth_token") ?? ""}`,
          },
          body: JSON.stringify({ latex: profile.baseResumeLatex }),
        }
      );
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${profile.name.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Error", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-3">
      {resumeProfiles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No resume profiles found.</p>
        </div>
      ) : (
        resumeProfiles.map((rp) => (
          <Card key={rp.id}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{rp.name}</p>
                    {rp.isDefault && (
                      <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated {formatDate(rp.updatedAt || rp.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPDF(rp)}
                  disabled={generating === rp.id}
                  className="gap-1.5"
                >
                  {generating === rp.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// Applications Tab
function ApplicationsTab({ clientId }: { clientId: string }) {
  const { data } = useQuery<{ applications: JobApplication[] }>({
    queryKey: [`/api/applications?clientId=${clientId}&limit=20`],
  });

  const apps = data?.applications ?? [];

  return (
    <div className="space-y-2">
      {apps.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No applications for this client yet.</p>
          <Link href={`/apply?clientId=${clientId}`}>
            <Button variant="link" className="text-sm mt-1 h-auto p-0">Submit first application</Button>
          </Link>
        </div>
      ) : (
        apps.map((app) => (
          <div key={app.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{app.jobTitle}</p>
              <p className="text-xs text-muted-foreground truncate">
                {app.companyName} {app.location ? `· ${app.location}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(app.dateApplied)}</p>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[app.status] ?? ""}`}
            >
              {app.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const clientId = params.id;

  const { data: clients } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const client = clients?.find((c) => c.id === clientId);

  const { data: profile } = useQuery<ClientProfile | null>({
    queryKey: [`/api/client-profiles/${clientId}`],
    enabled: !!clientId,
    retry: false,
  });

  const { data: resumeProfiles } = useQuery<ResumeProfile[]>({
    queryKey: [`/api/resume-profiles/${clientId}`],
    enabled: !!clientId,
  });

  const { data: transactions } = useQuery<PaymentTransaction[]>({
    queryKey: [`/api/payment-transactions/${clientId}`],
    enabled: !!clientId,
  });

  if (!client) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Client not found.</p>
        <Button variant="link" onClick={() => navigate("/clients")}>Back to clients</Button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/clients")}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
            {getInitials(client.name)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{client.name}</h1>
            <p className="text-sm text-muted-foreground truncate">{client.email}</p>
          </div>
        </div>
        <Link href={`/apply?clientId=${clientId}`}>
          <Button size="sm" className="gap-1.5 shrink-0">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Apply</span>
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="resumes" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Resumes</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Apps</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="profile">
            <ProfileTab profile={profile ?? null} client={client} />
          </TabsContent>
          <TabsContent value="payment">
            <PaymentTab client={client} transactions={transactions ?? []} />
          </TabsContent>
          <TabsContent value="resumes">
            <ResumeTab clientId={clientId} resumeProfiles={resumeProfiles ?? []} />
          </TabsContent>
          <TabsContent value="applications">
            <ApplicationsTab clientId={clientId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
