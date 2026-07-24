# Agent notes — SkyAbove / SkyLight

## Deploy policy (required)

- **Single source of code:** GitHub repo `asujeff48/SkyLight`, branch `main`.
- **Single user-facing site:** Railway production (`skylight`), which autodeploys from `main`.
- **Default:** when a change is ready for users, **merge it into `main` and push** so Railway picks it up. Do not stop at an open PR or feature branch if the user is testing production.
- **Rule of thumb:** if it is not on `main`, it is not live.

### Workflow

1. Work on a `cursor/<name>-eb99` feature branch as needed.
2. Commit and push the branch.
3. Merge into `main` (fast-forward or merge commit) and `git push origin main`.
4. Confirm Railway deployment succeeds before telling the user to retest production.
5. Hard-refresh guidance: users should hard-refresh the Railway URL after deploy.

PRs are optional documentation of the work; they are not a substitute for landing on `main` when production is the test target.
