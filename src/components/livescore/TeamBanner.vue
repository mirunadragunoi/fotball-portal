<script setup>
defineProps({
  team: { type: Object, required: true },
})
</script>

<template>
  <div class="tb">
    <!-- venue background -->
    <div
      class="tb__bg"
      :style="team.venue?.image ? `background-image: url('${team.venue.image}')` : ''"
      aria-hidden="true"
    />
    <div class="tb__overlay" aria-hidden="true" />

    <div class="tb__content">
      <img
        v-if="team.logo"
        :src="team.logo"
        :alt="`${team.name} logo`"
        class="tb__logo"
        width="80"
        height="80"
      />
      <div v-else class="tb__logo-placeholder" aria-hidden="true">{{ team.code }}</div>

      <div class="tb__text">
        <h1 class="tb__name">{{ team.name }}</h1>
        <div class="tb__meta">
          <span class="tb__group-badge">Group {{ team.group }}</span>
          <template v-if="team.venue?.name">
            <span class="tb__sep" aria-hidden="true">·</span>
            <span class="tb__venue">
              {{ team.venue.name }}
              <template v-if="team.venue.city">, {{ team.venue.city }}</template>
              <template v-if="team.venue.capacity">
                ({{ team.venue.capacity.toLocaleString() }})
              </template>
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tb {
  position: relative;
  width: 100%;
  min-height: 180px;
  border-radius: var(--radius-card);
  overflow: hidden;
  margin-bottom: 32px;
}

.tb__bg {
  position: absolute;
  inset: 0;
  background-color: color-mix(in srgb, var(--color-primary) 30%, #000);
  background-size: cover;
  background-position: center;
}

.tb__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, #000 20%, transparent),
    color-mix(in srgb, #000 80%, transparent)
  );
}

.tb__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  gap: 20px;
  padding: 28px 24px 24px;
}

.tb__logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
  flex-shrink: 0;
}

.tb__logo-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 30%, #000);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
}

.tb__text {
  flex: 1;
  min-width: 0;
}

.tb__name {
  font-family: var(--font-heading);
  font-size: clamp(22px, 5vw, 36px);
  font-weight: 900;
  color: #fff;
  margin: 0 0 8px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.6);
  line-height: 1.1;
}

.tb__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: rgba(255,255,255,0.85);
}

.tb__group-badge {
  background: var(--color-primary);
  color: #fff;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 800;
  font-family: var(--font-heading);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.tb__sep {
  opacity: 0.5;
}

.tb__venue {
  font-size: 12px;
  opacity: 0.9;
}
</style>
