

# Improve Job Card Button Layout on /job-finder

## Problem
All 6 action buttons are crammed into a single flat row, wrapping awkwardly on different screen sizes. No visual hierarchy -- primary actions (Apply Now) look the same weight as secondary ones (View Details).

## Solution
Reorganize buttons into two visually distinct groups with clear hierarchy:

**Row 1 -- Primary Actions** (full visual weight):
- **Apply Now** (primary filled button, prominent)
- **View Details** (outline toggle)
- **Save** bookmark icon (already positioned, stays in top-right)

**Row 2 -- Preparation Tools** (grouped in a subtle container with label):
- A small "Prepare" label, then:
- **Interview Prep** / **View Prep**
- **Mock Interview**
- **Smart Analysis** / **View Analysis**
- **Optimize Resume**

These preparation buttons use a consistent `ghost` style with subtle backgrounds, grouped inside a light background container to visually separate them from primary actions.

## File to Modify
`src/pages/JobFinderNoAuth.tsx` -- lines 369-425 (the action buttons section)

## Layout Structure
```text
┌─────────────────────────────────────────────┐
│ [View Details]          [Apply Now ↗]       │  ← Primary row
├─────────────────────────────────────────────┤
│ 🎯 Prepare for this role:                  │  ← Subtle bg container
│ [Interview Prep] [Mock Interview]           │
│ [Smart Analysis] [Optimize Resume]          │
└─────────────────────────────────────────────┘
```

- Primary row: `flex justify-between` with Apply Now on the right using filled variant
- Prep container: `rounded-lg bg-muted/50 p-3` with a small label and `flex flex-wrap gap-2`
- Prep buttons: `variant="ghost"` with `text-xs h-8` for compact size
- Buttons that have existing data (View Prep / View Analysis) get a subtle green dot indicator instead of switching to filled variant

