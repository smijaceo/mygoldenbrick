# Recovery

Written 2026-11-02, after finding that `MEMORY.md` and the `baseline-2026-11-02` tag pointed here but no
such file existed. Hashes below were checked that day.

## Restore points

- `baseline-2026-11-02` (commit `9f7b957`): the v1.2 app with the My Golden Brick landing page in progress.
- `v1.2-before-landing-2026-11-02` (commit `dae102b`): the v1.2 app before any landing page work.
- Off-drive copy: `D:\imakepage-backups\2026-11-02-pre-motion\`
  - `repo-all-refs.bundle`: every branch and tag. Restore with `git clone repo-all-refs.bundle <folder>`.
  - `app.db`: the baseline database. SHA-256 `f8cba8e6a7b4614acce44a693ccc3505c3565ccaadc24e3e4cff37df8f82a055`.
  - `SHA256SUMS.txt`: hashes of both files.

## Workspaces

- `C:\Projects\imakepage-rebuild`, branch `landing-my-golden-brick`: the preserved baseline. Its database is
  `web/data/app.db`. A server on port 3100 may be holding it open.
- `C:\Projects\imakepage-rebuild-motion`, branch `prototype/motion-2026-11-02`: the disposable motion prototype.
  It has its own `web/data/app.db` and `node_modules`, so running it cannot touch the baseline.

## Rules

- Compare before restoring. Never overwrite a database because an older note or snapshot says so.
- The database lives at `<cwd>/data/app.db`, so which copy is used depends on the folder the server starts in.
- C: is short on space (about 3.8 GB free on 2026-11-02). Put large outputs on D:.
