<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorldCupTeamsStore, normClubName } from '@/stores/rosters'

const props = defineProps({
  player: { type: Object, default: null },
  team:   { type: Object, default: null },
})
const emit = defineEmits(['close'])

const { t } = useI18n()
const store = useWorldCupTeamsStore()

const POS_KEY = {
  Goalkeeper: 'history.posGK',
  Defender:   'history.posDF',
  Midfielder: 'history.posMF',
  Attacker:   'history.posFW',
}

function posLabel(pos) {
  return pos ? t(POS_KEY[pos] || pos, pos) : ''
}

const detail     = ref(null)
const fantasy    = ref(null)
const profile    = ref(null)
const detailFull = computed(() => detail.value?.player || null)

// A national-team squad (WC/tournament) carries a `group`; a club squad does not.
// This is the same signal the header uses to show the group badge.
const isClubContext = computed(() => !!props.team?.name && !props.team.group)

function sameClub(a, b) {
  return !!a && !!b && normClubName(a) === normClubName(b)
}

// api-football's /players `statistics` is grouped by competition, so a player
// can have several blocks with DIFFERENT teams (other clubs from earlier in the
// season, plus the national team). statistics[0] is therefore not reliably the
// club the user navigated from — taking it blindly showed a second, wrong club
// on the profile (the reported bug). When we arrived from a club page, pin the
// stats to that club's block; otherwise pick the block with the most
// appearances (the player's main club, not an arbitrary first entry).
const stats = computed(() => {
  const blocks = detail.value?.statistics || []
  if (!blocks.length) return null
  if (isClubContext.value) {
    const hit = blocks.find((b) => sameClub(b.team?.name, props.team.name))
    if (hit) return hit
  }
  return [...blocks].sort(
    (a, b) => (b.games?.appearences || 0) - (a.games?.appearences || 0),
  )[0]
})

// Show the standalone "current club" row only when it isn't the club we already
// name in the header (i.e. national-team / no-team entry points). Navigating
// from a club, the header already identifies it — a second row is redundant and
// was the source of the two-clubs confusion.
const showCurrentClub = computed(() => !isClubContext.value && !!stats.value?.team?.name)

// Edge case: navigated from a club but no stat block matched it (e.g. a fresh
// transfer with a stale roster). Label the stats with the club they actually
// belong to rather than implying they are the navigated-from team's.
const statsClubDiffers = computed(() =>
  isClubContext.value &&
  !!stats.value?.team?.name &&
  !sameClub(stats.value.team.name, props.team.name),
)

const transfers = computed(() => profile.value?.transfers || [])
const trophies  = computed(() => (profile.value?.trophies || []).filter(tr => tr.place === 'Winner').slice(0, 12))
const sidelined = computed(() => (profile.value?.sidelined || []).slice(0, 8))

watch(
  () => props.player?.id,
  async (id) => {
    detail.value = null
    fantasy.value = null
    profile.value = null
    if (!id) return

    // Personal + club-season stats from api-football
    const cached = store.playerDetails[id]
    detail.value = cached || await store.loadPlayerDetails(id)

    // Extended profile: transfers / trophies / injury history (independent load)
    store.loadPlayerProfile(id).then((p) => {
      // Guard against a stale response after the modal switched players.
      if (props.player?.id === id) profile.value = p
    })

    // Fantasy stats from /football/livescore/fantasy (aggregated across WC matches)
    if (props.team) {
      fantasy.value = await store.loadPlayerFantasy(props.player, props.team)
    }
  },
  { immediate: true },
)

function fmtTransferDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) }
  catch { return iso }
}

function initials(name) {
  return (name || '?').split(' ').map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()
}

function closeOnBackdrop(e) {
  if (e.target === e.currentTarget) emit('close')
}

function fmtDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) }
  catch { return iso }
}

function fmtRating(val) {
  if (!val) return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n.toFixed(1)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="player"
      class="pdm-backdrop"
      role="dialog"
      aria-modal="true"
      :aria-label="`${player.name} details`"
      @click="closeOnBackdrop"
      @keydown.esc="emit('close')"
    >
      <div class="pdm">
        <!-- close button -->
        <button class="pdm__close" aria-label="Close" @click="emit('close')">✕</button>

        <!-- header -->
        <div class="pdm__header">
          <div class="pdm__photo-wrap">
            <img
              v-if="player.photo"
              :src="player.photo"
              :alt="`Photo of ${player.name}`"
              class="pdm__photo"
              loading="lazy"
            />
            <div v-else class="pdm__photo-placeholder">{{ initials(player.name) }}</div>
          </div>

          <div class="pdm__header-info">
            <div class="pdm__number" v-if="player.number">#{{ player.number }}</div>
            <h2 class="pdm__name">{{ detailFull?.name || player.name }}</h2>
            <div class="pdm__pos-age">
              <span class="pdm__badge">{{ posLabel(player.position) }}</span>
              <template v-if="detailFull?.age || player.age">
                <span>{{ detailFull?.age || player.age }} {{ t('worldcup.playerYrs') }}</span>
              </template>
            </div>

            <template v-if="team">
              <div class="pdm__team-row">
                <img v-if="team.logo" :src="team.logo" :alt="team.name" class="pdm__team-logo" />
                <span class="pdm__team-name">{{ team.name }}</span>
                <span class="pdm__group-badge" v-if="team.group">{{ t('worldcup.groupLabel') }} {{ team.group }}</span>
              </div>
            </template>

            <!-- current club (only when it isn't already the header team) -->
            <template v-if="showCurrentClub">
              <div class="pdm__club-row">
                <img v-if="stats.team.logo" :src="stats.team.logo" :alt="stats.team.name" class="pdm__club-logo" />
                <div class="pdm__club-info">
                  <span class="pdm__club-label">{{ t('worldcup.playerCurrentClub') }}</span>
                  <span class="pdm__club-value">{{ stats.team.name }}<template v-if="stats.league?.name"> · {{ stats.league.name }}</template></span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- loading -->
        <div v-if="store.playerDetailLoading && !detail" class="pdm__loading">{{ t('worldcup.playerLoading') }}</div>

        <!-- personal details -->
        <template v-if="detailFull">
          <div class="pdm__section-title">{{ t('worldcup.playerPersonal') }}</div>
          <div class="pdm__grid-2">
            <div class="pdm__kv"><span>{{ t('worldcup.playerBorn') }}</span><strong>{{ fmtDate(detailFull.birth?.date) }}</strong></div>
            <div class="pdm__kv"><span>{{ t('worldcup.playerNationality') }}</span><strong>{{ detailFull.nationality || '—' }}</strong></div>
            <div class="pdm__kv" v-if="detailFull.birth?.place"><span>{{ t('worldcup.playerBirthplace') }}</span><strong>{{ detailFull.birth.place }}</strong></div>
            <div class="pdm__kv" v-if="detailFull.height"><span>{{ t('worldcup.playerHeight') }}</span><strong>{{ detailFull.height }}</strong></div>
            <div class="pdm__kv" v-if="detailFull.weight"><span>{{ t('worldcup.playerWeight') }}</span><strong>{{ detailFull.weight }}</strong></div>
          </div>
        </template>

        <!-- club stats -->
        <template v-if="stats">
          <div class="pdm__section-title">
            {{ t('worldcup.playerClubStats') }}
            <span v-if="stats.league?.season" class="pdm__season-badge">{{ stats.league.season }}/{{ String(stats.league.season + 1).slice(2) }}</span>
          </div>
          <div v-if="statsClubDiffers || stats.league?.name" class="pdm__stats-caption">
            <template v-if="statsClubDiffers">{{ stats.team?.name }} · </template>{{ stats.league?.name }}
          </div>
          <div class="pdm__grid-3">
            <div class="pdm__stat"><div class="pdm__stat-val">{{ stats.games?.appearences ?? '—' }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerApps') }}</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ stats.goals?.total ?? '—' }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerGoals') }}</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ stats.goals?.assists ?? '—' }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerAssists') }}</div></div>
            <div class="pdm__stat" v-if="stats.games?.minutes != null"><div class="pdm__stat-val">{{ stats.games.minutes }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerMinutes') }}</div></div>
            <div class="pdm__stat" v-if="fmtRating(stats.games?.rating)"><div class="pdm__stat-val pdm__stat-val--rating">{{ fmtRating(stats.games.rating) }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerRating') }}</div></div>
            <div class="pdm__stat" v-if="stats.passes?.accuracy"><div class="pdm__stat-val">{{ stats.passes.accuracy }}%</div><div class="pdm__stat-lbl">{{ t('worldcup.playerPassAcc') }}</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ stats.cards?.yellow ?? 0 }}🟨 {{ stats.cards?.red ?? 0 }}🟥</div><div class="pdm__stat-lbl">{{ t('worldcup.playerCards') }}</div></div>
            <div class="pdm__stat" v-if="stats.shots?.on != null"><div class="pdm__stat-val">{{ stats.shots.on }}/{{ stats.shots.total }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerShotsOn') }}</div></div>
          </div>
        </template>

        <div v-else-if="!store.playerDetailLoading" class="pdm__no-stats">
          {{ t('worldcup.playerNoStats') }}
        </div>

        <!-- WC 2026 fantasy stats (aggregated across matches) -->
        <template v-if="fantasy">
          <div class="pdm__section-title">
            {{ t('worldcup.playerWcStats', 'Tournament 2026') }}
            <span class="pdm__season-badge">{{ fantasy.matches }} {{ fantasy.matches === 1 ? t('worldcup.playerWcMatch', 'match') : t('worldcup.playerWcMatches', 'matches') }}</span>
          </div>
          <div class="pdm__grid-3">
            <div class="pdm__stat"><div class="pdm__stat-val">{{ fantasy.goals }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerGoals') }}</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ fantasy.assists }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerAssists') }}</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ fantasy.shots }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerWcShots', 'Shots') }}</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ fantasy.passes }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerWcPasses', 'Passes') }}</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ fantasy.tackles }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerWcTackles', 'Tackles') }}</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ fantasy.duels }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerWcDuels', 'Duels') }}</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ fantasy.interceptions }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerWcIntercepts', 'Intercepts') }}</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ fantasy.clearances }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerWcClearances', 'Clearances') }}</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ fantasy.ball_touches }}</div><div class="pdm__stat-lbl">{{ t('worldcup.playerWcTouches', 'Touches') }}</div></div>
          </div>
        </template>

        <!-- Career transfers -->
        <template v-if="transfers.length">
          <div class="pdm__section-title">{{ t('player.transfers') }}</div>
          <ul class="pdm__timeline">
            <li v-for="(tr, i) in transfers" :key="i" class="pdm__transfer">
              <span class="pdm__transfer-date">{{ fmtTransferDate(tr.date) }}</span>
              <span class="pdm__transfer-move">
                <span>{{ tr.teams?.out?.name || '—' }}</span>
                <span class="pdm__transfer-arrow" aria-hidden="true">→</span>
                <span>{{ tr.teams?.in?.name || '—' }}</span>
              </span>
              <span v-if="tr.type" class="pdm__transfer-type">{{ tr.type }}</span>
            </li>
          </ul>
        </template>

        <!-- Trophies -->
        <template v-if="trophies.length">
          <div class="pdm__section-title">{{ t('player.trophies') }}</div>
          <ul class="pdm__trophies">
            <li v-for="(tr, i) in trophies" :key="i" class="pdm__trophy">
              <span aria-hidden="true">🏆</span>
              <span class="pdm__trophy-league">{{ tr.league }}</span>
              <span v-if="tr.season" class="pdm__trophy-season">{{ tr.season }}</span>
            </li>
          </ul>
        </template>

        <!-- Injury history -->
        <template v-if="sidelined.length">
          <div class="pdm__section-title">{{ t('player.injuryHistory') }}</div>
          <ul class="pdm__timeline">
            <li v-for="(s, i) in sidelined" :key="i" class="pdm__transfer">
              <span class="pdm__transfer-date">{{ fmtTransferDate(s.start) }}</span>
              <span class="pdm__transfer-move">{{ s.type || '—' }}</span>
            </li>
          </ul>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pdm__timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pdm__transfer {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-text) 4%, transparent);
}

.pdm__transfer-date {
  flex-shrink: 0;
  min-width: 68px;
  font-weight: 700;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.pdm__transfer-move {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text);
  font-weight: 600;
  min-width: 0;
  flex-wrap: wrap;
}

.pdm__transfer-arrow { color: var(--color-primary); }

.pdm__transfer-type {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--color-text-secondary);
}

.pdm__trophies {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.pdm__trophy {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text);
}

.pdm__trophy-league { font-weight: 600; }

.pdm__trophy-season {
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}
</style>

<style scoped>
.pdm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  backdrop-filter: blur(3px);
}

@media (min-width: 640px) {
  .pdm-backdrop {
    align-items: center;
    padding: 24px;
  }
}

.pdm {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  width: 100%;
  max-width: 520px;
  max-height: 90dvh;
  overflow-y: auto;
  padding: 28px 24px 32px;
  box-shadow: 0 -8px 40px rgba(0,0,0,0.35);
}

@media (min-width: 640px) {
  .pdm {
    border-radius: var(--radius-card);
    max-height: 80dvh;
  }
}

.pdm__close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--color-text) 15%, transparent);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-default);
}

.pdm__close:hover {
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
}

.pdm__header {
  display: flex;
  gap: 18px;
  margin-bottom: 24px;
}

.pdm__photo-wrap {
  flex-shrink: 0;
}

.pdm__photo {
  width: 88px;
  height: 110px;
  object-fit: cover;
  object-position: top center;
  border-radius: var(--radius-card);
  background: color-mix(in srgb, var(--color-primary) 15%, var(--color-surface));
}

.pdm__photo-placeholder {
  width: 88px;
  height: 110px;
  border-radius: var(--radius-card);
  background: linear-gradient(160deg,
    color-mix(in srgb, var(--color-primary) 35%, var(--color-surface)),
    color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))
  );
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 800;
  color: var(--color-primary);
}

.pdm__header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.pdm__number {
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 0.03em;
}

.pdm__name {
  font-family: var(--font-heading);
  font-size: clamp(18px, 4vw, 24px);
  font-weight: 900;
  color: var(--color-text);
  margin: 0;
  line-height: 1.15;
}

.pdm__pos-age {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.pdm__badge {
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.pdm__team-row {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 4px;
}

.pdm__team-logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.pdm__team-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.pdm__group-badge {
  font-size: 10px;
  font-weight: 800;
  background: var(--color-primary);
  color: #fff;
  padding: 1px 7px;
  border-radius: 99px;
  font-family: var(--font-heading);
}

.pdm__club-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
}

.pdm__club-logo {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}

.pdm__club-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.pdm__club-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}

.pdm__club-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pdm__loading {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 13px;
  padding: 16px 0;
}

.pdm__section-title {
  font-family: var(--font-heading);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  margin: 20px 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pdm__season-badge {
  text-transform: none;
  letter-spacing: 0;
  font-size: 10px;
  font-family: var(--font-body);
  font-weight: 700;
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
  padding: 1px 6px;
  border-radius: 4px;
}

.pdm__stats-caption {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin: -4px 0 10px;
}

.pdm__grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.pdm__kv {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.pdm__kv strong {
  color: var(--color-text);
  font-weight: 600;
  font-size: 13px;
}

.pdm__grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.pdm__stat {
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
  border-radius: 8px;
  padding: 10px 8px;
  text-align: center;
}

.pdm__stat-val {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}

.pdm__stat-val--rating {
  color: #f59e0b;
}

.pdm__stat-lbl {
  font-size: 10px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pdm__no-stats {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 16px 0;
}
</style>
