<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRostersStore } from '@/stores/rosters'
import { useTeamsStore } from '@/stores/teams'
import { formatKickoff } from '@/utils/liveScoreFormat'
import TeamBanner from '@/components/livescore/TeamBanner.vue'
import PlayerPositionGroup from '@/components/livescore/PlayerPositionGroup.vue'
import PlayerDetailModal from '@/components/livescore/PlayerDetailModal.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

// Generic squad page. Two modes:
//   • WC / tournament routes -> national-team roster (wc2026-teams.json), rich
//     Panini grid + TeamBanner (unchanged from before).
//   • /live/team/:id (clubs)  -> club roster (leagues/*.json) resolved by name,
//     header + recent matches + Panini squad, with a live-score-api / empty
//     fallback. WC-roster lookup is gated to tournament routes so a live-score-api
//     club id can never collide with an api-football national-team id.

const { t, locale } = useI18n()
const route  = useRoute()
const router = useRouter()
const rosters    = useRostersStore()
const teamsStore = useTeamsStore()

const teamId = computed(() => route.params.teamId)
const loading = ref(true)

const TOURNAMENT_ROUTES = new Set(['TournamentTeamSquad', 'TournamentViewTeamSquad'])
const isTournamentRoute = computed(() => TOURNAMENT_ROUTES.has(route.name))
// The dedicated WC squad route always renders WC mode (preserving its
// "team not found" state); the generic cup route falls back to club mode.
const isWcRoute = computed(() => route.name === 'TournamentTeamSquad')

function kickoffStr(m) {
  return formatKickoff(m.date || m.match_date, m.time, { locale: locale.value }).dateTime
}

async function load() {
  loading.value = true
  const season = route.query.season || '2026'
  await Promise.all([
    rosters.loadTeams(),
    rosters.loadLeagueRosters(season),
    teamsStore.loadLastMatches(teamId.value),
  ])
  teamsStore.selectTeam(teamId.value)
  if (route.query.competitionId) {
    await teamsStore.loadSquad(route.query.competitionId, teamId.value, season)
  }
  loading.value = false
}

onMounted(load)
watch(teamId, load)

// ── Team resolution ─────────────────────────────────────────────────────────
// WC national team (roster id) — only on tournament routes.
const wcTeam = computed(() => (isTournamentRoute.value ? rosters.getTeamById(teamId.value) : null))
const isWc = computed(() => !!wcTeam.value)

const refTeam     = computed(() => teamsStore.selectedTeam)
const lastMatches = computed(() => teamsStore.teamLastMatches || [])

// Team name for club resolution — reference data, else derived from recent matches.
const teamName = computed(() => {
  if (wcTeam.value?.name) return wcTeam.value.name
  if (refTeam.value?.name) return refTeam.value.name
  const m = lastMatches.value.find((x) =>
    String(x.home_id ?? x.home?.id) === String(teamId.value) ||
    String(x.away_id ?? x.away?.id) === String(teamId.value),
  )
  if (!m) return ''
  return String(m.home_id ?? m.home?.id) === String(teamId.value)
    ? (m.home_name || m.home?.name || '')
    : (m.away_name || m.away?.name || '')
})

const clubTeam = computed(() => (isWc.value ? null : rosters.getClubTeamByName(teamName.value)))
const rosterTeam = computed(() => wcTeam.value || clubTeam.value)
const teamLogo   = computed(() => wcTeam.value?.logo || refTeam.value?.logo || clubTeam.value?.logo || null)

// ── Squad grouping (shared) ─────────────────────────────────────────────────
const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']
const POSITION_LABELS = computed(() => ({
  Goalkeeper: t('worldcup.posGoalkeepers'),
  Defender:   t('worldcup.posDefenders'),
  Midfielder: t('worldcup.posMidfielders'),
  Attacker:   t('worldcup.posAttackers'),
}))

function groupByPosition(players) {
  const map = {}
  for (const p of players || []) {
    const pos = p.position || 'Other'
    if (!map[pos]) map[pos] = []
    map[pos].push(p)
  }
  for (const pos in map) map[pos].sort((a, b) => (a.number || 99) - (b.number || 99))
  const ordered = POSITION_ORDER
    .filter((pos) => map[pos]?.length)
    .map((pos) => ({ position: pos, label: POSITION_LABELS.value[pos] || pos, players: map[pos] }))
  const rest = Object.entries(map)
    .filter(([pos]) => !POSITION_ORDER.includes(pos))
    .map(([pos, players]) => ({ position: pos, label: pos, players }))
  return ordered.concat(rest)
}

const playersByPosition = computed(() => groupByPosition(rosterTeam.value?.players))

// live-score-api squad fallback (no photos) — club mode only, no roster match.
const lsaSquad = computed(() => teamsStore.teamSquad || [])
const lsaSquadGroups = computed(() => {
  const groups = {}
  for (const p of lsaSquad.value) {
    const pos = p.position || p.pos || 'Other'
    if (!groups[pos]) groups[pos] = []
    groups[pos].push(p)
  }
  return groups
})

// ── Player modal ────────────────────────────────────────────────────────────
const activePlayer = ref(null)
function openPlayer(p) { activePlayer.value = p }
function closePlayer() { activePlayer.value = null }

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push(isWc.value ? { name: 'Tournament', query: { tab: 'teams' } } : { name: 'Live' })
}
</script>

<template>
  <main class="tsv">
    <!-- ═══ WC / tournament mode ═══ -->
    <template v-if="isWcRoute || isWc">
      <button class="tsv__back" @click="goBack" :aria-label="t('worldcup.backToTeams')">
        {{ t('worldcup.backToTeams') }}
      </button>

      <div v-if="loading" class="tsv__skeletons">
        <SkeletonCard v-for="n in 4" :key="n" />
      </div>

      <EmptyState v-else-if="!wcTeam" :message="t('worldcup.teamNotFound')" :show-reset="false" />

      <template v-else>
        <TeamBanner :team="wcTeam" />
        <div class="tsv__summary">
          <span class="tsv__player-count">{{ t('worldcup.playerCount', { count: wcTeam.players?.length || 0 }) }}</span>
          <span v-if="!wcTeam.players?.length" class="tsv__no-squad">{{ t('worldcup.noSquad') }}</span>
        </div>
        <PlayerPositionGroup
          v-for="group in playersByPosition"
          :key="group.position"
          :position-label="group.label"
          :players="group.players"
          :team="wcTeam"
          @select-player="openPlayer"
        />
      </template>
    </template>

    <!-- ═══ Club / generic team mode ═══ -->
    <div v-else class="team-view__inner">
      <button class="team-view__back" @click="goBack">← {{ t('common.back', 'Back') }}</button>

      <div v-if="loading" class="team-view__loading">
        <div class="team-view__skel team-view__skel--head"></div>
        <div v-for="n in 8" :key="n" class="team-view__skel"></div>
      </div>

      <template v-else>
        <!-- Team header -->
        <div class="team-view__head">
          <img v-if="teamLogo" :src="teamLogo" :alt="teamName || ''" width="72" height="72" class="team-view__logo" loading="lazy" />
          <div class="team-view__meta">
            <h1 class="team-view__name">{{ teamName || t('live.team', 'Team') }}</h1>
            <div v-if="refTeam?.country || clubTeam?.league?.name" class="team-view__country">
              {{ refTeam?.country || clubTeam?.league?.name }}
            </div>
          </div>
        </div>

        <!-- Recent matches -->
        <section v-if="lastMatches.length" class="team-view__section">
          <h2 class="team-view__section-title">{{ t('live.lastMatches', 'Recent Matches') }}</h2>
          <div class="team-view__matches">
            <RouterLink
              v-for="(m, i) in lastMatches.slice(0, 10)"
              :key="m.id || i"
              :to="`/live/match/${m.id}`"
              class="team-view__match"
            >
              <span class="team-view__match-date">{{ kickoffStr(m) }}</span>
              <span class="team-view__match-home" :class="{ 'team-view__match-name--bold': String(m.home_id || m.home?.id) === String(teamId) }">
                {{ m.home_name || m.home?.name || '—' }}
              </span>
              <span class="team-view__match-score">{{ m.score || m.ft_score || '– –' }}</span>
              <span class="team-view__match-away" :class="{ 'team-view__match-name--bold': String(m.away_id || m.away?.id) === String(teamId) }">
                {{ m.away_name || m.away?.name || '—' }}
              </span>
            </RouterLink>
          </div>
        </section>

        <!-- Club squad (Panini + modal) -->
        <section v-if="playersByPosition.length" class="team-view__section">
          <h2 class="team-view__section-title">{{ t('live.squad', 'Squad') }}</h2>
          <PlayerPositionGroup
            v-for="group in playersByPosition"
            :key="group.position"
            :position-label="group.label"
            :players="group.players"
            :team="clubTeam"
            @select-player="openPlayer"
          />
        </section>

        <!-- Fallback: live-score-api squad (no photos) -->
        <section v-else-if="lsaSquad.length" class="team-view__section">
          <h2 class="team-view__section-title">{{ t('live.squad', 'Squad') }}</h2>
          <div v-for="(players, pos) in lsaSquadGroups" :key="pos" class="team-view__squad-group">
            <h3 class="team-view__pos-label">{{ pos }}</h3>
            <div class="team-view__players">
              <div v-for="(p, i) in players" :key="p.id || i" class="team-view__player">
                <span class="team-view__player-num">{{ p.number ?? p.shirt_number ?? '' }}</span>
                <img v-if="p.photo || p.image" :src="p.photo || p.image" :alt="p.name || p.player_name || ''" width="36" height="36" class="team-view__player-img" loading="lazy" />
                <div class="team-view__player-meta">
                  <span class="team-view__player-name">{{ p.name || p.player_name }}</span>
                  <span v-if="p.nationality || p.country" class="team-view__player-nat">{{ p.nationality || p.country }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div v-if="!lastMatches.length && !lsaSquad.length && !playersByPosition.length" class="team-view__empty">
          {{ t('live.noTeamData', 'No data available for this team') }}
        </div>
      </template>
    </div>

    <!-- Player detail modal (shared) -->
    <PlayerDetailModal :player="activePlayer" :team="rosterTeam" @close="closePlayer" />
  </main>
</template>

<style scoped>
/* ── WC / tournament mode ─────────────────────────────────────────────────── */
.tsv {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 20px var(--content-padding) 64px;
}

.tsv__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  padding: 8px 14px;
  border-radius: var(--radius-button);
  border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-default);
}

.tsv__back:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tsv__skeletons {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.tsv__summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.tsv__player-count {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  padding: 4px 10px;
  border-radius: 99px;
}

.tsv__no-squad {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-style: italic;
}

/* ── Club / generic mode ──────────────────────────────────────────────────── */
.team-view__inner {
  max-width: 900px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.team-view__back {
  align-self: flex-start;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: var(--transition-default);
}

.team-view__back:hover { color: var(--color-text); }

.team-view__head {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 24px;
}

.team-view__logo { border-radius: 12px; object-fit: contain; }

.team-view__name {
  font-family: var(--font-heading);
  font-size: 32px;
  font-weight: 800;
  text-transform: uppercase;
  margin: 0 0 4px;
}

.team-view__country { font-size: 14px; color: var(--color-text-secondary); }

.team-view__section { display: flex; flex-direction: column; gap: 12px; }

.team-view__section-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  margin: 0;
  color: var(--color-text-secondary);
  letter-spacing: 0.06em;
}

.team-view__matches { display: flex; flex-direction: column; gap: 4px; }

.team-view__match {
  display: grid;
  grid-template-columns: 90px 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-surface);
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-text);
  font-size: 13px;
  transition: var(--transition-default);
}

.team-view__match:hover { background: color-mix(in srgb, var(--color-text) 6%, transparent); }

.team-view__match-date { font-size: 11px; color: var(--color-text-secondary); white-space: nowrap; }
.team-view__match-home { text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.team-view__match-away { text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.team-view__match-name--bold { font-weight: 700; }

.team-view__match-score {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 14px;
  min-width: 44px;
  text-align: center;
  flex-shrink: 0;
  padding: 2px 8px;
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  border-radius: 4px;
}

.team-view__squad-group { display: flex; flex-direction: column; gap: 8px; }

.team-view__pos-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-primary);
  margin: 0;
}

.team-view__players {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.team-view__player {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--color-surface);
  border-radius: 8px;
}

.team-view__player-num {
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 800;
  color: var(--color-text-secondary);
  min-width: 24px;
  text-align: center;
}

.team-view__player-img { border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.team-view__player-name { font-weight: 600; font-size: 13px; display: block; }
.team-view__player-nat { font-size: 11px; color: var(--color-text-secondary); display: block; }

.team-view__loading { display: flex; flex-direction: column; gap: 8px; }

.team-view__skel {
  height: 48px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  animation: tsv-shimmer 1.4s ease-in-out infinite;
}

.team-view__skel--head { height: 100px; }

@keyframes tsv-shimmer {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.team-view__empty {
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border-radius: var(--radius-card);
}

@media (max-width: 600px) {
  .team-view__match { grid-template-columns: 70px 1fr auto 1fr; font-size: 12px; }
  .team-view__players { grid-template-columns: 1fr 1fr; }
}
</style>
