export function usePageSeo(title: string, description: string, path: string) {
  const config = useRuntimeConfig()
  const canonical = new URL(path, String(config.public.siteUrl)).toString()
  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: 'website',
    ogUrl: canonical,
    ogSiteName: 'Ti 百科',
    twitterCard: 'summary',
    twitterTitle: title,
    twitterDescription: description,
  })
  useHead({ link: [{ rel: 'canonical', href: canonical }] })
  return canonical
}
