# Tests and validation

This folder contains automated checks and developer-only validation scripts. Standalone HTML test pages currently remain at the repository root because their local scripts and model assets use root-relative paths; move them only after rebasing and checking every such reference.

- verify_walking.py — Playwright browser test for walking, stopping, turning, sprinting, jumping and camera angles. Run from the repository root or from any directory; the script serves the repository root automatically.
