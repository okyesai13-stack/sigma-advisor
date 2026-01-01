import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  ArrowLeft,
  Sparkles,
  MapPin,
  DollarSign,
  Clock,
  ExternalLink,
  CheckCircle2,
  Circle,
  Star,
  Building,
} from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  company: string;
  role: string;
  location: string;
  salary: string;
  type: string;
  match: number;
  status: "not_applied" | "applied" | "interviewing" | "offer";
  logo?: string;
}

const Apply = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: "1",
      company: "TechCorp",
      role: "Junior Full-Stack Developer",
      location: "Remote",
      salary: "$80K - $100K",
      type: "Full-time",
      match: 95,
      status: "offer",
    },
    {
      id: "2",
      company: "StartupXYZ",
      role: "Full-Stack Engineer",
      location: "San Francisco, CA",
      salary: "$90K - $120K",
      type: "Full-time",
      match: 88,
      status: "interviewing",
    },
    {
      id: "3",
      company: "InnovateLabs",
      role: "React Developer",
      location: "New York, NY",
      salary: "$85K - $110K",
      type: "Full-time",
      match: 82,
      status: "applied",
    },
    {
      id: "4",
      company: "DataFlow Inc",
      role: "Software Developer",
      location: "Remote",
      salary: "$75K - $95K",
      type: "Full-time",
      match: 78,
      status: "not_applied",
    },
    {
      id: "5",
      company: "CloudTech",
      role: "Frontend Developer",
      location: "Austin, TX",
      salary: "$70K - $90K",
      type: "Full-time",
      match: 75,
      status: "not_applied",
    },
  ]);

  const [applicationChecklist, setApplicationChecklist] = useState([
    { id: "c1", label: "Resume tailored for each application", completed: true },
    { id: "c2", label: "Cover letter prepared", completed: true },
    { id: "c3", label: "Portfolio link ready", completed: true },
    { id: "c4", label: "LinkedIn profile optimized", completed: false },
    { id: "c5", label: "References available", completed: false },
  ]);

  const toggleChecklist = (id: string) => {
    setApplicationChecklist(
      applicationChecklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const applyToJob = (jobId: string) => {
    setJobs(
      jobs.map((job) =>
        job.id === jobId ? { ...job, status: "applied" } : job
      )
    );
    toast.success("Application submitted successfully!");
  };

  const getStatusBadge = (status: Job["status"]) => {
    switch (status) {
      case "offer":
        return <Badge className="bg-success/10 text-success">Offer</Badge>;
      case "interviewing":
        return <Badge className="bg-primary/10 text-primary">Interviewing</Badge>;
      case "applied":
        return <Badge className="bg-warning/10 text-warning">Applied</Badge>;
      default:
        return <Badge variant="secondary">Not Applied</Badge>;
    }
  };

  const getStatusIcon = (status: Job["status"]) => {
    switch (status) {
      case "offer":
        return <Star className="w-5 h-5 text-success fill-success" />;
      case "interviewing":
        return <Clock className="w-5 h-5 text-primary" />;
      case "applied":
        return <CheckCircle2 className="w-5 h-5 text-warning" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const appliedCount = jobs.filter((j) => j.status !== "not_applied").length;
  const checklistProgress = Math.round(
    (applicationChecklist.filter((i) => i.completed).length / applicationChecklist.length) * 100
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/interview")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Interview
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Apply for Jobs</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{jobs.length}</div>
                <div className="text-sm text-muted-foreground">Matching Jobs</div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{appliedCount}</div>
                <div className="text-sm text-muted-foreground">Applications Sent</div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {jobs.filter((j) => j.status === "offer").length}
                </div>
                <div className="text-sm text-muted-foreground">Offers Received</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Jobs List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recommended Jobs</h2>
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                      <Building className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{job.role}</h3>
                      <p className="text-muted-foreground">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    {getStatusBadge(job.status)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {job.salary}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {job.type}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className="bg-success/10 text-success">
                    {job.match}% Match
                  </Badge>
                  {job.status === "not_applied" ? (
                    <Button onClick={() => applyToJob(job.id)} className="gap-2">
                      Apply Now
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      {job.status === "offer" ? "View Offer" : "View Application"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Checklist */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold text-foreground">Application Checklist</h3>
                <Progress value={checklistProgress} className="h-2 mt-3" />
              </div>
              <div className="p-4 space-y-3">
                {applicationChecklist.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklist(item.id)}
                    />
                    <span
                      className={`text-sm ${
                        item.completed ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-hero rounded-xl p-6 text-primary-foreground">
              <h3 className="font-semibold mb-4">Pro Tips</h3>
              <ul className="space-y-3 text-sm opacity-90">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Tailor your resume for each application
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Follow up after 1 week if no response
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Research the company before interviews
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Apply to 5-10 jobs per week consistently
                </li>
              </ul>
            </div>

            {/* Complete Journey */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Journey Complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You've completed your AI-guided career journey. Keep applying and good luck!
              </p>
              <Button variant="outline" onClick={() => navigate("/advisor")}>
                Return to Advisor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Apply;
