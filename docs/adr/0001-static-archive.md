# ADR 0001: Production is a static TI archive

Status: accepted

TiWiki is a non-commercial historical archive for The International, with hard-core Chinese-speaking fans as the primary audience. It may publish daily fact snapshots during an active TI, but does not provide live scores, news, predictions, accounts, or comments.

Production deploys only the verified static output from `nuxt generate`. SQLite, build-time API handlers, native modules, and the local admin editor must not exist as runtime production capabilities. The release verifier rejects `/admin`, `/api`, server bundles, and database artifacts. The local editor binds to `127.0.0.1` and production middleware fails closed.

This choice keeps the committed SQLite snapshot reproducible, avoids writable server infrastructure, and matches the maintenance budget. Reintroducing SSR or a remote admin requires a replacement ADR plus authentication, authorization, CSRF protection, audit logging, and a writable database design.
