import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  ArrowLeft, 
  TrendingUp,
  Target,
  GraduationCap,
  Briefcase,
  IndianRupee,
  Building2,
  Globe,
  Shield,
  Loader2,
  ChevronRight,
  Clock,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend
} from 'recharts';

interface Milestone {
  year: number;
  title: string;
  salary_lpa: number;
  skills_gained: string[];
  key_achievement: string;
  promotion_likelihood: number;
}

interface TrajectoryData {
  current_position: {
    title: string;
    salary_lpa: number;
    year: number;
    skills_required: string[];
    description: string;
  };
  milestones: Milestone[];
}

interface SalaryProjection {
  year: number;
  min: number;
  avg: number;
  max: number;
}

interface SkillMilestone {
  year: number;
  skills_to_learn: string[];
  certifications: string[];
  priority: string;
}

interface IndustryInsights {
  market_demand: string;
  growth_rate_percent: number;
  top_hiring_companies: string[];
  remote_opportunities_percent: number;
  job_security_rating: number;
  industry_trends: string[];
}

const CareerTrajectoryNoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeId, goal } = useResume();

  const [isLoading, setIsLoading] = useState(true);
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryData | null>(null);
  const [salaryProjections, setSalaryProjections] = useState<SalaryProjection[]>([]);
  const [skillMilestones, setSkillMilestones] = useState<SkillMilestone[]>([]);
  const [industryInsights, setIndustryInsights] = useState<IndustryInsights | null>(null);
  const [selectedYear, setSelectedYear] = useState(0);

  useEffect(() => {
    if (!resumeId) {
      navigate('/setup');
      return;
    }
    loadTrajectory();
  }, [resumeId]);

  const loadTrajectory = async () => {
    try {
      const response = await fetch(
        'https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/career-trajectory',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_id: resumeId }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setTrajectoryData(result.data.trajectory_data);
      setSalaryProjections(result.data.salary_projections || []);
      setSkillMilestones(result.data.skill_milestones || []);
      setIndustryInsights(result.data.industry_insights);

    } catch (error) {
      console.error('Failed to load trajectory:', error);
      toast({
        title: "Error",
        description: "Failed to generate career trajectory. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedMilestone = () => {
    if (!trajectoryData) return null;
    if (selectedYear === 0) return trajectoryData.current_position;
    return trajectoryData.milestones.find(m => m.year === selectedYear);
  };

  const selectedMilestone = getSelectedMilestone();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Generating Your Career Trajectory</h2>
          <p className="text-muted-foreground">AI is analyzing your potential growth path...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Career Trajectory</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Goal Header */}
        <div className="mb-8 text-center">
          <Badge className="mb-2 bg-primary/10 text-primary border-primary/20">
            5-Year Projection
          </Badge>
          <h1 className="text-3xl font-bold">Your Path to <span className="text-primary">{goal}</span></h1>
        </div>

        {/* Interactive Timeline */}
        {trajectoryData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Career Progression Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Timeline Navigation */}
                <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
                  <button
                    onClick={() => setSelectedYear(0)}
                    className={`flex flex-col items-center min-w-[100px] p-4 rounded-xl transition-all ${
                      selectedYear === 0 
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <span className="text-sm font-medium">Now</span>
                    <span className="text-xs opacity-80">Year 0</span>
                  </button>
                  
                  {trajectoryData.milestones.map((milestone, index) => (
                    <div key={milestone.year} className="flex items-center">
                      <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />
                      <button
                        onClick={() => setSelectedYear(milestone.year)}
                        className={`flex flex-col items-center min-w-[100px] p-4 rounded-xl transition-all ${
                          selectedYear === milestone.year 
                            ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <span className="text-sm font-medium">Year {milestone.year}</span>
                        <span className="text-xs opacity-80">₹{milestone.salary_lpa} LPA</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Selected Milestone Details */}
                {selectedMilestone && (
                  <motion.div
                    key={selectedYear}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid md:grid-cols-2 gap-6"
                  >
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold text-primary">
                          {'title' in selectedMilestone ? selectedMilestone.title : ''}
                        </h3>
                        {'description' in selectedMilestone && (
                          <p className="text-muted-foreground mt-2">{selectedMilestone.description}</p>
                        )}
                        {'key_achievement' in selectedMilestone && (
                          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium mb-1">
                              <Award className="w-4 h-4" />
                              Key Achievement
                            </div>
                            <p className="text-sm">{selectedMilestone.key_achievement}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-5 h-5 text-primary" />
                          <span className="text-xl font-bold">
                            ₹{('salary_lpa' in selectedMilestone ? selectedMilestone.salary_lpa : 0)} LPA
                          </span>
                        </div>
                        {'promotion_likelihood' in selectedMilestone && (
                          <Badge variant="outline">
                            {selectedMilestone.promotion_likelihood}% Promotion Likelihood
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        {'skills_gained' in selectedMilestone ? 'Skills to Gain' : 'Skills Required'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(('skills_gained' in selectedMilestone 
                          ? selectedMilestone.skills_gained 
                          : selectedMilestone.skills_required) || []).map((skill, i) => (
                          <Badge key={i} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Salary Chart */}
        {salaryProjections.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-primary" />
                  Salary Growth Projection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salaryProjections}>
                      <defs>
                        <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="year" 
                        tickFormatter={(value) => `Year ${value}`}
                      />
                      <YAxis 
                        tickFormatter={(value) => `₹${value}L`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`₹${value} LPA`, '']}
                        labelFormatter={(label) => `Year ${label}`}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="max"
                        name="Maximum"
                        stroke="hsl(var(--primary))"
                        fill="url(#colorMax)"
                        strokeDasharray="5 5"
                      />
                      <Area
                        type="monotone"
                        dataKey="avg"
                        name="Average"
                        stroke="hsl(var(--primary))"
                        fill="url(#colorAvg)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="min"
                        name="Minimum"
                        stroke="hsl(var(--muted-foreground))"
                        fill="none"
                        strokeDasharray="3 3"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Skill Milestones */}
          {skillMilestones.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Skill Development Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skillMilestones.map((milestone, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border ${
                        milestone.priority === 'high' 
                          ? 'border-primary/30 bg-primary/5' 
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Year {milestone.year}
                        </Badge>
                        <Badge 
                          variant={milestone.priority === 'high' ? 'default' : 'secondary'}
                        >
                          {milestone.priority} priority
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-2">Skills to Learn:</p>
                        <div className="flex flex-wrap gap-1">
                          {milestone.skills_to_learn.map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {milestone.certifications.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1 text-muted-foreground">Certifications:</p>
                          <ul className="text-sm">
                            {milestone.certifications.map((cert, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <Award className="w-3 h-3 text-primary" />
                                {cert}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Industry Insights */}
          {industryInsights && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Industry Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {industryInsights.growth_rate_percent}%
                      </div>
                      <div className="text-sm text-muted-foreground">Growth Rate</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {industryInsights.remote_opportunities_percent}%
                      </div>
                      <div className="text-sm text-muted-foreground">Remote Jobs</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      <span className="font-medium">Job Security</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={industryInsights.job_security_rating * 10} 
                        className="w-24 h-2"
                      />
                      <span className="font-bold">{industryInsights.job_security_rating}/10</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Building2 className="w-4 h-4" />
                      Top Hiring Companies
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {industryInsights.top_hiring_companies.map((company, i) => (
                        <Badge key={i} variant="secondary">{company}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Globe className="w-4 h-4" />
                      Industry Trends
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {industryInsights.industry_trends.map((trend, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                          {trend}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CareerTrajectoryNoAuth;
