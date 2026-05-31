# Global Development & Operations Instructions

This document governs the procedures to be followed by all engineers, coders, and AI assistants working on the Kharon Fire & Security codebase. These protocols ensure stability, synchronization, documentation integrity, and clean operational deployments.

---

## 1. Post-Task Completion Protocol

Upon completing any task, the following sequence of steps must be strictly executed:

### 1.1 Update Documentation
Update all relevant project documentation (such as `CHANGELOG.md`, `IMPROVEMENT_SUMMARY.md`, and any affected system design notes) with detailed explanations of changes made, files modified, and issues resolved.

### 1.2 Stage and Commit Changes
Verify all modified and new project files are staged, and commit them referencing the correct task or issue context. The remote repository URL for all synchronization is:
* `https://www.github.com/flufflesto/kfs`

### 1.3 Merge Commits & Resolve Conflicts
Merge all local commits and any other pending changes. In the event of merge conflicts:
- Analyze conflicting regions carefully.
- Resolve conflicts manually or using IDE merge tools.
- Ensure the build remains fully functional after resolutions.

### 1.4 Synchronize Local and Remote Repositories
Verify that the local instance of the codebase and the remote GitHub repository are fully synchronized and up to date:
- Pull latest changes from the remote `main` branch.
- Resolve any discrepancies or sync issues immediately.

### 1.5 Clean Up Stale Branches
Prune and delete any temporary, local, or remote feature branches. Only the main branch should remain locally and on the primary repository unless a persistent branch is explicitly approved.

### 1.6 Deploy to Cloudflare Pages
Deploy the latest built and validated codebase to Cloudflare Pages:
- Run appropriate deployment scripts (e.g., `npm run deploy:cloudflare`).
- Validate that the deployment succeeds and the live URL is functional.

### 1.7 Document Outstanding Items
Generate a concise but detailed list of all current outstanding items, categorized exactly as:
- 🔴 **Critical**
- 🟡 **Recommended**
- 🟢 **Nice to Have**
- 🔵 **Future**

### 1.8 Document Recommendations
Provide a detailed list of recommendations, categorized exactly as:
- 💼 **Recommended**
- ✨ **Nice to Have**
- ⚙️ **Optional**
- 🚀 **Future Expansion**

### 1.9 Commit and Merge Documentation Updates
Ensure the lists generated in **1.7** and **1.8** are included in the repository, committed, merged, and pushed to the remote repository.

---

## 2. Pre-Change UI Safety & Regression Protocol

Before making any changes to the user interface (website, admin console, or technician portal) that could potentially impact visual rendering, responsiveness, or operation:

### 2.1 Confirmation of Proposed Changes
Document and align on the exact changes that are going to be made to the UI.

### 2.2 Backup Configuration
Ensure a backup exists of the files being modified to allow for quick regression:
- Create a copy of the target files in a temporary location or utilize local Git tracking.
- Verify that a roll-back path is clear and can be executed in under 2 minutes if the change breaks interactivity or presentation.

---

## 3. Current Outstanding Items (as of May 2026)

### 🔴 Critical
- None. All critical items (including Cloudflare API token configuration, watermark overlays, typescript endpoints, and technician jobcard template recovery) have been fully resolved.

### 🟡 Recommended
- **Expand End-to-End Testing**: Expand the newly integrated Playwright/visual test suite to cover the multi-step technician jobcard closure flow, defect sub-form, and canvas signature capture.
- **Client-Side Image Compression**: Integrate lightweight client-side image compression (canvas-based) before converting evidence photos to Data URIs. This will optimize performance in rural South African service areas where mobile bandwidth is limited.

### 🟢 Nice to Have
- **Toast Notifications**: Enhance offline/online network status changes with modern toast notifications to supplement the static offline banner.
- **Canvas Zoom/Pan**: Add double-tap zoom/pan controls to the signature pad on compact mobile viewports (under 360px width) for better ergonomics.

### 🔵 Future
- **Capacitor Integration**: Transition the technician portal to a native shell (Capacitor/Cordova) to enable native camera API support and expand local storage constraints beyond standard browser limits.

---

## 4. Operational Recommendations

### 💼 Recommended
- **Scheduled Token Rotation Policy**: Implement a regular schedule for rotating Cloudflare API tokens and update them directly in GitHub Repository Secrets without hardcoding.
- **Pre-commit Hooks**: Set up pre-commit hooks (Husky + lint-staged) enforcing `eslint` checks and TypeScript validations before files are committed.
- **Database Housekeeping**: Configure a background cron task to clean up temporary files, unused session tokens, or draft jobcard uploads older than 30 days.

### ✨ Nice to Have
- **High-contrast Signature Pad**: Add support for automated black/white contrast adjustments in the signature pad depending on device theme overrides.

### ⚙️ Optional
- **Multilingual Fields**: Introduce support for basic translation keys (English, Zulu, Afrikaans) for technician field instructions.

### 🚀 Future Expansion
- **Live Location Tracking**: Integrate optional real-time technician GPS tracking via WebSockets during active "Travelling" job states.
- **Inventory Integration**: Connect the parts inventory tracking system with Sage live warehouse stock APIs to automate parts dispatch invoicing.
