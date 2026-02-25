import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Briefcase, MapPin, Building2, DollarSign, Globe, Layers } from 'lucide-react';

interface JobFinderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JobFinderDialog = ({ open, onOpenChange }: JobFinderDialogProps) => {
  const navigate = useNavigate();
  const { resumeId } = useResume();
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [searchPhase, setSearchPhase] = useState('');

  const [preferences, setPreferences] = useState({
    target_role: '',
    company_type: '',
    salary_min: '',
    salary_max: '',
    domain: '',
    sector: '',
    location: '',
    work_mode: '',
    experience_level: '',
  });

  const updatePref = (key: string, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const phases = [
    '🔍 Analyzing your profile...',
    '🧠 AI Agent scanning job boards...',
    '📊 Computing skill match scores...',
    '🎯 Ranking jobs by relevance...',
    '✅ Finalizing results...',
  ];

  const handleSearch = async () => {
    if (!resumeId) {
      toast({ title: 'Error', description: 'No resume found. Please complete setup first.', variant: 'destructive' });
      return;
    }

    setIsSearching(true);
    let phaseIndex = 0;
    setSearchPhase(phases[0]);

    const phaseInterval = setInterval(() => {
      phaseIndex = Math.min(phaseIndex + 1, phases.length - 1);
      setSearchPhase(phases[phaseIndex]);
    }, 2500);

    try {
      const { data, error } = await supabase.functions.invoke('job-finder-agent', {
        body: {
          resume_id: resumeId,
          preferences: {
            ...preferences,
            salary_min: preferences.salary_min ? parseInt(preferences.salary_min) : null,
            salary_max: preferences.salary_max ? parseInt(preferences.salary_max) : null,
          },
        },
      });

      clearInterval(phaseInterval);

      if (error) throw error;

      if (data?.success) {
        toast({
          title: '🎯 Jobs Found!',
          description: `AI Agent found ${data.total} matching jobs for you.`,
        });
        onOpenChange(false);
        navigate('/job-finder');
      } else {
        throw new Error(data?.error || 'Job search failed');
      }
    } catch (err: any) {
      clearInterval(phaseInterval);
      console.error('Job finder error:', err);
      toast({
        title: 'Search Failed',
        description: err.message || 'Failed to find jobs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
      setSearchPhase('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Search className="w-5 h-5 text-primary" />
            </div>
            AI Job Finder Agent
          </DialogTitle>
          <DialogDescription>
            Tell us your preferences and our AI agent will find the best matching jobs in real-time.
          </DialogDescription>
        </DialogHeader>

        {isSearching ? (
          <div className="py-12 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-bold">AI</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Agent is Working...</p>
              <p className="text-muted-foreground animate-fade-in">{searchPhase}</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary/30"
                  style={{
                    animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Target Role */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Target Role
              </Label>
              <Input
                placeholder="e.g., Full Stack Developer, Data Scientist"
                value={preferences.target_role}
                onChange={e => updatePref('target_role', e.target.value)}
              />
            </div>

            {/* Company Type & Work Mode */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Company Type
                </Label>
                <Select value={preferences.company_type} onValueChange={v => updatePref('company_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Any type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Type</SelectItem>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="mnc">MNC</SelectItem>
                    <SelectItem value="product">Product Company</SelectItem>
                    <SelectItem value="service">Service Company</SelectItem>
                    <SelectItem value="unicorn">Unicorn</SelectItem>
                    <SelectItem value="government">Government/PSU</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Work Mode
                </Label>
                <Select value={preferences.work_mode} onValueChange={v => updatePref('work_mode', v)}>
                  <SelectTrigger><SelectValue placeholder="Any mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Mode</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Salary Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Salary Range (LPA)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Min (e.g., 5)"
                  value={preferences.salary_min}
                  onChange={e => updatePref('salary_min', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max (e.g., 15)"
                  value={preferences.salary_max}
                  onChange={e => updatePref('salary_max', e.target.value)}
                />
              </div>
            </div>

            {/* Domain & Sector */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Domain
                </Label>
                <Select value={preferences.domain} onValueChange={v => updatePref('domain', v)}>
                  <SelectTrigger><SelectValue placeholder="Any domain" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Domain</SelectItem>
                    <SelectItem value="web-development">Web Development</SelectItem>
                    <SelectItem value="mobile-development">Mobile Development</SelectItem>
                    <SelectItem value="data-science">Data Science & AI/ML</SelectItem>
                    <SelectItem value="cloud-devops">Cloud & DevOps</SelectItem>
                    <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                    <SelectItem value="blockchain">Blockchain & Web3</SelectItem>
                    <SelectItem value="embedded">Embedded Systems & IoT</SelectItem>
                    <SelectItem value="game-dev">Game Development</SelectItem>
                    <SelectItem value="ui-ux">UI/UX Design</SelectItem>
                    <SelectItem value="product-management">Product Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sector</Label>
                <Select value={preferences.sector} onValueChange={v => updatePref('sector', v)}>
                  <SelectTrigger><SelectValue placeholder="Any sector" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Sector</SelectItem>
                    <SelectItem value="fintech">Fintech</SelectItem>
                    <SelectItem value="edtech">EdTech</SelectItem>
                    <SelectItem value="healthtech">HealthTech</SelectItem>
                    <SelectItem value="ecommerce">E-Commerce</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="social-media">Social Media</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="telecom">Telecom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location & Experience */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Location
                </Label>
                <Input
                  placeholder="e.g., Bangalore, Mumbai"
                  value={preferences.location}
                  onChange={e => updatePref('location', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={preferences.experience_level} onValueChange={v => updatePref('experience_level', v)}>
                  <SelectTrigger><SelectValue placeholder="Any level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Level</SelectItem>
                    <SelectItem value="fresher">Fresher (0-1 yr)</SelectItem>
                    <SelectItem value="junior">Junior (1-3 yrs)</SelectItem>
                    <SelectItem value="mid">Mid (3-5 yrs)</SelectItem>
                    <SelectItem value="senior">Senior (5-8 yrs)</SelectItem>
                    <SelectItem value="lead">Lead (8+ yrs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Tags */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Quick Filters</Label>
              <div className="flex flex-wrap gap-2">
                {['Remote Only', 'Startup', '₹10+ LPA', 'Product Company', 'Bangalore'].map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors"
                    onClick={() => {
                      if (tag === 'Remote Only') updatePref('work_mode', 'remote');
                      if (tag === 'Startup') updatePref('company_type', 'startup');
                      if (tag === '₹10+ LPA') updatePref('salary_min', '10');
                      if (tag === 'Product Company') updatePref('company_type', 'product');
                      if (tag === 'Bangalore') updatePref('location', 'Bangalore');
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSearch}
              size="lg"
              className="w-full gap-3 bg-gradient-to-r from-primary via-violet-600 to-primary hover:from-primary/90 hover:to-primary/90 text-lg py-6 shadow-lg shadow-primary/25"
            >
              <Search className="w-5 h-5" />
              Find Jobs with AI Agent
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JobFinderDialog;
