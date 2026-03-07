

# Two-Panel Layout: Chat Left, Content Right

## Overview
Create a persistent two-panel layout for all pages except the landing page. The **left panel** shows the embedded AI Advisor chat, and the **right panel** shows the current page content.

```text
┌──────────────────────────────────────────────────────┐
│  AppLayout                                           │
│ ┌──────────────────┬─┬───────────────────────────┐   │
│ │  Left Panel      │ │  Right Panel              │   │
│ │  (~35%)          │H│  (~65%)                   │   │
│ │                  │a│                            │   │
│ │  AdvisorChat     │n│  <Outlet /> (page content) │   │
│ │  (embedded)      │d│                            │   │
│ │                  │l│                            │   │
│ │                  │e│                            │   │
│ └──────────────────┴─┴───────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

## Files to Create

### 1. `src/components/advisor/AdvisorChatPanel.tsx`
- Extract all chat logic from `AdvisorNoAuth.tsx` (messages, streaming, input, suggestion cards, history loading)
- Remove page-level wrapper (no `h-screen`, no back button header)
- Render as a panel that fills its parent container height
- Keep streaming, `formatMessage`, suggestion cards, scroll behavior

### 2. `src/components/layout/AppLayout.tsx`
- Uses `ResizablePanelGroup` (horizontal) from existing `src/components/ui/resizable.tsx`
- **Left panel** (default 35%, min 25%): `<AdvisorChatPanel />`
- **ResizableHandle** with grip
- **Right panel** (default 65%, min 40%): `<Outlet />` from react-router
- Slim top header bar: logo + page title breadcrumb + optional collapse toggle
- On mobile (< 768px): hide left panel, show floating chat button that opens a `Drawer` (vaul)
- Store collapsed state in `localStorage`

## Files to Modify

### 3. `src/App.tsx`
- Wrap all non-landing routes inside `<Route element={<AppLayout />}>` with nested `<Route>` children
- Remove standalone `/advisor` route (chat is now always visible in left panel)
- Keep `/` (landing) and `*` (NotFound) outside the layout

### 4. `src/pages/AdvisorNoAuth.tsx`
- Simplify to just redirect to `/dashboard` (or remove entirely) since chat is embedded

### 5. All inner pages (12 files)
- Remove back-button headers and standalone navigation where redundant
- Ensure pages use `h-full overflow-auto` instead of `h-screen` so they fit within the right panel
- Pages affected: `SetupNoAuth`, `SigmaNoAuth`, `DashboardNoAuth`, `InterviewPrepNoAuth`, `SmartAnalysisNoAuth`, `ResumeUpgradeNoAuth`, `MockInterviewNoAuth`, `CareerTrajectoryNoAuth`, `AILearningHubNoAuth`, `ProjectBuilderNoAuth`, `AIRolesNoAuth`, `JobFinderNoAuth`

## Technical Details
- `react-resizable-panels` and `vaul` are already installed
- `ResumeContext` is already at the app root, so the chat panel reads `resumeId` from context automatically
- Chat history persists via the existing `chat_history` table keyed by `resume_id`
- The chat panel will show suggestion cards when no `resumeId` is set (e.g., on the setup page before upload)

