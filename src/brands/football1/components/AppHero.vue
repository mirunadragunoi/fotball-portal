<script setup>
import { computed } from 'vue'
import { useBrandStore } from '@/stores/brand'
import AppIcon from '@/components/shared/AppIcon.vue'
import BaseButton from '@/components/shared/BaseButton.vue'

const brandStore = useBrandStore()
const config = computed(() => brandStore.config)

const liveMatches = [
  { home: 'Vermillion FC',  away: 'Ironside United', h: 2, a: 1, min: "78'", stage: 'Group A' },
  { home: 'Northport',      away: 'Verdant Athletic', h: 0, a: 0, min: "32'", stage: 'Group B' },
  { home: 'Coastal SC',     away: 'Highland City',    h: 3, a: 2, min: 'FT',  stage: 'Group A' },
]
</script>

<template>
  <section class="f1-hero" aria-label="Hero banner">
    <!-- Background placeholder -->
    <div class="f1-hero__bg" aria-hidden="true">
      <img
        src="https://placehold.co/1920x720/0a1f12/1B5E20?text=Stadium+Night"
        alt=""
        class="f1-hero__bg-img"
        loading="eager"
      />
      <div class="f1-hero__bg-overlay"></div>
    </div>

    <div class="f1-hero__content">
      <!-- Left: headline + CTA -->
      <div class="f1-hero__left">
        <div class="f1-hero__eyebrow" aria-label="Tournament countdown">
          <span class="f1-hero__eyebrow-bar" aria-hidden="true"></span>
          {{ config?.hero?.eyebrow || "Tournament 2026 · 28 days to kickoff" }}
        </div>

        <h1 class="f1-hero__headline">
          Matchday<br />
          <span class="f1-hero__headline-accent">starts</span> here.
        </h1>

        <p class="f1-hero__body">
          {{ config?.hero?.body || "Play the world's best football mini-games, watch the goals that broke the internet, and live every fixture from kickoff to final whistle." }}
        </p>

        <div class="f1-hero__ctas">
          <RouterLink to="/games" class="f1-hero__cta-primary">
            <AppIcon name="play" :size="16" stroke="#1a1500" />
            Play now
          </RouterLink>
          <RouterLink to="/videos" class="f1-hero__cta-secondary">
            <AppIcon name="play-o" :size="16" />
            Watch highlights
          </RouterLink>
        </div>
      </div>

      <!-- Right: live scores widget -->
      <aside class="f1-hero__scores" aria-label="Live match scores">
        <div class="f1-hero__scores-header">
          <span class="f1-hero__live-dot" aria-hidden="true"></span>
          <span>Live now · Group stage</span>
        </div>

        <div
          v-for="(match, i) in liveMatches"
          :key="i"
          class="f1-hero__match"
          :class="{ 'f1-hero__match--bordered': i < liveMatches.length - 1 }"
        >
          <div class="f1-hero__match-home">{{ match.home }}</div>
          <div class="f1-hero__match-score">
            <span class="f1-hero__match-goals">{{ match.h }}</span>
            <span class="f1-hero__match-min" :class="{ 'f1-hero__match-min--ft': match.min === 'FT' }">
              {{ match.min }}
            </span>
            <span class="f1-hero__match-goals">{{ match.a }}</span>
          </div>
          <div class="f1-hero__match-away">{{ match.away }}</div>
        </div>

        <a href="/live" class="f1-hero__scores-link">
          See all fixtures
          <AppIcon name="chev-r" :size="12" />
        </a>
      </aside>
    </div>

    <!-- Breaking news ticker -->
    <div class="f1-hero__ticker" aria-label="Breaking news ticker">
      <span class="f1-hero__ticker-label">● BREAKING</span>
      <span class="f1-hero__ticker-item">Vermillion announces 25-man squad for the tournament</span>
      <span class="f1-hero__ticker-sep" aria-hidden="true">·</span>
      <span class="f1-hero__ticker-item">Northport hands debut to 17-year-old striker</span>
      <span class="f1-hero__ticker-sep" aria-hidden="true">·</span>
      <span class="f1-hero__ticker-item">Ticket allocation closes Friday 18:00</span>
    </div>
  </section>
</template>

<style scoped>
.f1-hero {
  position: relative;
  min-height: 720px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.f1-hero__bg {
  position: absolute;
  inset: 0;
}

.f1-hero__bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.f1-hero__bg-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(110deg, rgba(13,17,23,0.94) 0%, rgba(13,17,23,0.72) 40%, rgba(13,17,23,0.2) 70%, transparent 100%),
    linear-gradient(0deg, rgba(13,17,23,0.95), transparent 60%);
}

.f1-hero__content {
  position: relative;
  flex: 1;
  max-width: var(--max-content-width);
  margin-inline: auto;
  padding: 88px var(--content-padding) 80px;
  width: 100%;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 56px;
  align-items: end;
}

.f1-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.f1-hero__eyebrow-bar {
  display: inline-block;
  width: 24px;
  height: 1.5px;
  background: var(--color-accent);
}

.f1-hero__headline {
  margin: 20px 0 0;
  font-family: var(--font-heading);
  font-size: clamp(60px, 7vw, 96px);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--color-text);
}

.f1-hero__headline-accent {
  color: var(--color-accent);
}

.f1-hero__body {
  margin-top: 28px;
  max-width: 520px;
  font-size: 18px;
  line-height: 1.55;
  color: rgba(230, 237, 243, 0.78);
}

.f1-hero__ctas {
  margin-top: 36px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.f1-hero__cta-primary {
  height: 52px;
  padding: 0 26px;
  border-radius: 10px;
  border: none;
  background: var(--color-accent);
  color: #1a1500;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 28px color-mix(in srgb, var(--color-accent) 27%, transparent);
  transition: var(--transition-default);
  min-height: 44px;
}

.f1-hero__cta-primary:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.f1-hero__cta-secondary {
  height: 52px;
  padding: 0 22px;
  border-radius: 10px;
  background: rgba(230, 237, 243, 0.06);
  color: var(--color-text);
  border: 1px solid rgba(230, 237, 243, 0.16);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: var(--transition-default);
  min-height: 44px;
}

.f1-hero__cta-secondary:hover {
  background: rgba(230, 237, 243, 0.1);
}

/* Live scores widget */
.f1-hero__scores {
  background: rgba(22, 27, 34, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(230, 237, 243, 0.16);
  border-radius: 16px;
  padding: 24px;
}

.f1-hero__scores-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-red);
}

.f1-hero__live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-red);
  box-shadow: 0 0 8px var(--color-red);
  animation: pulse 1.5s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.f1-hero__match {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
}

.f1-hero__match--bordered {
  border-bottom: 1px solid var(--color-line);
}

.f1-hero__match-home {
  text-align: right;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.f1-hero__match-away {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.f1-hero__match-score {
  display: flex;
  align-items: center;
  gap: 12px;
}

.f1-hero__match-goals {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text);
}

.f1-hero__match-min {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-accent);
  min-width: 28px;
  text-align: center;
}

.f1-hero__match-min--ft {
  color: var(--color-text-secondary);
}

.f1-hero__scores-link {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-accent);
  text-decoration: none;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: var(--transition-default);
}

.f1-hero__scores-link:hover {
  gap: 10px;
}

/* Bottom ticker */
.f1-hero__ticker {
  position: relative;
  z-index: 1;
  height: 48px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--color-line);
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 var(--content-padding);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  overflow: hidden;
}

.f1-hero__ticker-label {
  color: var(--color-red);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  white-space: nowrap;
  flex-shrink: 0;
}

.f1-hero__ticker-item {
  color: var(--color-text);
  white-space: nowrap;
}

.f1-hero__ticker-sep {
  color: var(--color-line-strong);
}

@media (max-width: 1023px) {
  .f1-hero__content {
    grid-template-columns: 1fr;
    padding-top: 60px;
    padding-bottom: 60px;
    gap: 40px;
  }
  .f1-hero__scores {
    max-width: 480px;
  }
  .f1-hero__headline {
    font-size: clamp(48px, 8vw, 80px);
  }
}

@media (max-width: 767px) {
  .f1-hero {
    min-height: auto;
  }
  .f1-hero__content {
    padding-top: 48px;
    padding-bottom: 48px;
  }
  .f1-hero__body {
    font-size: 16px;
  }
  .f1-hero__ctas {
    flex-direction: column;
  }
  .f1-hero__cta-primary,
  .f1-hero__cta-secondary {
    width: 100%;
    justify-content: center;
  }
  .f1-hero__scores {
    display: none;
  }
  .f1-hero__ticker {
    display: none;
  }
}
</style>
