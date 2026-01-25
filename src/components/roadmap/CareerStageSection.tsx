
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CareerStage, StageStep } from '@/hooks/useCareerStagesRoadmap';
import {
    ChevronDown,
    ChevronRight,
    Lock,
    CheckCircle2,
    Play,
    Clock,
    Target,
    BookOpen,
    Briefcase,
    TrendingUp,
    Award,
    MapPin,
    Calendar,
    Star,
    ArrowRight,
    Circle,
    User,
    Code2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CareerStageSectionProps {
    stage: CareerStage;
    isActive: boolean;
}

const CareerStageSection = ({ stage, isActive }: CareerStageSectionProps) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(isActive);
    const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

    const getStageColor = () => {
        switch (stage.id) {
            case 'short_term':
                return 'from-blue-500 to-blue-600';
            case 'mid_term':
                return 'from-purple-500 to-purple-600';
            case 'long_term':
                return 'from-amber-500 to-amber-600';
            default:
                return 'from-primary to-primary/80';
        }
    };

    const getStageIcon = () => {
        switch (stage.id) {
            case 'short_term':
                return <Target className="h-5 w-5" />;
            case 'mid_term':
                return <TrendingUp className="h-5 w-5" />;
            case 'long_term':
                return <Award className="h-5 w-5" />;
            default:
                return <Target className="h-5 w-5" />;
        }
    };

    const getStatusBadge = () => {
        switch (stage.status) {
            case 'completed':
                return (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                    </Badge>
                );
            case 'active':
                return (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Play className="h-3 w-3 mr-1" />
                        Active
                    </Badge>
                );
            case 'locked':
                return (
                    <Badge variant="secondary" className="text-muted-foreground">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                    </Badge>
                );
        }
    };

    const isLocked = stage.status === 'locked';

    const handleStepClick = (step: StageStep) => {
        if (step.status === 'locked') return;

        // Toggle dropdown for steps that have data
        if (step.data && (Array.isArray(step.data) ? step.data.length > 0 : Object.keys(step.data).length > 0)) {
            setExpandedStepId(expandedStepId === step.id ? null : step.id);
        } else {
            navigate(step.route);
        }
    };

    return (
        <Card className={cn(
            "transition-all duration-300 overflow-hidden",
            isActive && "ring-2 ring-primary/30 shadow-lg",
            stage.status === 'completed' && "border-green-500/20",
            isLocked && "opacity-60"
        )}>
            <Collapsible open={isExpanded && !isLocked} onOpenChange={setIsExpanded}>
                {/* Stage Header with Role */}
                <CollapsibleTrigger asChild disabled={isLocked}>
                    <CardHeader
                        className={cn(
                            "cursor-pointer transition-colors p-0",
                            isLocked && "cursor-not-allowed"
                        )}
                    >
                        {/* Role Banner */}
                        <div className={cn(
                            "p-4 bg-gradient-to-r text-white",
                            getStageColor()
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/20">
                                        {getStageIcon()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg">
                                                {stage.role ? stage.role.role : stage.name}
                                            </h3>
                                            <span className="text-sm text-white/80">
                                                ({stage.role ? stage.name : stage.timeline})
                                            </span>
                                            {stage.startDate && (
                                                <div className="flex items-center gap-1 text-xs text-white/70 bg-white/10 px-2 py-1 rounded-full">
                                                    <Calendar className="h-3 w-3" />
                                                    Started: {new Date(stage.startDate).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge()}
                                    {!isLocked && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsExpanded(!isExpanded);
                                            }}
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Role Details */}
                            {stage.role && (
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/80">
                                    <span className="flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        {stage.role.domain}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        💰 {stage.role.salary_range}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        📊 {stage.role.match_score}% Match
                                    </span>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {!isLocked && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-white/80 mb-1">
                                        <span>Progress</span>
                                        <span>{stage.overallProgress}%</span>
                                    </div>
                                    <Progress value={stage.overallProgress} className="h-2 bg-white/20" />
                                </div>
                            )}
                        </div>

                        {/* You are here indicator */}
                        {isActive && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b">
                                <div className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    You are here
                                </div>
                            </div>
                        )}
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="p-4">
                        {/* Steps List - Reversed Order (7 at top, 1 at bottom) */}
                        <div className="space-y-4">
                            {[...stage.steps].reverse().map((step, index) => {
                                const actualIndex = stage.steps.length - 1 - index;
                                return (
                                    <StepCardDetailed
                                        key={step.id}
                                        step={step}
                                        stepIndex={actualIndex}
                                        isExpanded={expandedStepId === step.id}
                                        onToggle={() => handleStepClick(step)}
                                        onNavigate={(route) => navigate(route)}
                                        stageLocked={isLocked}
                                    />
                                );
                            })}
                        </div>

                        {/* Locked Message for locked stages */}
                        {stage.status === 'locked' && (
                            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center">
                                <Lock className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Complete the previous stage and get placed to unlock this stage
                                </p>
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
};

// Detailed Step Card Component with Dropdown
const StepCardDetailed = ({
    step,
    stepIndex,
    isExpanded,
    onToggle,
    onNavigate,
    stageLocked
}: {
    step: StageStep;
    stepIndex: number;
    isExpanded: boolean;
    onToggle: () => void;
    onNavigate: (route: string) => void;
    stageLocked: boolean;
}) => {
    const getStepIcon = () => {
        if (step.id.includes('career-analysis')) return <Target className="h-8 w-8" />;
        if (step.id.includes('skill-validation')) return <CheckCircle2 className="h-8 w-8" />;
        if (step.id.includes('learning')) return <BookOpen className="h-8 w-8" />;
        if (step.id.includes('project')) return <Code2 className="h-8 w-8" />;
        if (step.id.includes('portfolio')) return <User className="h-8 w-8" />;
        if (step.id.includes('ready-to-market')) return <TrendingUp className="h-8 w-8" />;
        if (step.id.includes('job')) return <Briefcase className="h-8 w-8" />;
        return <Target className="h-8 w-8" />;
    };

    const hasDropdown = step.data && (Array.isArray(step.data) ? step.data.length > 0 : Object.keys(step.data).length > 0);
    const isStepLocked = step.status === 'locked' || stageLocked;

    // Get dropdown items based on step type
    const getDropdownItems = () => {
        if (!step.data) return [];
        if (Array.isArray(step.data)) return step.data;
        return [];
    };

    const items = getDropdownItems();

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: stepIndex * 0.05 }}
        >
            <Card
                className={cn(
                    "transition-all duration-300 cursor-pointer hover:shadow-lg border-2",
                    step.status === 'completed' && "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300",
                    step.status === 'active' && "bg-gradient-to-r from-primary/5 to-blue-50 border-primary/30 hover:border-primary/50 shadow-md",
                    step.status === 'locked' && "bg-gradient-to-r from-muted/30 to-background border-border hover:border-border/80 opacity-60"
                )}
                onClick={() => !isStepLocked && onToggle()}
            >
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        {/* Step Icon & Number */}
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg shrink-0",
                            step.status === 'completed' && "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
                            step.status === 'active' && "bg-gradient-to-br from-primary to-blue-600 text-white",
                            step.status === 'locked' && "bg-gradient-to-br from-muted to-muted-foreground/20 text-muted-foreground"
                        )}>
                            {step.status === 'completed' ? (
                                <CheckCircle2 className="h-8 w-8" />
                            ) : (
                                getStepIcon()
                            )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <h3 className={cn(
                                        "text-xl font-bold",
                                        step.status === 'completed' && "text-green-700",
                                        step.status === 'active' && "text-primary",
                                        step.status === 'locked' && "text-muted-foreground"
                                    )}>
                                        {step.number}. {step.name}
                                    </h3>
                                    {step.status === 'active' && (
                                        <Badge className="bg-primary/10 text-primary border-primary/30">
                                            <Clock className="h-3 w-3 mr-1" />
                                            In Progress
                                        </Badge>
                                    )}
                                </div>
                                {/* Timeline Badge */}
                                {step.timeline && (
                                    <div className="flex items-center gap-2">
                                        {step.timeline.startDate && step.timeline.endDate && step.timeline.startDate !== step.timeline.endDate ? (
                                            <Badge variant="outline" className="text-xs">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {new Date(step.timeline.startDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })} - {new Date(step.timeline.endDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Badge>
                                        ) : step.timeline.startDate ? (
                                            <Badge variant="outline" className="text-xs">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {new Date(step.timeline.startDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Badge>
                                        ) : null}
                                        <Badge variant="secondary" className="text-xs">
                                            {step.timeline.duration}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            <p className="text-muted-foreground text-sm mb-2">
                                {step.description}
                            </p>

                            {/* Progress Summary for each step type */}
                            {step.status !== 'locked' && (step.progress > 0 || step.completionText) && (
                                <div className="space-y-2">
                                    {step.completionText && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                {step.completionText}
                                            </span>
                                            <span className="font-bold text-primary">
                                                {step.progress}% overall
                                            </span>
                                        </div>
                                    )}
                                    {!step.completionText && step.progress > 0 && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                Progress
                                            </span>
                                            <span className="font-bold text-primary">
                                                {step.progress}% overall
                                            </span>
                                        </div>
                                    )}
                                    <Progress
                                        value={step.progress}
                                        className="h-2 bg-muted/50"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Action Indicators */}
                        <div className="flex items-center gap-2 shrink-0">
                            {step.status === 'completed' && (
                                <Badge className="bg-green-100 text-green-700 border-green-300">
                                    <Star className="h-3 w-3 mr-1" />
                                    Done
                                </Badge>
                            )}
                            {hasDropdown && !isStepLocked && (
                                <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    "hover:bg-primary/10"
                                )}>
                                    {isExpanded ? (
                                        <ChevronDown className="h-5 w-5 text-primary" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                            )}
                            {!hasDropdown && !isStepLocked && (
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            {isStepLocked && (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
                    </div>

                    {/* Dropdown Content */}
                    <AnimatePresence>
                        {isExpanded && hasDropdown && items.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-6 pt-6 border-t border-border/50"
                            >
                                {/* Dropdown Header based on step type */}
                                <DropdownHeader step={step} />

                                {/* Items Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {items.map((item: any, idx: number) => (
                                        <DropdownItemCard
                                            key={item.id || idx}
                                            item={item}
                                            stepId={step.id}
                                            onNavigate={onNavigate}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Empty state for steps with no data yet */}
                    <AnimatePresence>
                        {isExpanded && (!items || items.length === 0) && step.status !== 'locked' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-6 pt-6 border-t border-border/50"
                            >
                                <EmptyStateForStep step={step} onNavigate={onNavigate} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
};

// Dropdown Header Component
const DropdownHeader = ({ step }: { step: StageStep }) => {
    if (step.id.includes('learning')) {
        return (
            <div className="mb-2">
                <h4 className="font-semibold text-base mb-1 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Your Learning Journey
                </h4>
                <p className="text-sm text-muted-foreground">
                    Skills and courses for your career path
                </p>
            </div>
        );
    }

    if (step.id.includes('skill-validation')) {
        return (
            <div className="mb-2">
                <h4 className="font-semibold text-base mb-1 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Skills Assessment
                </h4>
                <p className="text-sm text-muted-foreground">
                    Skills identified for your target role
                </p>
            </div>
        );
    }

    if (step.id.includes('project')) {
        return (
            <div className="mb-2">
                <h4 className="font-semibold text-base mb-1 flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-primary" />
                    Your Portfolio Projects
                </h4>
                <p className="text-sm text-muted-foreground">
                    Track progress on your portfolio projects
                </p>
            </div>
        );
    }

    if (step.id.includes('portfolio')) {
        return (
            <div className="mb-2">
                <h4 className="font-semibold text-base mb-1 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Portfolio Requirements
                </h4>
                <p className="text-sm text-muted-foreground">
                    Complete these requirements to build your professional portfolio
                </p>
            </div>
        );
    }

    if (step.id.includes('ready-to-market')) {
        return (
            <div className="mb-2">
                <h4 className="font-semibold text-base mb-1 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Job Market Preparation
                </h4>
                <p className="text-sm text-muted-foreground">
                    Essential steps to prepare yourself for the job market
                </p>
            </div>
        );
    }

    if (step.id.includes('job')) {
        return (
            <div className="mb-2">
                <h4 className="font-semibold text-base mb-1 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Job Opportunities
                </h4>
                <p className="text-sm text-muted-foreground">
                    Matched job recommendations for you
                </p>
            </div>
        );
    }

    return null;
};

// Dropdown Item Card Component
const DropdownItemCard = ({
    item,
    stepId,
    onNavigate
}: {
    item: any;
    stepId: string;
    onNavigate: (route: string) => void;
}) => {
    const isCompleted = item.status === 'completed' || item.completed;
    const isInProgress = item.status === 'in_progress' || item.status === 'learning';
    const isLearningStarted = item.isLearningStarted;
    const isComingSoon = item.status === 'coming_soon';

    // Calculate progress for learning items
    const progress = item.progress || 0;
    const totalSteps = item.totalSteps || 0;
    const completedSteps = item.completedSteps || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
                "group p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md",
                isCompleted
                    ? "bg-green-50 border-green-200 hover:border-green-300"
                    : isInProgress || isLearningStarted
                        ? "bg-blue-50 border-blue-200 hover:border-blue-300"
                        : isComingSoon
                            ? "bg-amber-50 border-amber-200 hover:border-amber-300"
                            : "bg-background/60 hover:bg-background border-border/50 hover:border-primary/30"
            )}
            onClick={(e) => {
                e.stopPropagation();
                if (item.url && item.url !== '#') onNavigate(item.url);
            }}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                    <h4 className={cn(
                        "font-semibold text-sm transition-colors line-clamp-2",
                        isCompleted
                            ? "text-green-700"
                            : isInProgress || isLearningStarted
                                ? "text-blue-700"
                                : isComingSoon
                                    ? "text-amber-700"
                                    : "group-hover:text-primary"
                    )}>
                        {item.title || item.skill_name || item.skill || item.job_title || 'Item'}
                    </h4>
                </div>

                {/* Status Badge */}
                <div className="ml-2 shrink-0">
                    {isCompleted && (
                        <Badge className="bg-green-100 text-green-700 border-green-300 text-xs px-2 py-0.5">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Done
                        </Badge>
                    )}
                    {!isCompleted && (isInProgress || isLearningStarted) && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs px-2 py-0.5">
                            <Clock className="h-3 w-3 mr-1" />
                            {isLearningStarted ? 'Learning' : 'In Progress'}
                        </Badge>
                    )}
                    {isComingSoon && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs px-2 py-0.5">
                            <Clock className="h-3 w-3 mr-1" />
                            Coming Soon
                        </Badge>
                    )}
                    {!isCompleted && !isInProgress && !isLearningStarted && !isComingSoon && (
                        <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-xs px-2 py-0.5">
                            <Circle className="h-3 w-3 mr-1" />
                            Not Started
                        </Badge>
                    )}
                </div>
            </div>

            {/* Description */}
            {item.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {item.description}
                </p>
            )}

            {/* Career Role Context */}
            {item.careerRole && (
                <div className="flex items-center gap-1 mb-2">
                    <Target className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary font-medium">
                        {item.careerRole}
                    </span>
                </div>
            )}

            {/* Progress Bar */}
            {progress > 0 && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                            {totalSteps > 0 ? `${completedSteps}/${totalSteps} steps` : 'Progress'}
                        </span>
                        <span className="font-medium text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                </div>
            )}

            {/* Job-specific details */}
            {stepId.includes('job') && item.company_name && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    <span>{item.company_name}</span>
                    {item.location && (
                        <>
                            <span>•</span>
                            <span>{item.location}</span>
                        </>
                    )}
                </div>
            )}

            {/* Navigate Arrow */}
            <div className="flex justify-end mt-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
        </motion.div>
    );
};

// Empty State Component
const EmptyStateForStep = ({
    step,
    onNavigate
}: {
    step: StageStep;
    onNavigate: (route: string) => void;
}) => {
    const getEmptyStateContent = () => {
        if (step.id.includes('learning')) {
            return {
                icon: <BookOpen className="h-8 w-8 text-muted-foreground" />,
                title: 'No Learning Journey Yet',
                description: 'Complete your career analysis and skill validation to get personalized learning recommendations.',
                buttonText: 'Start Career Analysis',
                buttonRoute: '/sigma'
            };
        }

        if (step.id.includes('skill-validation')) {
            return {
                icon: <CheckCircle2 className="h-8 w-8 text-muted-foreground" />,
                title: 'Skill Validation Pending',
                description: 'Complete your career analysis to get AI-powered skill validation.',
                buttonText: 'Start Analysis',
                buttonRoute: '/sigma'
            };
        }

        if (step.id.includes('project')) {
            return {
                icon: <Code2 className="h-8 w-8 text-muted-foreground" />,
                title: 'No Projects Yet',
                description: 'Start building your portfolio with AI-generated project ideas.',
                buttonText: 'Generate Ideas',
                buttonRoute: '/projects'
            };
        }

        if (step.id.includes('job')) {
            return {
                icon: <Briefcase className="h-8 w-8 text-muted-foreground" />,
                title: 'No Job Recommendations Yet',
                description: 'Complete your profile to get personalized job recommendations.',
                buttonText: 'View Jobs',
                buttonRoute: '/dashboard'
            };
        }

        return {
            icon: <Target className="h-8 w-8 text-muted-foreground" />,
            title: 'Not Started',
            description: 'Click to begin this step.',
            buttonText: 'Start',
            buttonRoute: step.route
        };
    };

    const content = getEmptyStateContent();

    return (
        <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                {content.icon}
            </div>
            <h5 className="font-medium text-base mb-2">{content.title}</h5>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                {content.description}
            </p>
            <Button
                variant="outline"
                onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(content.buttonRoute);
                }}
                className="gap-2"
            >
                <Target className="h-4 w-4" />
                {content.buttonText}
            </Button>
        </div>
    );
};

export default CareerStageSection;
