# Data contract

## Value semantics

- `NULL`: unknown fact.
- Pending: unknown fact on an ongoing tournament; displayed as `待定`.
- Not applicable: cancelled tournament; displayed as `不适用`.
- `0`: a source-confirmed numeric zero, never a fallback.

## Identity

Teams and players have stable canonical IDs. Spelling, translations, abbreviations, and historic variants are aliases. A roster moving organizations does not merge those organizations. Explicit organization succession belongs in lineage records. Historical pages keep the name used at that tournament.

China-team classification remains the placement record's single source of truth.

## Sources and overrides

Core-field priority is official tournament or Valve source, then Liquipedia, then Wikipedia. Core provenance records field, source kind, URL, revision, fetch time, verification status, and notes. Conflicts keep the previous verified value and become pending.

Crawler facts and human overrides are separate. An override records JSON value, reason, evidence URL, and update time. Refreshes preserve overrides. Chinese summaries are curated content.

## Release blockers

Foreign-key failures, missing core facts, a completed tournament with a missing/zero prize pool, champion/runner-up placement mismatch, a placement outside the participant set, stale ongoing data, missing source URLs, ordinary unverified media, and broken local media references block release. Explicitly restored historical media is tracked as `restored` and produces a warning until rights are verified. Missing portraits, logos, or Chinese summaries otherwise degrade with explicit placeholders or warnings.
