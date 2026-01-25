
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface StageStep {
    id: string;
    name: string;
    number: number;
    description: string;
    status: 'locked' | 'active' | 'completed';
    progress: number;
    timeline?: {
        duration?: string;
        startDate?: string;
        endDate?: string;
    };
    data?: any;
    route: string;
    completionText?: string;
}

export interface CareerStage {
    id: 'short_term' | 'mid_term' | 'long_term';
    name: string;
    timeline: string;
    status: 'locked' | 'active' | 'completed';
    overallProgress: number;
    steps: StageStep[];
    role?: {
        role: string;
        domain: string;
        salary_range: string;
        match_score: number;
    };
    startDate?: string;
    isJobPlaced: boolean;
}

export const useCareerStagesRoadmap = () => {
    const { user } = useAuth();
    const [stages, setStages] = useState<CareerStage[]>([]);
    const [userGoal, setUserGoal] = useState<string | null>(null);
    const [overallProgress, setOverallProgress] = useState(0);
    const [currentStage, setCurrentStage] = useState<'short_term' | 'mid_term' | 'long_term' | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Raw data state
    const [journeyState, setJourneyState] = useState<any>(null);
    const [careerAdvice, setCareerAdvice] = useState<any>(null);
    const [skillValidation, setSkillValidation] = useState<any>(null);
    const [learningJourneys, setLearningJourneys] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [resumeVersions, setResumeVersions] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [interviewPreps, setInterviewPreps] = useState<any[]>([]);

    // Term state (mocked for now as per previous implementation logic)
    const [termState] = useState({
        short_term_job_achieved: false,
        mid_term_job_achieved: false,
    });

    useEffect(() => {
        if (user) {
            loadAllData();
        }
    }, [user]);

    const loadAllData = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            const [
                journeyResult,
                profileResult,
                careerResult,
                skillResult,
                learningResult,
                projectResult,
                resumeResult,
                jobResult,
                interviewResult
            ] = await Promise.all([
                supabase.rpc('get_sigma_journey_state', { p_user_id: user.id }),
                supabase.from('users_profile').select('goal_type, goal_description').eq('id', user.id).maybeSingle(),
                supabase.from('resume_career_advice').select('career_advice').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
                supabase.from('skill_validations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
                supabase.from('user_learning_journey').select('*').eq('user_id', user.id),
                supabase.from('project_ideas').select('*').eq('user_id', user.id),
                supabase.from('resume_versions').select('*').eq('user_id', user.id),
                supabase.from('ai_job_recommendations').select('*').eq('user_id', user.id),
                supabase.from('interview_preparation').select('*').eq('user_id', user.id)
            ]);

            if (journeyResult.data) setJourneyState(journeyResult.data);
            if (profileResult.data) {
                // Need to extract goal based on goal_type or description
                // For now, let's use goal_description or a default
                let goal = profileResult.data.goal_description;
                if (careerResult.data?.career_advice?.roles) {
                    const longTermRole = careerResult.data.career_advice.roles.find((r: any) => r.term === 'long');
                    if (longTermRole) goal = longTermRole.role;
                }
                setUserGoal(goal);
            }
            if (careerResult.data?.career_advice) setCareerAdvice(careerResult.data.career_advice);
            if (skillResult.data) setSkillValidation(skillResult.data);
            if (learningResult.data) setLearningJourneys(learningResult.data);
            if (projectResult.data) setProjects(projectResult.data);
            if (resumeResult.data) setResumeVersions(resumeResult.data);
            if (jobResult.data) setJobs(jobResult.data);
            if (interviewResult.data) setInterviewPreps(interviewResult.data);

        } catch (error) {
            console.error('Error loading roadmap data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoading && journeyState) {
            calculateStages();
        }
    }, [isLoading, journeyState, careerAdvice, skillValidation, learningJourneys, projects, resumeVersions, jobs, interviewPreps]);

    const calculateStages = () => {
        // 1. Calculate Statuses and Progress for Steps
        const shortTermRole = careerAdvice?.roles?.find((r: any) => r.term === 'short');
        const midTermRole = careerAdvice?.roles?.find((r: any) => r.term === 'mid');
        const longTermRole = careerAdvice?.roles?.find((r: any) => r.term === 'long');

        // --- Short Term Steps ---
        const shortSteps: StageStep[] = [
            {
                id: 'career-analysis',
                name: 'Career Analysis',
                number: 1,
                description: 'Identify viable career paths based on your profile',
                status: journeyState?.career_analysis_completed ? 'completed' : 'active',
                progress: journeyState?.career_analysis_completed ? 100 : 0,
                timeline: { duration: 'Week 1' },
                route: '/sigma',
                data: careerAdvice?.roles || [],
                completionText: journeyState?.career_analysis_completed ? 'Analysis Complete' : undefined
            },
            {
                id: 'skill-validation',
                name: 'Skill Validation',
                number: 2,
                description: 'Assess current skills vs requirements',
                status: journeyState?.career_analysis_completed ? (journeyState?.skill_validation_completed ? 'completed' : 'active') : 'locked',
                progress: skillValidation?.readiness_score || 0,
                timeline: { duration: 'Week 1' },
                route: '/sigma', // Or specific validation route if exists
                data: skillValidation ? [skillValidation] : [], // Wrap in array for dropdown
                completionText: skillValidation ? `${skillValidation.readiness_score}% Readiness` : undefined
            },
            {
                id: 'learning',
                name: 'Learning Plan',
                number: 3,
                description: 'Build missing skills through structured courses',
                status: journeyState?.skill_validation_completed ? (journeyState?.learning_plan_completed ? 'completed' : 'active') : 'locked',
                progress: calculateAvgProgress(learningJourneys),
                timeline: { duration: 'Weeks 2-6' },
                route: '/dashboard', // Scroll to learning
                data: learningJourneys,
                completionText: `${learningJourneys.filter((l: any) => l.status === 'completed').length}/${learningJourneys.length} Courses Completed`
            },
            {
                id: 'project',
                name: 'Project Building',
                number: 4,
                description: 'Create portfolio projects to demonstrate skills',
                status: journeyState?.learning_plan_completed ? (journeyState?.project_guidance_completed ? 'completed' : 'active') : 'locked',
                progress: calculateAvgProgressProjects(projects),
                timeline: { duration: 'Weeks 4-8' },
                route: '/projects',
                data: projects,
                completionText: `${projects.filter((p: any) => p.status === 'Completed').length}/${projects.length} Projects Done`
            },
            {
                id: 'portfolio',
                name: 'Portfolio & Resume',
                number: 5,
                description: 'Finalize your professional presence',
                status: journeyState?.project_guidance_completed ? (journeyState?.resume_completed ? 'completed' : 'active') : 'locked',
                progress: journeyState?.resume_completed ? 100 : (resumeVersions.length > 0 ? 50 : 0),
                timeline: { duration: 'Week 9' },
                route: '/resume',
                data: resumeVersions,
            },
            {
                id: 'ready-to-market',
                name: 'Interview Prep',
                number: 6,
                description: 'Practice mock interviews and get ready',
                status: journeyState?.resume_completed ? (journeyState?.interview_completed ? 'completed' : 'active') : 'locked',
                progress: calculateAvgProgressInterview(interviewPreps),
                timeline: { duration: 'Week 10' },
                route: '/interview',
                data: interviewPreps
            },
            {
                id: 'job',
                name: 'Job Application',
                number: 7,
                description: 'Apply and land your short-term role',
                status: journeyState?.interview_completed ? (termState.short_term_job_achieved ? 'completed' : 'active') : 'locked',
                progress: termState.short_term_job_achieved ? 100 : (jobs.length > 0 ? 20 : 0),
                timeline: { duration: 'Week 11+' },
                route: '/dashboard', // Or jobs page
                data: jobs
            }
        ];

        // Calculate Stage Progress and Status
        const shortTermProgress = Math.round(shortSteps.reduce((acc, step) => acc + (step.status === 'completed' ? 100 : step.progress), 0) / shortSteps.length);
        const shortTermStatus = termState.short_term_job_achieved ? 'completed' : 'active'; // Always active if not placed
        const shortStage: CareerStage = {
            id: 'short_term',
            name: 'Short Term Goal',
            timeline: '0-12 Months',
            status: shortTermStatus,
            overallProgress: shortTermProgress,
            steps: shortSteps,
            role: shortTermRole ? {
                role: shortTermRole.role,
                domain: shortTermRole.domain || 'Tech',
                salary_range: 'Not specified', // Field might be missing in DB type, mocking default
                match_score: shortTermRole.match_score || 0
            } : undefined,
            isJobPlaced: termState.short_term_job_achieved
        };

        // --- Mid Term Steps (Mocked/Simplified as per previous logic) ---
        // Mid term assumes short term is done.
        const midTermLocked = !termState.short_term_job_achieved;

        // Create generic steps for mid/long term as we might not have detailed data yet
        const midSteps: StageStep[] = [
            { id: 'skill-validation-mid', name: 'Advanced Skill Validation', number: 1, description: 'Assess skills for mid-level role', status: midTermLocked ? 'locked' : 'active', progress: 0, timeline: { duration: 'Week 1' }, route: '/sigma' },
            { id: 'learning-mid', name: 'Advanced Learning', number: 2, description: 'Master advanced concepts', status: 'locked', progress: 0, timeline: { duration: 'Months 1-3' }, route: '/dashboard' },
            { id: 'project-mid', name: 'Complex Projects', number: 3, description: 'Build scalable systems', status: 'locked', progress: 0, timeline: { duration: 'Months 3-6' }, route: '/projects' },
            { id: 'job-mid', name: 'Mid-Level Transition', number: 4, description: 'Move to mid-level role', status: 'locked', progress: 0, timeline: { duration: 'Year 2+' }, route: '/dashboard' },
        ];

        const midStage: CareerStage = {
            id: 'mid_term',
            name: 'Mid Term Goal',
            timeline: '1-3 Years',
            status: midTermLocked ? 'locked' : (termState.mid_term_job_achieved ? 'completed' : 'active'),
            overallProgress: termState.mid_term_job_achieved ? 100 : 0,
            steps: midSteps,
            role: midTermRole ? {
                role: midTermRole.role,
                domain: midTermRole.domain || 'Tech',
                salary_range: 'Not specified',
                match_score: midTermRole.match_score || 0
            } : undefined,
            isJobPlaced: termState.mid_term_job_achieved
        };

        // --- Long Term Steps ---
        const longTermLocked = !termState.mid_term_job_achieved;
        const longSteps: StageStep[] = [
            { id: 'skill-validation-long', name: 'Leadership Skills', number: 1, description: 'Assess leadership & architecture skills', status: longTermLocked ? 'locked' : 'active', progress: 0, timeline: { duration: 'Week 1' }, route: '/sigma' },
            { id: 'learning-long', name: 'Strategic Learning', number: 2, description: 'Focus on strategy and management', status: 'locked', progress: 0, timeline: { duration: 'Months 1-6' }, route: '/dashboard' },
            { id: 'job-long', name: 'Dream Role', number: 3, description: 'Achieve your ultimate career goal', status: 'locked', progress: 0, timeline: { duration: 'Year 4+' }, route: '/dashboard' },
        ];

        const longStage: CareerStage = {
            id: 'long_term',
            name: 'Long Term Goal',
            timeline: '3-5 Years',
            status: longTermLocked ? 'locked' : 'active',
            overallProgress: 0,
            steps: longSteps,
            role: longTermRole ? {
                role: longTermRole.role,
                domain: longTermRole.domain || 'Tech',
                salary_range: 'Not specified',
                match_score: longTermRole.match_score || 0
            } : undefined,
            isJobPlaced: false // Assuming long term is the end
        };

        const calculatedStages = [shortStage, midStage, longStage];
        setStages(calculatedStages);

        // Set current active stage
        if (shortStage.status === 'active') setCurrentStage('short_term');
        else if (midStage.status === 'active') setCurrentStage('mid_term');
        else if (longStage.status === 'active') setCurrentStage('long_term');
        else setCurrentStage('short_term'); // Default

        // Overall Progress weighted
        const weightedProgress = (shortStage.overallProgress * 0.3) + (midStage.overallProgress * 0.3) + (longStage.overallProgress * 0.4);
        setOverallProgress(Math.round(weightedProgress));
    };


    // Helpers
    const calculateAvgProgress = (items: any[]) => {
        if (!items.length) return 0;
        const total = items.reduce((acc, item) => acc + (item.progress_percentage || 0), 0);
        return Math.round(total / items.length);
    };

    const calculateAvgProgressProjects = (items: any[]) => {
        if (!items.length) return 0;
        const completed = items.filter(i => i.status === 'Completed').length;
        return Math.round((completed / items.length) * 100);
    };

    const calculateAvgProgressInterview = (items: any[]) => {
        if (!items.length) return 0;
        const total = items.reduce((acc, item) => acc + (item.readiness_score || 0), 0);
        return Math.round(total / items.length);
    };

    return {
        userGoal,
        stages,
        currentStage,
        overallProgress,
        isLoading
    };
};
