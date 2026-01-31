import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  MessageCircle, 
  FileUp, 
  TrendingUp, 
  Brain,
  Mic,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

const GuidanceSection = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const guidanceOptions = [
    {
      id: 'advisor',
      title: 'AI Career Advisor',
      description: 'Get personalized career guidance through an intelligent conversation',
      icon: MessageCircle,
      gradient: 'from-violet-500/20 via-purple-500/10 to-primary/20',
      iconColor: 'text-violet-500',
      borderColor: 'border-violet-500/30',
      hoverBg: 'hover:bg-violet-500/5',
      action: () => navigate('/advisor'),
      badge: 'Most Popular',
      badgeVariant: 'default' as const,
    },
    {
      id: 'trajectory',
      title: '5-Year Career Trajectory',
      description: 'Visualize your career growth with salary projections',
      icon: TrendingUp,
      gradient: 'from-emerald-500/20 via-teal-500/10 to-cyan-500/20',
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-500/30',
      hoverBg: 'hover:bg-emerald-500/5',
      action: () => navigate('/career-trajectory'),
      badge: 'Interactive',
      badgeVariant: 'secondary' as const,
    },
    {
      id: 'resume',
      title: 'Upgrade Resume',
      description: 'Generate an ATS-optimized resume instantly',
      icon: FileUp,
      gradient: 'from-blue-500/20 via-indigo-500/10 to-violet-500/20',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/30',
      hoverBg: 'hover:bg-blue-500/5',
      action: () => navigate('/resume-upgrade'),
      badge: 'AI Powered',
      badgeVariant: 'outline' as const,
    },
    {
      id: 'interview',
      title: 'Mock Interview',
      description: 'Practice with AI-driven interview simulation',
      icon: Mic,
      gradient: 'from-amber-500/20 via-orange-500/10 to-red-500/20',
      iconColor: 'text-amber-500',
      borderColor: 'border-amber-500/30',
      hoverBg: 'hover:bg-amber-500/5',
      action: () => navigate('/mock-interview'),
      badge: 'New',
      badgeVariant: 'destructive' as const,
    },
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Choose your next step to accelerate your career</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {guidanceOptions.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onMouseEnter={() => setHoveredCard(option.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <Card 
              className={`
                relative overflow-hidden cursor-pointer transition-all duration-300
                bg-gradient-to-br ${option.gradient}
                border ${option.borderColor}
                ${option.hoverBg}
                hover:shadow-lg hover:shadow-primary/5
                hover:-translate-y-1
                group
              `}
              onClick={option.action}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <motion.div 
                    className={`p-2.5 rounded-xl bg-background/80 backdrop-blur-sm shadow-sm ${option.iconColor}`}
                    animate={{ 
                      scale: hoveredCard === option.id ? 1.1 : 1,
                      rotate: hoveredCard === option.id ? 5 : 0
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <option.icon className="w-5 h-5" />
                  </motion.div>
                  <Badge variant={option.badgeVariant} className="text-xs">
                    {option.badge}
                  </Badge>
                </div>

                <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  {option.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {option.description}
                </p>

                <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Get Started
                  <motion.div
                    animate={{ x: hoveredCard === option.id ? 4 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </motion.div>
                </div>
              </CardContent>

              {/* Animated shine effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                animate={{ 
                  translateX: hoveredCard === option.id ? '200%' : '-100%'
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Featured AI Advisor Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-4"
      >
        <Card className="bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10 border-primary/20 overflow-hidden relative">
          <CardContent className="py-5 px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <motion.div 
                    className="absolute -inset-1 rounded-full bg-primary/20"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Not sure where to start?</h3>
                  <p className="text-muted-foreground text-sm">
                    Our AI advisor analyzes your profile and suggests the best next steps
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/advisor')}
                className="gap-2 shadow-lg shadow-primary/20"
                size="lg"
              >
                <Brain className="w-5 h-5" />
                Ask AI Advisor
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
};

export default GuidanceSection;
