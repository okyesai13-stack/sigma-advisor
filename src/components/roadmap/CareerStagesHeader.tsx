
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, Target, Sparkles, Flag, CheckCircle2, Circle } from 'lucide-react';

interface CareerStagesHeaderProps {
    userGoal: string | null;
    overallProgress: number;
    currentStage: 'short_term' | 'mid_term' | 'long_term' | null;
    stages: Array<{
        id: 'short_term' | 'mid_term' | 'long_term';
        overallProgress: number;
    }>;
}

const CareerStagesHeader = ({ userGoal, overallProgress, currentStage, stages }: CareerStagesHeaderProps) => {
    const navigate = useNavigate();

    const getStageLabel = () => {
        switch (currentStage) {
            case 'short_term':
                return 'Short Term (0-12 months)';
            case 'mid_term':
                return 'Mid Term (1-3 years)';
            case 'long_term':
                return 'Long Term (3-5 years)';
            default:
                return 'Getting Started';
        }
    };

    const getCurrentStageProgress = () => {
        if (!currentStage) return 0;
        const stage = stages.find(s => s.id === currentStage);
        return stage?.overallProgress || 0;
    };

    const getStageProgress = (stageId: 'short_term' | 'mid_term' | 'long_term') => {
        const stage = stages.find(s => s.id === stageId);
        return stage?.overallProgress || 0;
    };

    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-border/50 p-3 md:p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col items-center">
                {/* Header Row: Title & Badge */}
                <div className="text-center mb-3">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium mb-1">
                        <Sparkles className="h-3 w-3" />
                        Career Roadmap
                    </div>
                    <h1 className="text-lg font-bold text-center">
                        Your Path to Success
                    </h1>
                </div>

                <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    {/* Goal Info */}
                    <div className="flex flex-col items-center gap-2">
                        {userGoal ? (
                            <>
                                <Badge variant="outline" className="px-3 py-1 text-xs font-semibold bg-background/80 border-primary/30">
                                    <Flag className="h-3 w-3 mr-1.5 text-primary" />
                                    {userGoal}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                    Current: {getStageLabel()}
                                </span>
                            </>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/profile')}
                                className="h-8 text-xs"
                            >
                                <Target className="h-3 w-3 mr-1.5" />
                                Set Your Goal
                            </Button>
                        )}
                    </div>

                    {/* Progress Stats */}
                    <div className="w-full space-y-3">
                        {/* Step Indicators */}
                        <div className="flex items-center justify-between px-2">
                            {/* Short Term */}
                            <div className="flex flex-col items-center gap-1">
                                {currentStage === 'short_term' ? (
                                    <div className="w-3 h-3 rounded-full bg-primary border border-primary flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    </div>
                                ) : getStageProgress('short_term') >= 100 ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                ) : (
                                    <Circle className="w-3 h-3 text-muted-foreground/50" />
                                )}
                                <span className="text-[10px] font-medium text-muted-foreground">Short</span>
                            </div>

                            <div className={`flex-1 h-px mx-2 ${getStageProgress('short_term') >= 100 ? 'bg-green-500/50' : 'bg-border'}`}></div>

                            {/* Mid Term */}
                            <div className="flex flex-col items-center gap-1">
                                {currentStage === 'mid_term' ? (
                                    <div className="w-3 h-3 rounded-full bg-primary border border-primary flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    </div>
                                ) : getStageProgress('mid_term') >= 100 ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                ) : (
                                    <Circle className="w-3 h-3 text-muted-foreground/50" />
                                )}
                                <span className="text-[10px] font-medium text-muted-foreground">Mid</span>
                            </div>

                            <div className={`flex-1 h-px mx-2 ${getStageProgress('mid_term') >= 100 ? 'bg-green-500/50' : 'bg-border'}`}></div>

                            {/* Long Term */}
                            <div className="flex flex-col items-center gap-1">
                                {currentStage === 'long_term' ? (
                                    <div className="w-3 h-3 rounded-full bg-primary border border-primary flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    </div>
                                ) : getStageProgress('long_term') >= 100 ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                ) : (
                                    <Circle className="w-3 h-3 text-muted-foreground/50" />
                                )}
                                <span className="text-[10px] font-medium text-muted-foreground">Long</span>
                            </div>
                        </div>

                        {/* Active Stage Progress */}
                        {currentStage && (
                            <div className="bg-background/50 rounded-lg p-2 border border-border/30">
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                    <span className="text-muted-foreground font-medium">
                                        {currentStage === 'short_term' ? 'Phase 1 Progress' :
                                            currentStage === 'mid_term' ? 'Phase 2 Progress' :
                                                'Phase 3 Progress'}
                                    </span>
                                    <span className="font-bold text-primary">{getCurrentStageProgress()}%</span>
                                </div>
                                <Progress value={getCurrentStageProgress()} className="h-1.5" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-3 pt-2 w-full flex justify-center border-t border-border/30">
                    <Button
                        onClick={() => navigate('/advisor')}
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground hover:text-primary"
                    >
                        <MessageSquare className="h-3 w-3 mr-1.5" />
                        Need help with your plan? Ask Esha
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CareerStagesHeader;
