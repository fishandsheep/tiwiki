// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss','@vercel/speed-insights/nuxt'],

  css: ['~/assets/css/main.css'],

  // Flat component names: <AppHeader/> not <LayoutAppHeader/>, <TiCard/> not <TiTiCard/>
  components: [{ path: '~/components', pathPrefix: false }],

  app: {
    // Subtle route crossfade (brand register: motion as voice, not noise).
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'zh-CN', class: 'dark' },
      title: 'TI 百科 — Dota2 国际邀请赛中文资料库',
      // Progressive enhancement: gates the reveal start-state behind html.js so
      // content ships visible when JS is off / in headless renderers.
      script: [
        { innerHTML: "document.documentElement.classList.add('js')", tagPosition: 'head' },
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            '中文 Dota2 TI（The International）历届赛事资料站，收录 TI1~TI15 基础资料、冠军、奖金池、参赛队伍、最终排名与中国战队表现。',
        },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  // SSG: crawl all internal links so every /ti/:id detail page is prerendered.
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/ti', '/china', '/rankings'],
      ignore: ['/admin'],
    },
  },
})
