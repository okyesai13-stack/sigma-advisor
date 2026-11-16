# Redesign roadmap

- [x] Add authorized server-aggregated dashboard and report data
- [x] Build project, task, team, milestone and risk analytics with filters
- [x] Implement filtered CSV/PDF exports and verify calculation/security rules (50 tests, rollback database checks, empty export downloads, build OK)
- [ ] Verify signed-in analytics acceptance (blocked: externally managed authentication)

- [x] Add Phase 3 milestones, task links and dependency safeguards
- [x] Implement milestone editor, live Gantt and project calendar
- [x] Integrate scheduling warnings and dashboard deadlines
- [x] Test scheduling rules, database authorization and application health (43 tests; rollback database checks; build OK)
- [ ] Verify signed-in scheduling flows (blocked: externally managed authentication)

- [x] Add Phase 2 workspace membership, project, task and activity tables with server-enforced permissions
- [x] Implement workspace switching, project lifecycle and editable task board/list
- [x] Connect real project/task progress and dashboard data while retaining legacy analyses
- [x] Test permissions, relationships, concurrent updates and application health
- [ ] Verify signed-in creation and persistence (blocked: externally managed authentication)

- [x] Apply Phase 1 neutral design and collapsible project-first shell
- [x] Add Overview and functional primary navigation backed by existing data
- [x] Preserve legacy analysis routes and optional AI advisor
- [x] Test data calculations, route protection, isolated responsive shell, and app health
- [ ] Verify real signed-in overview, login/logout and advisor replies (blocked: externally managed authentication)

- [x] Add confirmed single-section and all-section deletion and recreation
- [x] Persist removed sections and support Undo/Redo without deleting analysis results
- [x] Run section lifecycle checks and verify app health (13 tests pass; build OK; signed-in interaction checks unavailable with external authentication)

- [x] Make every whiteboard section resizable with saved dimensions
- [x] Show connection points only on selected sections and active connection targets
- [x] Verify resizing and mapping checks (10 passing tests; build OK; signed-in interaction testing unavailable with external authentication)

- [x] Add flow-diagram handles and drag-to-connect arrows to every whiteboard section
- [x] Verify side-anchored connection geometry and existing mapping tests (five passing tests; build OK)

- [x] Make whiteboard sections movable with their notes
- [x] Add saved, editable connections between sections
- [x] Verify movement and mapping logic with four passing tests
- [x] Verify movement and saved mappings through signed-in UI (blocked: external authentication is unavailable for automated checks)

- [x] Lock visual direction and audit current UI
- [x] Apply shared Signal Orange design system
- [x] Redesign landing and authentication pages
- [x] Redesign authenticated workspace and brief flow
- [x] Redesign agent console, dashboard, and advisor
- [x] Verify desktop, mobile, interactions, and build health
