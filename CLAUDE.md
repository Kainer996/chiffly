# Lock it down

The standing rule for every project and every agent here. Security is part of the job, not an extra. Do not wait to be asked.

Before you call anything done or live:

1. **Look as a stranger.** Fetch it with a clean browser and plain `curl`. A device that remembers a password proves nothing. Say what a stranger gets.
2. **The server decides who gets in.** A page that hides something is not a lock. Ask for the files behind it by address. Check that every write (upload, save, delete) asks who you are before it does anything.
3. **Ship only what the visitor needs.** No notes, tests, scripts, backups (`.bak`, `.prev`), source folders, `venv`, `node_modules`, logs or dot-files in a web root.
4. **No secrets where they can be read.** Keys, tokens, passwords and login cookies stay out of code, commits, served files, logs and chat. Read them from the environment. A hash of a short password counts as the password. Found one? Say so, and get it changed.
5. **Private by default.** Keep the repo private. Keep games, code and art behind a lock. A public link or a public repo is Yaan's call, each time.
6. **Check every door.** `www`, plain http, other ports, old folders, preview copies, backups, app packages, GitHub Pages.
7. **Say what is still open, and why.** One plain line. No surprises later.
8. **Leave it tighter than you found it.** A hole outside your task still gets closed or flagged the same day.

**This repository is public.** Anyone can read every file and every old commit. Put nothing here that is not meant for the world: no keys, no private notes, no unreleased work.

This repo holds the whole Chifftown source, with `server.js`. The live site runs from the server, not from here, so nothing needs this repo to be public.
