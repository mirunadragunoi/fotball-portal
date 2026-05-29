<script setup>
import GroupCard from './GroupCard.vue'

defineProps({
  groups:        { type: Array,  required: true },
  competitionId: { type: [Number, String], required: true },
  liveMatches:   { type: Array,  default: () => [] },
})
</script>

<template>
  <div class="group-grid">
    <GroupCard
      v-for="g in groups"
      :key="g.id || g.name"
      :group-name="g.name || g.short_name || '?'"
      :group-id="g.id"
      :competition-id="competitionId"
      :live-match-ids="liveMatches.filter(m => m.competition?.group_id == g.id).map(m => m.id)"
    />
  </div>
</template>

<style scoped>
.group-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
</style>
