// Singleton hover/press media-zoom state shared by the v-media-zoom directive
// and the single <MediaZoomOverlay/> portal. Keeping state module-scoped means
// one overlay serves every trigger image on the page (roster tables can hold
// dozens of avatars) and the overlay always escapes whatever overflow/stacking
// context its trigger lives in (it teleports to <body>).

export type MediaZoomKind = 'logo' | 'avatar'

export interface MediaZoomPayload {
  src: string
  alt: string
  caption?: string
  subcaption?: string
  kind?: MediaZoomKind
}

interface MediaZoomState extends MediaZoomPayload {
  anchor: HTMLElement
}

const state = ref<MediaZoomState | null>(null)

export function useMediaZoom() {
  function open(payload: MediaZoomPayload, anchor: HTMLElement) {
    state.value = { ...payload, anchor }
  }
  function close() {
    state.value = null
  }
  function toggle(payload: MediaZoomPayload, anchor: HTMLElement) {
    if (state.value?.src === payload.src) close()
    else open(payload, anchor)
  }
  return { state, open, close, toggle }
}
