
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useCareerStagesRoadmap } from '@/hooks/useCareerStagesRoadmap';
import CareerStagesHeader from '@/components/roadmap/CareerStagesHeader';
import CareerStageSection from '@/components/roadmap/CareerStageSection';
import { Trophy, Flag, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

const GoalsPage = () => {
  const { user } = useAuth();
  const { userGoal, stages, currentStage, overallProgress, isLoading } = useCareerStagesRoadmap();

  if (!user) {
    return (
      <MainLayout pageTitle="Goals">
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Please sign in to view your goals.</p>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout pageTitle="Goals">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  // Check if all stages are completed
  const allCompleted = stages.every(stage => stage.isJobPlaced);

  return (
    <MainLayout pageTitle="Goals">
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

          {/* Goal Achievement Banner */}
          {allCompleted ? (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-2xl">
                <CardContent className="p-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
                  >
                    <Trophy className="h-10 w-10" />
                  </motion.div>
                  <h1 className="text-3xl font-bold mb-2">🎉 Career Goal Achieved!</h1>
                  <p className="text-green-100 text-lg">
                    Congratulations! You've completed your entire career journey to become a {userGoal || 'Professional'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* Header with Goal */
            <CareerStagesHeader
              userGoal={userGoal}
              overallProgress={overallProgress}
              currentStage={currentStage}
              stages={stages}
            />
          )}

          {/* Journey Start Indicator */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <Flag className="h-4 w-4" />
              Start Your Journey
            </div>
          </div>

          {/* Career Stages - Short Term first, then Mid, then Long */}
          <div className="space-y-6">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Arrow connector between stages */}
                {index > 0 && (
                  <div className="flex justify-center py-4">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <ArrowDown className="h-6 w-6" />
                      <span className="text-xs mt-1">
                        {stage.status === 'locked' ? 'Get placed to unlock' : 'Next stage'}
                      </span>
                    </div>
                  </div>
                )}

                <CareerStageSection
                  stage={stage}
                  isActive={currentStage === stage.id}
                />
              </motion.div>
            ))}
          </div>

          {/* Goal Achievement at the End */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3 py-8 px-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl border border-primary/20"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 text-2xl">
              🎯
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">
                {userGoal || 'Your Dream Career'}
              </p>
              <p className="text-xs text-muted-foreground">
                Your ultimate career goal
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default GoalsPage;
