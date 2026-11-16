# Phase 1 implementation

- Introduce a light, neutral workspace design with existing semantic tokens and UI controls.
- Replace the permanent advisor split with collapsible left navigation and an optional right advisor drawer.
- Make /dashboard an overview of existing business projects, whiteboard tasks and roadmap milestones. Show real counts and explicit unavailable metadata, not invented priorities, dates or progress.
- Add Projects, My Tasks, Calendar, Team, Reports, AI Assistant, Settings and Help views. Team shows only the known account; team invitations are outside Phase 1.
- Preserve strategy dossiers at /analysis and every existing route. Project subviews reuse whiteboards, roadmap and brief editing where available; files show an honest empty state.
- Wire search, quick creation, deadline notifications, workspace selection and profile/logout controls to real destinations.
- No backend changes, new tables, fake content or alterations to AI billing. Verify public routes and calculations; authenticated checks are unavailable for the externally managed Supabase project.