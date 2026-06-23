---
target: homepage
total_score: 31
p0_count: 0
p1_count: 2
timestamp: 2026-06-23T15-51-38Z
slug: app-pages-index-vue
---
# Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Clear nav state and reveal motion, but the home page still gives no loading or data-refresh cue. |
| 2 | Match System / Real World | 4 | Strong domain language, strong TI framing, strong China-first editorial spine. |
| 3 | User Control and Freedom | 3 | Navigation is clean, but the opening fold offers a lot of content before the primary path is obvious. |
| 4 | Consistency and Standards | 3 | Core cards and chips are consistent, but the page repeats the same block rhythm too often. |
| 5 | Error Prevention | 3 | Mostly static and safe; the media zoom overlay closes on error, but the shared media layer needs tighter hardening. |
| 6 | Recognition Rather Than Recall | 4 | Good labels, good numbers, good direct links. |
| 7 | Flexibility and Efficiency | 3 | Quick entry paths help, but there is no search or faster jump for heavy repeat visitors. |
| 8 | Aesthetic and Minimalist Design | 3 | Cohesive, but the hero plus stacked card grids create pressure before the page settles. |
| 9 | Error Recovery | 3 | Reasonable fallback behavior, but the shared overlay and partial-coverage messaging could be clearer. |
| 10 | Help and Documentation | 2 | The homepage explains TI, but not the interaction model or where a first-timer should start. |
| **Total** | | **31/40** | **Solid, but needs tighter hierarchy and rhythm** |

# Anti-Patterns Verdict

**LLM assessment**: Not AI slop. The palette, hierarchy, and subject matter feel deliberate and specific to TI. The page has a point of view. The main weakness is not genericity, it is over-stacking: hero atmospherics, a featured card, stats, quick entries, and the TI grid all compete for first-read priority.

**Deterministic scan**: 2 findings, both in shared media overlay code:
- `app/components/common/MediaZoomOverlay.vue:200` - `broken-image` warning. This looks like a false positive from the detector, not a real empty-src bug. The component guards `src` in the composable and closes on load error.
- `app/components/common/MediaZoomOverlay.vue:158` - `design-system-radius` advisory. The 8px inner image radius is outside the documented card radius scale, but this is low impact and likely acceptable for an image inset.

**Overlay / browser evidence**: No browser overlay or live visual pass was run in this session. Browser automation was unavailable, so there is no user-visible `[Human]` overlay to report.

# Overall Impression

This is a disciplined, on-brand homepage with real editorial intent. It feels like a TI archive, not a SaaS landing page. The biggest opportunity is to sharpen the first fold so the user reads the site faster: less simultaneous emphasis, more deliberate pacing.

# What's Working

- The brand system is coherent. Dark panel, gold/red accents, and the TI wordmark all read as one identity.
- The home page gives multiple entry modes without getting lost: latest result, stats, shortcuts, and the TI archive itself.
- The content is concrete and useful. You answer the key questions quickly: what TI is, which event matters, and where to go next.

# Priority Issues

- **[P1] First fold is over-peaked**
  - **What**: The hero runs a custom animated backdrop, a featured result card, an explainer block, and two CTA buttons all at once.
  - **Why it matters**: The user has to parse too many focal points before the page’s main job lands. It dilutes the “30 seconds to understand the whole TI” goal.
  - **Fix**: Collapse one layer. Keep either the explainer block or the featured card dominant, not both. Let the other move lower or become a lighter secondary treatment.
  - **Suggested command**: `$impeccable layout` or `$impeccable distill`

- **[P1] Repeated card-grid rhythm feels template-like**
  - **What**: The stats grid, quick-entry grid, and TI archive grid all use similar card sizing and spacing in sequence.
  - **Why it matters**: The page loses pacing. It starts to feel like three variations of the same block instead of a deliberate opening, a bridge, and a destination.
  - **Fix**: Change one module’s form. Turn stats into a compact horizontal strip, make quick entries a denser link rail, or give the archive section a stronger editorial break.
  - **Suggested command**: `$impeccable layout` or `$impeccable bolder`

- **[P2] Trust copy undercuts the archive tone**
  - **What**: The footer says `V1 收录部分届，持续完善中。`
  - **Why it matters**: On a reference site, this reads like a work-in-progress notice, not a finished archive. It weakens the authority the rest of the page builds.
  - **Fix**: Move that disclosure to an about/changelog area or rewrite it as a compact provenance note that does not sit in the first impression.
  - **Suggested command**: `$impeccable clarify`

# Persona Red Flags

**Jordan (First-Timer)**: The opening fold assumes some TI context immediately. The “什么是 ti” explainer helps, but it competes with the featured card and stats instead of being the clean on-ramp. Jordan has to work too hard to decide where to start.

**Alex (Power User)**: Alex wants to jump straight to year, prize pool, or China performance. The page gives shortcuts, but the repeated card rhythm makes scanning slower than it should be. There is no fast search or index-like jump.

**Mei (China-focused fan)**: China performance is present, but it is not yet the strongest visual anchor on the home page. The archive still leads with the general TI story first, which is fine, but the China spine could be surfaced a little more decisively.

# Minor Observations

- The custom hero SVG is a good choice. It gives the page a physical, object-like presence instead of the usual flat gradient noise.
- The `MediaZoomOverlay` scan hits look like low-risk false positives. Worth keeping an eye on, but not a critique driver.
- The serif `ti` wordmark is distinct, though it leans close to costume if it ever gets larger or more decorative.

# Questions to Consider

- Should the first fold prioritize the archive story or the latest-result story? Right now it tries to do both.
- Should the `V1 收录部分届` note stay visible in the footer, or move out of the first impression entirely?
