<template>
  <div>
    <TiHero :t="detail!" />

    <div class="mx-auto max-w-shell px-3 py-4 sm:px-4 sm:py-6 lg:py-8">
      <div class="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        <!-- 主内容 -->
        <div class="order-2 min-w-0 space-y-4 sm:space-y-5 lg:order-none lg:col-span-2">
          <!-- 赛事简介 -->
          <section v-reveal class="reveal card p-3.5 sm:p-5 lg:p-6">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <h2 class="text-base font-bold text-ink-main lg:text-lg">赛事简介</h2>
            </div>
            <p class="max-w-prose text-sm leading-6 text-ink-muted lg:text-base lg:leading-8">{{ detail?.summaryZh }}</p>
          </section>

          <!-- 中国战队表现 -->
          <TiChinaPerformance v-if="china" v-reveal :style="{ '--i': 1 }" :perf="china" @focus-team="focusTeam" />

          <!-- 最终排名（含全部队伍 + 赛区 + 出线方式） -->
          <TiPlacementTable
            v-reveal
            :style="{ '--i': 2 }"
            :placements="detail?.placements || []"
            :status="detail?.status"
            @focus-team="focusTeam"
          />

          <!-- 参赛阵容 -->
          <TiRosterTable
            v-if="detail?.rosters?.length"
            v-reveal
            :style="{ '--i': 3 }"
            :rosters="detail.rosters"
            :status="detail.status"
            :active-team-id="activeTeamId"
          />
        </div>

        <!-- 侧栏：基础信息 -->
        <div class="order-1 min-w-0 lg:order-none lg:col-span-1 lg:row-start-1">
          <TiInfoPanel v-reveal :t="detail!" @focus-team="focusTeam" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const id = String(route.params.id)
const activeTeamId = ref('')
let activeTeamTimer: ReturnType<typeof window.setTimeout> | null = null

const { data: detail } = await useTournament(id)
if (!detail.value) {
  throw createError({ statusCode: 404, statusMessage: '未找到该届 ti', fatal: true })
}

const { data: china } = await useChinaPerformance(detail.value.id)

function clearActiveTeamTimer() {
  if (activeTeamTimer) {
    clearTimeout(activeTeamTimer)
    activeTeamTimer = null
  }
}

async function scrollToTeam(teamId: string) {
  await nextTick()
  if (!import.meta.client) return
  const target = document.getElementById(`roster-${teamId}`)
  if (!target) return
  activeTeamId.value = teamId
  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  clearActiveTeamTimer()
  activeTeamTimer = window.setTimeout(() => {
    if (activeTeamId.value === teamId) activeTeamId.value = ''
    activeTeamTimer = null
  }, 2200)
}

async function focusTeam(teamId: string) {
  if (!teamId) return
  const hash = `#roster-${teamId}`
  if (route.hash === hash) {
    await scrollToTeam(teamId)
    return
  }
  await router.replace({ hash })
}

watch(
  () => route.hash,
  async (hash) => {
    if (!hash.startsWith('#roster-')) return
    await scrollToTeam(hash.replace('#roster-', ''))
  },
)

onMounted(async () => {
  if (route.hash.startsWith('#roster-')) {
    await scrollToTeam(route.hash.replace('#roster-', ''))
  }
})

onBeforeUnmount(() => {
  clearActiveTeamTimer()
})

useHead({
  title:
    detail.value.status === 'cancelled'
      ? `${detail.value.year} 赛事取消 — Ti百科`
      : `Ti${detail.value.tiNo} · ${detail.value.nameZh} — Ti百科`,
  meta: [{ name: 'description', content: detail.value.summaryZh }],
})
</script>
