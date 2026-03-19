---
name: project_current_state
description: Current working state and restore point for portal sequence system
type: project
---

**Restore point created 2026-03-19:** Before switching from image-frame sequence to scroll-driven video.

Backup files saved as:
- `js/portal-sequence.backup.js`
- `js/main.backup.js`
- `css/style.backup.js`
- `index.backup.html`

Current state:
- `intro door.mp4` plays on load, hides when done
- Portal canvas shows frame 0 immediately after video ends
- Scroll progress spans hero + portal section (no dead scroll)
- Sequence-2 first frame (`Dzoom00108000.jpg`) replaced with video's last frame for seamless transition

**Why:** User wants to be able to revert if the next changes (scroll-driven video replacing image frames) don't work out.
**How to apply:** Restore from backup files if user asks to undo.
