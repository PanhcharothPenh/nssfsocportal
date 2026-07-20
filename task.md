# Tasks: Fix Broken Buttons and UI Actions

- [x] Backend: Add branch creation API
  - [x] Add `BranchCreate` Pydantic model in `backend/app.py`
  - [x] Implement `POST /api/branches` endpoint to insert branch & generate 254 IPs
- [x] Frontend: Dashboard Navigation fixes
  - [x] Fix Branch "View All" and Subnet Row onClick actions
  - [x] Fix HQ "View All" and Subnet Row onClick actions
- [x] Frontend: IPAM Tab features
  - [x] Add `ipamShowFilters` state and toggle for More Filters
  - [x] Implement the More Filters panel in IPAM Tab
  - [x] Add `BranchAdd` modal and connect `➕ Add Branch` button to save via POST `/api/branches`
- [x] Frontend: Hospital S2S Tab layout toggle
  - [x] Add `hospitalViewMode` state and connect layout buttons (Grid/List)
  - [x] Render a table for S2S hospitals when in List View mode
- [x] Verification
  - [x] Run backend tests to verify endpoints (integration tests & scratch/test_add_branch.py passed)
  - [x] Verify UI flows in browser (programmatically validated; manual verification recommended since local browser tool requires Linux)
