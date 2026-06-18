<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="mz">
        <div
          v-if="state"
          ref="root"
          class="mz-overlay fixed z-[70]"
          :class="state.kind === 'avatar' ? 'mz-avatar' : 'mz-logo'"
          :style="posStyle"
          role="img"
          :aria-label="ariaLabel"
        >
          <div class="mz-frame">
            <img
              :src="state.src"
              :alt="state.alt"
              class="mz-img"
              draggable="false"
              @load="schedulePlace"
              @error="close"
            >
          </div>
          <div v-if="state.caption" class="mz-caption">
            <p class="mz-title">{{ state.caption }}</p>
            <p v-if="state.subcaption" class="mz-sub">{{ state.subcaption }}</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
// Edge-aware anchored preview. On wide viewports it floats beside the trigger
// (right or left, whichever has room, vertically aligned and clamped); on
// narrow viewports it centers. Re-measures on scroll/resize and once the image
// finishes loading (box size changes). Closes when the anchor scrolls away,
// on Escape, or on a pointer-down outside itself and its anchor.

const { state, close } = useMediaZoom()

const root = ref<HTMLElement>()
const posStyle = ref<Record<string, string>>({ visibility: 'hidden' })

const ariaLabel = computed(() =>
  state.value ? state.value.caption || state.value.alt : '',
)

const MARGIN = 12
const GAP = 14

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function place() {
  const el = root.value
  const st = state.value
  if (!el || !st) return
  const vw = window.innerWidth
  const vh = window.innerHeight
  const a = st.anchor.getBoundingClientRect()
  // Anchor scrolled out of view → bail.
  if (a.bottom < 0 || a.top > vh || a.right < 0 || a.left > vw) {
    close()
    return
  }
  // offsetWidth/Height ignore the entrance transform, so layout box is clean.
  const bw = el.offsetWidth
  const bh = el.offsetHeight
  let left: number
  let top: number
  if (vw < 640) {
    left = clamp((vw - bw) / 2, MARGIN, Math.max(MARGIN, vw - bw - MARGIN))
    top = clamp((vh - bh) / 2, MARGIN, Math.max(MARGIN, vh - bh - MARGIN))
  } else {
    const spaceRight = vw - a.right
    const spaceLeft = a.left
    if (spaceRight >= bw + GAP + MARGIN) left = a.right + GAP
    else if (spaceLeft >= bw + GAP + MARGIN) left = a.left - GAP - bw
    else left = clamp((vw - bw) / 2, MARGIN, vw - bw - MARGIN)
    top = clamp(a.top + (a.height - bh) / 2, MARGIN, vh - bh - MARGIN)
  }
  posStyle.value = { left: `${Math.round(left)}px`, top: `${Math.round(top)}px` }
}

let raf = 0
function schedulePlace() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    place()
  })
}

function onScrollResize() {
  schedulePlace()
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && state.value) close()
}
function onPointer(e: PointerEvent) {
  const el = root.value
  const st = state.value
  if (!el || !st) return
  const target = e.target as Node | null
  if (el.contains(target as Node)) return
  if (st.anchor.contains(target as Node)) return
  close()
}

watch(
  () => state.value?.src,
  (src) => {
    if (!src) return
    posStyle.value = { visibility: 'hidden' }
    nextTick(place)
  },
)

onMounted(() => {
  window.addEventListener('scroll', onScrollResize, { passive: true, capture: true })
  window.addEventListener('resize', onScrollResize)
  window.addEventListener('keydown', onKey)
  window.addEventListener('pointerdown', onPointer, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScrollResize, { capture: true } as EventListenerOptions)
  window.removeEventListener('resize', onScrollResize)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('pointerdown', onPointer, true)
})
</script>

<style scoped>
/* pointer-events:none so the preview never steals clicks from the UI beneath;
   closing is handled by pointerdown-outside / Escape / hover-leave instead. */
.mz-overlay {
  pointer-events: none;
  max-width: calc(100vw - 24px);
}

.mz-frame {
  border-radius: 12px;
  border: 1px solid rgb(var(--gold) / 0.32);
  background: rgb(var(--bg-card));
  background-image: linear-gradient(145deg, rgb(var(--gold) / 0.05), transparent 42%);
  /* The one sanctioned "floating state" shadow (DESIGN §4 State Lift). */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  padding: 8px;
  overflow: hidden;
}

.mz-img {
  display: block;
  border-radius: 8px;
}

.mz-logo .mz-img {
  /* Logo sources are 35–100px; cap the plate at 160 so we never blow them up
     beyond a soft 2×. */
  width: clamp(120px, 42vw, 160px);
  height: clamp(120px, 42vw, 160px);
  object-fit: contain;
  background: rgb(var(--bg-subtle));
}

.mz-avatar .mz-img {
  /* Avatar sources are 160×160 — show at native size so the preview stays
     crisp instead of upscaling. */
  width: clamp(120px, 42vw, 160px);
  height: clamp(120px, 42vw, 160px);
  object-fit: cover;
  object-position: 50% 18%;
}

.mz-caption {
  margin-top: 9px;
  padding: 0 4px;
  text-align: center;
}

.mz-title {
  font-weight: 700;
  color: rgb(var(--text-main));
  font-size: 0.95rem;
  line-height: 1.25;
}

.mz-sub {
  margin-top: 2px;
  color: rgb(var(--text-muted));
  font-size: 0.8rem;
  line-height: 1.3;
}

/* Entrance: opacity + lift on the frame container (never a transform on the
   <img> itself). Matches the .reveal motion language elsewhere. */
.mz-enter-active {
  transition: opacity 160ms var(--ease-out-quart), transform 160ms var(--ease-out-quart);
}
.mz-leave-active {
  transition: opacity 120ms var(--ease-out-quart), transform 120ms var(--ease-out-quart);
}
.mz-enter-from,
.mz-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
