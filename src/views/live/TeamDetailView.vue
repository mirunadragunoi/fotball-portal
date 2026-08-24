<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTeamsStore } from '@/stores/teams'
import { useClubTeamsStore } from '@/stores/clubTeams'
import { formatKickoff } from '@/utils/liveScoreFormat'
import PlayerPositionGroup from '@/components/livescore/PlayerPositionGroup.vue'
import PlayerDetailModal from '@/components/livescore/PlayerDetailModal.vue'

const route  = useRoute()
const router = useRouter()
const { t, locale }  = useI18n()
function kickoffStr(m) {
  return formatKickoff(m.date || m.match_date, m.time, { locale: locale.value }).dateTime
}

const teamsStore = useTeamsStore()
const clubStore  = useClubTeamsStore()

const teamId = computed(() => route.params.teamId)

const loading = ref(true)
const error   = ref(null)

onMounted(async () => {
  try {
    // selectTeam picks from already-loaded teams (may be empty for direct navigation)
    teamsStore.selectTeam(teamId.value)
    await Promise.all([
      teamsStore.loadLastMatches(teamId.value),
      // Club squads + photos for the top-5 leagues (name-matched to this team).
      clubStore.loadAll(route.query.season || '2026'),
    ])
    // live-score-api squad (needs competitionId + season) — used only when the
    // team has no club-squad JSON match.
    if (route.query.competitionId) {
      await teamsStore.loadSquad(
        route.query.competitionId,
        teamId.value,
        route.query.season || '2026',
      )
    }
  } catch (e) {
    error.value = e?.message || 'Failed to load team data'
  } finally {
    loading.value = false
  }
})

const team        = computed(() => teamsStore.selectedTeam)
const lastMatches = computed(() => teamsStore.teamLastMatches || [])
const squad       = computed(() => teamsStore.teamSquad || [])

// Team name: from reference data if loaded, else derived from recent matches
// (direct navigation to /live/team/:id has no preloaded team object).
const teamName = computed(() => {
  if (team.value?.name) return team.value.name
  const m = lastMatches.value.find((x) =>
    String(x.home_id ?? x.home?.id) === String(teamId.value) ||
    String(x.away_id ?? x.away?.id) === String(teamId.value),
  )
  if (!m) return ''
  return String(m.home_id ?? m.home?.id) === String(teamId.value)
    ? (m.home_name || m.home?.name || '')
    : (m.away_name || m.away?.name || '')
})

// Club squad (with photos) resolved by name from the synced league JSON.
const clubTeam = computed(() => clubStore.getTeamByName(teamName.value))
const teamLogo = computed(() => team.value?.logo || clubTeam.value?.logo || null)

const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']
const POSITION_LABELS = computed(() => ({
  Goalkeeper: t('worldcup.posGoalkeepers'),
  Defender:   t('worldcup.posDefenders'),
  Midfielder: t('worldcup.posMidfielders'),
  Attacker:   t('worldcup.posAttackers'),
}))

const clubSquadGroups = computed(() => {
  const players = clubTeam.value?.players || []
  if (!players.length) return []
  const map = {}
  for (const p of players) {
    const pos = p.position || 'Other'
    if (!map[pos]) map[pos] = []
    map[pos].push(p)
  }
  for (const pos in map) map[pos].sort((a, b) => (a.number || 99) - (b.number || 99))
  const ordered = POSITION_ORDER.filter((pos) => map[pos]?.length).map((pos) => ({
    position: pos, label: POSITION_LABELS.value[pos] || pos, players: map[pos],
  }))
  const rest = Object.entries(map)
    .filter(([pos]) => !POSITION_ORDER.includes(pos))
    .map(([pos, players]) => ({ position: pos, label: pos, players }))
  return ordered.concat(rest)
})

// Fallback: live-score-api squad grouped by position (no photos).
const squadGroups = computed(() => {
  const groups = {}
  for (const p of squad.value) {
    const pos = p.position || p.pos || 'Other'
    if (!groups[pos]) groups[pos] = []
    groups[pos].push(p)
  }
  return groups
})

// Player detail modal (club squad only — players carry api-football ids).
const activePlayer = ref(null)
function openPlayer(p) { activePlayer.value = p }
function closePlayer() { activePlayer.value = null }
</script>

<template>
  <main class="team-view">
    <div class="team-view__inner">
      <button class="team-view__back" @click="router.back()">← {{ t('common.back', 'Back') }}</button>

      <div v-if="loading" class="team-view__loading">
        <div class="team-view__skel team-view__skel--head"></div>
        <div v-for="n in 8" :key="n" class="team-view__skel"></div>
      </div>

      <div v-else-if="error" class="team-view__error">{{ error }}</div>

      <template v-else>
        <!-- Team header -->
        <div class="team-view__head">
          <img
            v-if="teamLogo"
            :src="teamLogo"
            :alt="teamName || ''"
            width="72"
            height="72"
            class="team-view__logo"
            loading="lazy"
          />
          <div class="team-view__meta">
            <h1 class="team-view__name">{{ teamName || t('live.team', 'Team') }}</h1>
            <div v-if="team?.country || clubTeam?.league?.name" class="team-view__country">
              {{ team?.country || clubTeam?.league?.name }}
            </div>
          </div>
        </div>

        <!-- Last matches -->
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
              <span
                class="team-view__match-home"
                :class="{ 'team-view__match-name--bold': String(m.home_id || m.home?.id) === String(teamId) }"
              >
                {{ m.home_name || m.home?.name || '—' }}
              </span>
              <span class="team-view__match-score">{{ m.score || m.ft_score || '– –' }}</span>
              <span
                class="team-view__match-away"
                :class="{ 'team-view__match-name--bold': String(m.away_id || m.away?.id) === String(teamId) }"
              >
                {{ m.away_name || m.away?.name || '—' }}
              </span>
            </RouterLink>
          </div>
        </section>

        <!-- Club squad (Panini cards + player modal) when a synced roster matches -->
        <section v-if="clubSquadGroups.length" class="team-view__section">
          <h2 class="team-view__section-title">{{ t('live.squad', 'Squad') }}</h2>
          <PlayerPositionGroup
            v-for="group in clubSquadGroups"
            :key="group.position"
            :position-label="group.label"
            :players="group.players"
            :team="clubTeam"
            @select-player="openPlayer"
          />
        </section>

        <!-- Fallback: live-score-api squad (no photos) when no club roster -->
        <section v-else-if="squad.length" class="team-view__section">
          <h2 class="team-view__section-title">{{ t('live.squad', 'Squad') }}</h2>
          <div
            v-for="(players, pos) in squadGroups"
            :key="pos"
            class="team-view__squad-group"
          >
            <h3 class="team-view__pos-label">{{ pos }}</h3>
            <div class="team-view__players">
              <div v-for="(p, i) in players" :key="p.id || i" class="team-view__player">
                <span class="team-view__player-num">{{ p.number ?? p.shirt_number ?? '' }}</span>
                <img
                  v-if="p.photo || p.image"
                  :src="p.photo || p.image"
                  :alt="p.name || p.player_name || ''"
                  width="36"
                  height="36"
                  class="team-view__player-img"
                  loading="lazy"
                />
                <div class="team-view__player-meta">
                  <span class="team-view__player-name">{{ p.name || p.player_name }}</span>
                  <span v-if="p.nationality || p.country" class="team-view__player-nat">{{ p.nationality || p.country }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- No data fallback -->
        <div v-if="!lastMatches.length && !squad.length && !clubSquadGroups.length" class="team-view__empty">
          {{ t('live.noTeamData', 'No data available for this team') }}
        </div>
      </template>

      <!-- Player detail modal (club players) -->
      <PlayerDetailModal
        v-if="clubTeam"
        :player="activePlayer"
        :team="clubTeam"
        @close="closePlayer"
      />
    </div>
  </main>
</template>

<style scoped>
.team-view {
  padding: 32px var(--content-padding);
}

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

.team-view__logo {
  border-radius: 12px;
  object-fit: contain;
}

.team-view__name {
  font-family: var(--font-heading);
  font-size: 32px;
  font-weight: 800;
  text-transform: uppercase;
  margin: 0 0 4px;
}

.team-view__country {
  font-size: 14px;
  color: var(--color-text-secondary);
}

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

.team-view__match:hover {
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
}

.team-view__match-date {
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.team-view__match-home {
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-view__match-away {
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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

.team-view__player-img {
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.team-view__player-name {
  font-weight: 600;
  font-size: 13px;
  display: block;
}

.team-view__player-nat {
  font-size: 11px;
  color: var(--color-text-secondary);
  display: block;
}

.team-view__loading { display: flex; flex-direction: column; gap: 8px; }

.team-view__skel {
  height: 48px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  animation: shimmer 1.4s ease-in-out infinite;
}

.team-view__skel--head { height: 100px; }

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.team-view__error,
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
