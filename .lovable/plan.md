

# Dashboard Layout Reorganization Plan

## Goal
Rearrange all dashboard sections into a logical, production-grade order with proper visual hierarchy.

## New Section Order

| # | Section | Current Position | Change |
|---|---------|-----------------|--------|
| 1 | Action Buttons (Advisor + Get Analysis) | Top | No change |
| 2 | Goal and Summary | 2nd | No change |
| 3 | Career Analysis Insights (Overall Assessment only) | 4th (combined) | Split out, move up |
| 4 | Career Progression Path (3 role cards) | 7th | Move up |
| 5 | Career Roadmap Timeline | 4th (inside CareerAnalysisSection) | Split out, keep here |
| 6 | 5-Year Career Trajectory CTA | 6th | Move up slightly |
| 7 | Skill Gap Analysis | 4th (inside CareerAnalysisSection) | Split out, position here |
| 8 | Skill Readiness for Target Role | 8th | No change (relative) |
| 9 | AI Future Roles | 5th | Move down |
| 10 | Learning Resources | 9th | No change |
| 11 | Portfolio Projects | 10th | No change |
| 12 | Job Matches | 11th | No change |
| 13 | Resume Upgrade (GuidanceSection) | 3rd | Move to bottom |

## Technical Changes

### File: `src/components/dashboard/CareerAnalysisSection.tsx`
- Split into 3 independently renderable sections by adding props or exporting sub-components:
  - `renderOverallAssessment` - just the assessment card
  - `renderCareerRoadmap` - the timeline collapsible
  - `renderSkillGapAnalysis` - the skill gap collapsible
- Alternatively, replace with 3 separate render blocks directly in the dashboard

### File: `src/pages/DashboardNoAuth.tsx`
- Reorder the JSX sections in `<main>` to match the new order above
- Break up `CareerAnalysisSection` into its 3 sub-sections placed at positions 3, 5, and 7
- Move `<GuidanceSection />` (Resume Upgrade) to the very bottom, after Job Matches
- Move Career Progression Path (the 3 role cards grid) right after Overall Assessment
- Move 5-Year Career Trajectory CTA after Career Roadmap Timeline

### No new files needed
All changes are repositioning existing rendered sections within the dashboard page.

