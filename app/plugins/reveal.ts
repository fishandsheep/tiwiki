// v-reveal: adds `.revealed` when element scrolls into view (once).
// Registered universally so the directive resolves during SSR (no warn);
// only the `mounted`/`unmounted` hooks fire, and only on the client.
// Start state (.reveal hidden) is gated behind html.js in CSS, so elements
// ship visible when JS is off / observer never fires.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', {
    mounted(el: HTMLElement) {
      if (!import.meta.client) return
      if (typeof IntersectionObserver === 'undefined') {
        el.classList.add('revealed')
        return
      }
      const io = new IntersectionObserver(
        (entries, obs) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed')
              obs.unobserve(entry.target)
            }
          }
        },
        { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
      )
      io.observe(el)
      ;(el as any).__revealIO = io
    },
    unmounted(el: HTMLElement) {
      ;(el as any).__revealIO?.disconnect()
    },
  })
})
