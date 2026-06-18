// v-media-zoom: attach to an <img> to float an enlarged preview on hover.
// Registered universally (resolves during SSR without warning); only the
// client hooks fire. No tabindex is added — the image is supplementary to the
// adjacent team/player name text (already screen-reader accessible via alt),
// so keyboard tab order stays clean. Pointer users get the preview.
//
// Binding value: { src?, alt?, caption?, subcaption?, kind?, toggleOnClick? }
//   src defaults to the image's own currentSrc/src.
//   toggleOnClick (default true) — on touch devices a tap toggles the preview.
//     Set false when the image sits inside its own interactive control (e.g. a
//     table row button) so the tap goes to that control instead.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive<HTMLElement, Record<string, unknown>>('media-zoom', {
    mounted(el, binding) {
      if (!import.meta.client) return
      const img = el as HTMLImageElement
      const coarse =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(pointer: coarse)').matches
      const toggleOnClick = binding.value?.toggleOnClick !== false

      const payload = () => {
        const v = (binding.value || {}) as Record<string, unknown>
        const src = (v.src as string) || img.currentSrc || img.src
        if (!src) return null
        return {
          src,
          alt: (v.alt as string) || img.alt || '',
          caption: v.caption as string | undefined,
          subcaption: v.subcaption as string | undefined,
          kind: v.kind as 'logo' | 'avatar' | undefined,
        }
      }

      let timer: ReturnType<typeof setTimeout> | undefined

      // Fine pointers: hover with a tiny intent delay so sweeping a roster
      // list doesn't strobe the preview open on every row.
      const onEnter = () => {
        if (coarse) return
        clearTimeout(timer)
        timer = setTimeout(() => {
          const p = payload()
          if (p) useMediaZoom().open(p, img)
        }, 110)
      }
      const onLeave = () => {
        if (coarse) return
        clearTimeout(timer)
        const st = useMediaZoom().state.value
        if (st && st.anchor === img) useMediaZoom().close()
      }
      // Coarse pointers: tap toggles (unless opted out — e.g. inside a button).
      const onClick = (e: Event) => {
        if (!coarse || !toggleOnClick) return
        const p = payload()
        if (!p) return
        e.stopPropagation()
        useMediaZoom().toggle(p, img)
      }

      img.addEventListener('mouseenter', onEnter)
      img.addEventListener('mouseleave', onLeave)
      img.addEventListener('click', onClick)
      ;(img as any).__mz = { onEnter, onLeave, onClick, timer }
    },
    unmounted(el) {
      const img = el as any
      if (!img.__mz) return
      clearTimeout(img.__mz.timer)
      img.removeEventListener('mouseenter', img.__mz.onEnter)
      img.removeEventListener('mouseleave', img.__mz.onLeave)
      img.removeEventListener('click', img.__mz.onClick)
      // If this image's preview is the one open, clear it.
      const st = useMediaZoom().state.value
      if (st && st.anchor === img) useMediaZoom().close()
      delete img.__mz
    },
  })
})
