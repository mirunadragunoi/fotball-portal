import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const WC_KICKOFF_MS = Date.parse('2026-06-11T00:00:00Z')
const WC_END_MS     = Date.parse('2026-07-20T00:00:00Z')
const DAY_MS        = 86_400_000
// Eyebrow only changes by days — refreshing once per hour is plenty.
const REFRESH_MS    = 60 * 60 * 1000

/**
 * Returns a reactive `eyebrow` string for the hero, based on where today
 * sits relative to the Tournament 2026 calendar:
 *
 *   pre-kickoff  → "Tournament 2026 · {days} days to kickoff" (or today/tomorrow)
 *   during       → "Tournament 2026 · Live now"
 *   post-final   → "Tournament 2026 · Tournament closed"
 *
 * Note: "World Cup" is a FIFA trademark; we use the generic "Tournament 2026"
 * across all user-facing copy (hero, nav, routes). Internal identifiers like
 * `useWorldCupTeamsStore` and the i18n key prefix `worldcup` are kept for
 * lower churn and aren't visible to users.
 */
export function useTournamentEyebrow() {
  const { t } = useI18n()
  const now = ref(Date.now())
  let timer = null

  onMounted(() => {
    timer = setInterval(() => { now.value = Date.now() }, REFRESH_MS)
  })
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  const eyebrow = computed(() => {
    const today = now.value
    if (today < WC_KICKOFF_MS) {
      const days = Math.ceil((WC_KICKOFF_MS - today) / DAY_MS)
      if (days <= 0) return t('hero.eyebrow.kickoffToday')
      if (days === 1) return t('hero.eyebrow.kickoffTomorrow')
      return t('hero.eyebrow.kickoff', { days })
    }
    if (today < WC_END_MS) {
      return t('hero.eyebrow.live')
    }
    return t('hero.eyebrow.concluded')
  })

  return { eyebrow }
}
