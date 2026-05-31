<script setup>
import { ref, computed, watch } from 'vue'
import { useWorldCupTeamsStore } from '@/stores/worldcupTeams'

const props = defineProps({
  player: { type: Object, default: null }, // basic player object from squad
  team:   { type: Object, default: null },
})
const emit = defineEmits(['close'])

const store = useWorldCupTeamsStore()

const detail     = ref(null)
const detailFull = computed(() => detail.value?.player || null)
const stats      = computed(() => detail.value?.statistics?.[0] || null)

watch(
  () => props.player?.id,
  async (id) => {
    detail.value = null
    if (!id) return
    const cached = store.playerDetails[id]
    if (cached) { detail.value = cached; return }
    detail.value = await store.loadPlayerDetails(id)
  },
  { immediate: true },
)

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
              <span class="pdm__badge">{{ player.position }}</span>
              <template v-if="detailFull?.age || player.age">
                <span>{{ detailFull?.age || player.age }} yrs</span>
              </template>
            </div>

            <template v-if="team">
              <div class="pdm__team-row">
                <img v-if="team.logo" :src="team.logo" :alt="team.name" class="pdm__team-logo" />
                <span class="pdm__team-name">{{ team.name }}</span>
                <span class="pdm__group-badge" v-if="team.group">Group {{ team.group }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- personal details (from lazy-loaded detail) -->
        <div v-if="store.playerDetailLoading && !detail" class="pdm__loading">Loading details…</div>

        <template v-if="detailFull">
          <div class="pdm__section-title">Personal</div>
          <div class="pdm__grid-2">
            <div class="pdm__kv"><span>Born</span><strong>{{ fmtDate(detailFull.birth?.date) }}</strong></div>
            <div class="pdm__kv"><span>Nationality</span><strong>{{ detailFull.nationality || '—' }}</strong></div>
            <div class="pdm__kv" v-if="detailFull.height"><span>Height</span><strong>{{ detailFull.height }}</strong></div>
            <div class="pdm__kv" v-if="detailFull.weight"><span>Weight</span><strong>{{ detailFull.weight }}</strong></div>
          </div>
        </template>

        <!-- club stats -->
        <template v-if="stats">
          <div class="pdm__section-title">
            {{ stats.league?.name || 'Club stats' }}
            <span class="pdm__club-name">· {{ stats.team?.name }}</span>
          </div>
          <div class="pdm__grid-3">
            <div class="pdm__stat"><div class="pdm__stat-val">{{ stats.games?.appearences ?? '—' }}</div><div class="pdm__stat-lbl">Apps</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ stats.goals?.total ?? '—' }}</div><div class="pdm__stat-lbl">Goals</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ stats.goals?.assists ?? '—' }}</div><div class="pdm__stat-lbl">Assists</div></div>
            <div class="pdm__stat" v-if="stats.passes?.accuracy"><div class="pdm__stat-val">{{ stats.passes.accuracy }}%</div><div class="pdm__stat-lbl">Pass acc.</div></div>
            <div class="pdm__stat"><div class="pdm__stat-val">{{ stats.cards?.yellow ?? 0 }}🟨 {{ stats.cards?.red ?? 0 }}🟥</div><div class="pdm__stat-lbl">Cards</div></div>
            <div class="pdm__stat" v-if="stats.shots?.on != null"><div class="pdm__stat-val">{{ stats.shots.on }}/{{ stats.shots.total }}</div><div class="pdm__stat-lbl">Shots on</div></div>
          </div>
        </template>

        <div v-else-if="!store.playerDetailLoading" class="pdm__no-stats">
          Detailed stats not available yet.
        </div>
      </div>
    </div>
  </Teleport>
</template>

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
}

.pdm__club-name {
  text-transform: none;
  letter-spacing: 0;
  font-size: 12px;
  font-family: var(--font-body);
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