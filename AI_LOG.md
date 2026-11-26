# AI Usage Log

## Tools Used
- Tool(s): Antigravity (code generation, tests, debugging, git) and Claude chat (project planning, major help in prompting and testing/code review).

- Used for: Code generation (backend API, SQLite setup, SVG drawing generator, React frontend), writing unit/integration tests, debugging, and git commits.

## Key Prompts
At first i have ask claude chat to understand the requirments and the project design then i start to work on it and i follow the instructions carefully step by step.
At the intial claude chat gave me the summary of the project design and a prompt to start the project initially on Antigravity an setup the project directory, this was the big prompt which helped me to set up the project.
Here are some of the other key prompts that i have used:
  1. Initial architecture, folder structure, and SQLite schema.
  2. Switching from `better-sqlite3` (failed on Node 24 without VS C++ Build Tools) to built-in `node:sqlite`.
  3. Splitting backend into Part A (REST API + seed + tests) and Part B (3-view SVG generator + XML tests).
  4. Fixing cross-field validation, `wheel_diameter` source tracking, and proportional SVG scaling.

## One Time AI Was Wrong & How I Caught It
- What AI got wrong: when changing span or floor-to-rail height, the dimension labels and technical data table updated, but the drawn girder/column/end-view shapes stayed visually static even though all tests were passing.

- How I caught it: I caught it by testing the live UI and inspecting the visual output.

- How it was fixed: I caught it, and asked Antigravity to fix it by changing `drawing.ts` to compute per-view scale factors (`elevScale`, `planScale`, and End View scaling) plus added a geometry-change test with Antigravity.
