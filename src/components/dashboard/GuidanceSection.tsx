import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileUp, 
  ChevronRight,
  Zap,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

const GuidanceSection = () => {
  const navigate = useNavigate();

  const resumeFeatures = [
    'ATS-optimized formatting',
    'AI-enhanced content',
    'One-click PDF export',
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Accelerate your career journey</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card 
          className="
            relative overflow-hidden cursor-pointer transition-all duration-300
            bg-gradient-to-br from-primary/15 via-violet-500/10 to-blue-500/15
            border border-primary/30
            hover:shadow-xl hover:shadow-primary/10
            hover:-translate-y-1
            group
          "
          onClick={() => navigate('/resume-upgrade')}
        >
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Left side - Icon and content */}
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <motion.div 
                    className="p-3 rounded-xl bg-primary/20 text-primary shadow-lg shadow-primary/20"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <FileUp className="w-6 h-6" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                        Upgrade Your Resume
                      </h3>
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Powered
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Transform your resume into a professional, ATS-friendly document that gets noticed
                    </p>
                  </div>
                </div>

                {/* Features list */}
                <div className="flex flex-wrap gap-3 ml-16">
                  {resumeFeatures.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {feature}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right side - CTA button */}
              <div className="flex items-center">
                <Button 
                  size="lg"
                  className="gap-2 shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all"
                >
                  Get Started
                  <motion.div
                    className="inline-flex"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </Button>
              </div>
            </div>
          </CardContent>

          {/* Animated background gradient */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full pointer-events-none"
            animate={{ translateX: ['100%', '-100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          />
        </Card>
      </motion.div>
    </section>
  );
};

export default GuidanceSection;
