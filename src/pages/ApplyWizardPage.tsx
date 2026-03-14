import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, apiFetch, type Client, type ClientProfile, type ResumeProfile } from "@/lib/api";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrency,
  formatDate,
  getInitials,
  STATUS_COLORS,
} from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  FileText,
  Wand2,
  ClipboardList,
  Eye,
  CheckCircle2,
  Loader2,
  ExternalLink,
  MapPin,
  Linkedin,
  Tag,
  Globe,
  AlertCircle,
} from "lucide-react";

const STEP_TITLES = [
  "Select Client",
  "Client Profile",
  "Job Details",
  "Resume",
  "App Details",
  "Review",
  "Submit",
];

interface WizardState {
  // Step 1
  clientId: string;
  // Step 3
  jobTitle: string;
  companyName: string;
  location: string;
  portalName: string;
  jobLink: string;
  jobPage: string;
  // Step 4
  resumeProfileId: string;
  tailoredLatex: string;
  resumeUrl: string;
  // Step 5
  notes: string;
  additionalLink: string;
  mailSent: boolean;
}

const EMPTY: WizardState = {
  clientId: "",
  jobTitle: "",
  companyName: "",
  location: "",
  portalName: "",
  jobLink: "",
  jobPage: "",
  resumeProfileId: "",
  tailoredLatex: "",
  resumeUrl: "",
  notes: "",
  additionalLink: "",
  mailSent: false,
};

// Step 1: Select Client
function Step1({
  data,
  onChange,
  clients,
}: {
  data: WizardState;
  onChange: (d: Partial<WizardState>) => void;
  clients: Client[];
}) {
  const selected = clients.find((c) => c.id === data.clientId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Select a Client</h2>
        <p className="text-muted-foreground text-sm">Choose the client you're submitting this application for.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="client-select">Client</Label>
        <Select value={data.clientId} onValueChange={(v) => onChange({ clientId: v })}>
          <SelectTrigger id="client-select">
            <SelectValue placeholder="Select a client…" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} — {c.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                {getInitials(selected.name)}
              </div>
              <div>
                <p className="font-semibold">{selected.name}</p>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
              </div>
              <span
                className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                  selected.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {selected.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-background rounded-md p-2.5">
                <p className="text-muted-foreground">Package</p>
                <p className="font-semibold capitalize mt-0.5">{selected.packageTier || "—"}</p>
              </div>
              <div className="bg-background rounded-md p-2.5">
                <p className="text-muted-foreground">Apps Remaining</p>
                <p className={`font-semibold mt-0.5 ${selected.applicationsRemaining < 10 ? "text-orange-600" : ""}`}>
                  {selected.applicationsRemaining}
                </p>
              </div>
              <div className="bg-background rounded-md p-2.5">
                <p className="text-muted-foreground">Amount Paid</p>
                <p className="font-semibold mt-0.5 text-green-600">{formatCurrency(selected.amountPaid)}</p>
              </div>
              <div className="bg-background rounded-md p-2.5">
                <p className="text-muted-foreground">Amount Due</p>
                <p className={`font-semibold mt-0.5 ${selected.amountDue > 0 ? "text-red-600" : ""}`}>
                  {formatCurrency(selected.amountDue)}
                </p>
              </div>
            </div>
            {selected.applicationsRemaining === 0 && (
              <div className="flex items-center gap-2 text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-2 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                This client has 0 applications remaining. Contact admin before proceeding.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Step 2: Client Profile Review
function Step2({ clientId }: { clientId: string }) {
  const { data: profile, isLoading } = useQuery<ClientProfile | null>({
    queryKey: [`/api/client-profiles/${clientId}`],
    enabled: !!clientId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Client Profile</h2>
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No profile data found for this client.</p>
          <p className="text-xs mt-1">You can proceed to the next step.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Client Profile</h2>
        <p className="text-muted-foreground text-sm">Review the client's preferences before filling out the job details.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Contact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {profile.fullName && <p className="font-medium">{profile.fullName}</p>}
            {profile.contactEmail && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Email</span>
                {profile.contactEmail}
              </p>
            )}
            {profile.phoneNumber && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Phone</span>
                {profile.phoneNumber}
              </p>
            )}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline text-xs"
              >
                <Linkedin className="h-3 w-3" /> LinkedIn Profile <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Location Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {profile.searchScope && (
              <p className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                {profile.searchScope}
              </p>
            )}
            {profile.states && profile.states.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">States</p>
                <div className="flex flex-wrap gap-1">
                  {profile.states.map((s, i) => (
                    <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.cities && profile.cities.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cities</p>
                <div className="flex flex-wrap gap-1">
                  {profile.cities.map((c, i) => (
                    <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Desired titles */}
        {profile.desiredTitles && profile.desiredTitles.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Desired Titles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {profile.desiredTitles.map((t, i) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Target companies */}
        {profile.targetCompanies && profile.targetCompanies.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Target Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {profile.targetCompanies.map((c, i) => (
                  <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Services */}
      {profile.servicesRequested && profile.servicesRequested.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Services Requested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {profile.servicesRequested.map((s, i) => (
                <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                  {s}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Step 3: Job Details
function Step3({
  data,
  onChange,
}: {
  data: WizardState;
  onChange: (d: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Job Details</h2>
        <p className="text-muted-foreground text-sm">Enter the details of the job you're applying to.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="jobTitle">Job Title *</Label>
          <Input
            id="jobTitle"
            placeholder="e.g. Software Engineer"
            value={data.jobTitle}
            onChange={(e) => onChange({ jobTitle: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            placeholder="e.g. Google"
            value={data.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="e.g. New York, NY or Remote"
            value={data.location}
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="portalName">Job Portal</Label>
          <Input
            id="portalName"
            placeholder="e.g. LinkedIn, Indeed, Greenhouse"
            value={data.portalName}
            onChange={(e) => onChange({ portalName: e.target.value })}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="jobLink">Job Link (URL)</Label>
          <Input
            id="jobLink"
            type="url"
            placeholder="https://…"
            value={data.jobLink}
            onChange={(e) => onChange({ jobLink: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="jobPage">
          Job Description{" "}
          <span className="text-muted-foreground text-xs">(paste full listing for AI resume tailoring)</span>
        </Label>
        <Textarea
          id="jobPage"
          placeholder="Paste the full job description here. This is used to tailor the client's resume in the next step…"
          value={data.jobPage}
          onChange={(e) => onChange({ jobPage: e.target.value })}
          className="min-h-[200px] font-mono text-xs"
        />
      </div>
    </div>
  );
}

// Step 4: Resume
function Step4({
  data,
  onChange,
  clientId,
}: {
  data: WizardState;
  onChange: (d: Partial<WizardState>) => void;
  clientId: string;
}) {
  const { toast } = useToast();
  const [tailoring, setTailoring] = useState(false);

  const { data: resumeProfiles, isLoading } = useQuery<ResumeProfile[]>({
    queryKey: [`/api/resume-profiles/${clientId}`],
    enabled: !!clientId,
  });

  const selectedProfile = resumeProfiles?.find((r) => r.id === data.resumeProfileId);

  const handleTailor = async () => {
    if (!data.jobPage && !data.jobTitle) {
      toast({
        title: "Job description required",
        description: "Go back to Step 3 and paste the job description to use AI tailoring.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedProfile?.baseResumeLatex) {
      toast({ title: "No resume content", description: "Selected resume has no LaTeX content.", variant: "destructive" });
      return;
    }

    setTailoring(true);
    try {
      const result = await apiRequest<{ latex?: string; resume?: string }>(
        "POST",
        `/api/generate-resume/${clientId}`,
        {
          jobTitle: data.jobTitle,
          companyName: data.companyName,
          jobPage: data.jobPage || data.jobTitle,
          baseLatex: selectedProfile.baseResumeLatex,
        }
      );
      const latex = result.latex || result.resume || "";
      onChange({ tailoredLatex: latex });
      toast({ title: "Resume tailored!", description: "AI has customized the resume for this job." });
    } catch (err: any) {
      toast({ title: "Tailoring failed", description: err.message, variant: "destructive" });
    } finally {
      setTailoring(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Resume Selection</h2>
        <p className="text-muted-foreground text-sm">
          Choose a base resume, then optionally use AI to tailor it for this specific job.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !resumeProfiles || resumeProfiles.length === 0 ? (
        <div className="text-center py-10 border rounded-lg text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No resume profiles found for this client.</p>
          <p className="text-xs mt-1">You can still proceed — enter a resume URL in the next step.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Base Resume</Label>
          <div className="space-y-2">
            {resumeProfiles.map((rp) => (
              <button
                key={rp.id}
                type="button"
                onClick={() => onChange({ resumeProfileId: rp.id, tailoredLatex: "" })}
                className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                  data.resumeProfileId === rp.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{rp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rp.isDefault ? "Default" : "Custom"} · Updated {formatDate(rp.updatedAt || rp.createdAt)}
                    </p>
                  </div>
                  {data.resumeProfileId === rp.id && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Tailor */}
      {selectedProfile && (
        <Card className="border-dashed border-primary/40 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Wand2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Resume Tailoring</p>
                <p className="text-xs text-muted-foreground">
                  Automatically customizes the resume to match the job description using Gemini AI.
                  Requires a job description in Step 3.
                </p>
              </div>
            </div>

            {data.tailoredLatex ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Resume tailored successfully! The AI-generated version will be submitted.
              </div>
            ) : null}

            <Button
              type="button"
              onClick={handleTailor}
              disabled={tailoring || !data.jobPage}
              variant={data.tailoredLatex ? "outline" : "default"}
              className="gap-2"
              size="sm"
            >
              {tailoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {tailoring ? "Tailoring…" : data.tailoredLatex ? "Re-tailor" : "Tailor with AI"}
            </Button>
            {!data.jobPage && (
              <p className="text-xs text-muted-foreground">Add a job description in Step 3 to enable tailoring.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual resume URL */}
      <div className="space-y-1.5">
        <Label htmlFor="resumeUrl">Resume URL (optional override)</Label>
        <Input
          id="resumeUrl"
          type="url"
          placeholder="https://drive.google.com/… or https://…"
          value={data.resumeUrl}
          onChange={(e) => onChange({ resumeUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Link to the PDF/Google Doc version of the resume submitted with this application.
        </p>
      </div>
    </div>
  );
}

// Step 5: Application Details
function Step5({
  data,
  onChange,
}: {
  data: WizardState;
  onChange: (d: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Application Details</h2>
        <p className="text-muted-foreground text-sm">
          Add any additional notes, links, or flags for this application.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any special instructions, cover letter used, recruiter contact, follow-up reminders…"
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="additionalLink">Additional Link (optional)</Label>
        <Input
          id="additionalLink"
          type="url"
          placeholder="https://… (portfolio, cover letter, etc.)"
          value={data.additionalLink}
          onChange={(e) => onChange({ additionalLink: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
        <Switch
          id="mailSent"
          checked={data.mailSent}
          onCheckedChange={(v) => onChange({ mailSent: v })}
        />
        <div>
          <Label htmlFor="mailSent" className="cursor-pointer font-medium">
            Confirmation email sent
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mark this if you sent a confirmation or follow-up email to the client.
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 6: Review
function Step6({ data, clients }: { data: WizardState; clients: Client[] }) {
  const client = clients.find((c) => c.id === data.clientId);

  const rows: { label: string; value?: string | null; highlight?: boolean }[] = [
    { label: "Client", value: client ? `${client.name} (${client.email})` : data.clientId },
    { label: "Job Title", value: data.jobTitle, highlight: true },
    { label: "Company", value: data.companyName, highlight: true },
    { label: "Location", value: data.location },
    { label: "Portal", value: data.portalName },
    { label: "Job Link", value: data.jobLink },
    { label: "Resume URL", value: data.resumeUrl },
    { label: "Additional Link", value: data.additionalLink },
    { label: "Notes", value: data.notes },
    { label: "Mail Sent", value: data.mailSent ? "Yes" : "No" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Review Application</h2>
        <p className="text-muted-foreground text-sm">
          Double-check everything before submitting. You can go back to any step to make changes.
        </p>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {rows
            .filter((r) => r.value && r.value !== "No")
            .map((row, i) => (
              <div key={i} className="flex gap-4 px-5 py-3">
                <span className="text-sm text-muted-foreground w-32 shrink-0">{row.label}</span>
                <span className={`text-sm flex-1 break-words ${row.highlight ? "font-semibold" : ""}`}>
                  {row.value?.startsWith("http") ? (
                    <a
                      href={row.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {row.value.length > 50 ? row.value.slice(0, 50) + "…" : row.value}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    row.value
                  )}
                </span>
              </div>
            ))}
        </CardContent>
      </Card>

      {data.tailoredLatex && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          AI-tailored resume will be included with this application.
        </div>
      )}

      {data.jobPage && (
        <details className="rounded-lg border">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium hover:bg-muted/50 select-none">
            Job Description (click to expand)
          </summary>
          <div className="px-4 pb-4 pt-2">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">{data.jobPage}</pre>
          </div>
        </details>
      )}
    </div>
  );
}

// Step 7: Confirmation
function Step7({ success, appId }: { success: boolean; appId: string }) {
  const [, navigate] = useLocation();

  if (!success) return null;

  return (
    <div className="space-y-6 text-center py-4">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Application Submitted!</h2>
          <p className="text-muted-foreground mt-1">
            The job application has been recorded successfully.
          </p>
          {appId && (
            <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted px-3 py-1 rounded inline-block">
              ID: {appId.slice(0, 8)}…
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => navigate("/applications")}>View All Applications</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Submit Another
        </Button>
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

// Main wizard
export default function ApplyWizardPage() {
  const { user } = useAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedClientId = params.get("clientId") || "";

  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardState>({ ...EMPTY, clientId: preselectedClientId });
  const [submittedId, setSubmittedId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const { data: clients } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const onChange = (partial: Partial<WizardState>) => setData((prev) => ({ ...prev, ...partial }));

  const canAdvance = () => {
    if (step === 1) return !!data.clientId;
    if (step === 3) return !!data.jobTitle && !!data.companyName;
    return true;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        clientId: data.clientId,
        employeeId: user!.id,
        dateApplied: today,
        appliedByName: user!.name,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        location: data.location || undefined,
        portalName: data.portalName || undefined,
        jobLink: data.jobLink || undefined,
        jobPage: data.jobPage || undefined,
        resumeUrl: data.resumeUrl || undefined,
        additionalLink: data.additionalLink || undefined,
        notes: data.notes || undefined,
        mailSent: data.mailSent,
        status: "Applied",
      };
      return apiRequest<{ id: string }>("POST", "/api/applications", payload);
    },
    onSuccess: (result) => {
      setSubmittedId(result.id || "");
      setSubmitted(true);
    },
    onError: (err: any) => {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    },
  });

  const handleNext = () => {
    if (step < 6) {
      setStep((s) => s + 1);
    } else if (step === 6) {
      setStep(7);
      submitMutation.mutate();
    }
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <WizardLayout currentStep={step} totalSteps={7} stepTitles={STEP_TITLES}>
      {/* Step content */}
      <div className="mb-8">
        {step === 1 && <Step1 data={data} onChange={onChange} clients={clients ?? []} />}
        {step === 2 && <Step2 clientId={data.clientId} />}
        {step === 3 && <Step3 data={data} onChange={onChange} />}
        {step === 4 && <Step4 data={data} onChange={onChange} clientId={data.clientId} />}
        {step === 5 && <Step5 data={data} onChange={onChange} />}
        {step === 6 && <Step6 data={data} clients={clients ?? []} />}
        {step === 7 && (
          submitted ? (
            <Step7 success={true} appId={submittedId} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Submitting application…</p>
            </div>
          )
        )}
      </div>

      {/* Navigation */}
      {step < 7 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canAdvance() || submitMutation.isPending}
            className="gap-2"
          >
            {step === 6 ? (
              <>
                {submitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Submit Application
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </WizardLayout>
  );
}
