<script setup>
import { computed } from 'vue'
import { useBrandStore } from '@/stores/brand'
import brandFooterLogo from '@brand/assets/logo-footer.svg'

const brandStore = useBrandStore()
const config = computed(() => brandStore.config)
const isF2 = computed(() => brandStore.activeBrand === 'football2')
</script>

<template>
  <footer class="app-footer" :class="{ 'app-footer--f2': isF2 }">
    <div class="app-footer__inner">
      <div class="app-footer__grid">
        <!-- Brand column -->
        <div class="app-footer__brand-col">
          <RouterLink to="/" class="app-footer__logo" aria-label="Homepage">
            <img
              :src="brandFooterLogo"
              :alt="config?.displayName || 'Football Portal'"
              class="app-footer__logo-img"
            />
          </RouterLink>
          <p class="app-footer__tagline">{{ config?.footer?.tagline }}</p>
          <div v-if="isF2" class="app-footer__color-dots" aria-hidden="true">
            <span style="background: var(--color-primary)"></span>
            <span style="background: var(--color-secondary)"></span>
            <span style="background: var(--color-red)"></span>
            <span style="background: var(--color-accent)"></span>
          </div>
        </div>

        <!-- Link columns -->
        <div
          v-for="col in (config?.footer?.columns || [])"
          :key="col.heading"
          class="app-footer__link-col"
        >
          <div class="app-footer__col-heading">{{ col.heading }}</div>
          <ul>
            <li v-for="link in col.links" :key="link">
              <a href="#" class="app-footer__link">{{ link }}</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="app-footer__bottom">
        <p class="app-footer__copyright">{{ config?.footer?.copyright }}</p>
        <div class="app-footer__legal-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Cookies</a>
          <span>EN ▾</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: color-mix(in srgb, var(--color-bg) 80%, #000);
  border-top: 1px solid var(--color-line);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 14px;
  margin-top: auto;
}

.app-footer--f2 {
  background: var(--color-text);
  color: rgba(255,255,255,0.65);
  border-top: none;
  border-radius: 40px 40px 0 0;
  margin-top: 40px;
}

.app-footer__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
  padding: 56px var(--content-padding) 32px;
}

.app-footer__grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr;
  gap: 48px;
}

.app-footer__logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  margin-bottom: 18px;
}

.app-footer__logo-img {
  display: block;
  height: 44px;
  width: auto;
}

.app-footer--f2 .app-footer__logo-img {
  height: 46px;
}

.app-footer__tagline {
  max-width: 260px;
  font-size: 13px;
  line-height: 1.6;
}

.app-footer--f2 .app-footer__tagline {
  max-width: 280px;
}

.app-footer__color-dots {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.app-footer__color-dots span {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: block;
  opacity: 0.9;
}

.app-footer__col-heading {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text);
  margin-bottom: 14px;
}

.app-footer--f2 .app-footer__col-heading {
  color: #fff;
  letter-spacing: 0.1em;
  font-size: 12px;
  margin-bottom: 16px;
}

ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-footer__link {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: var(--transition-default);
}

.app-footer--f2 .app-footer__link {
  color: rgba(255,255,255,0.65);
  font-size: 14px;
}

.app-footer__link:hover {
  color: var(--color-text);
}

.app-footer--f2 .app-footer__link:hover {
  color: #fff;
}

.app-footer__bottom {
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid var(--color-line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  flex-wrap: wrap;
}

.app-footer--f2 .app-footer__bottom {
  border-top: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5);
  margin-top: 56px;
  padding-top: 24px;
}

.app-footer__legal-links {
  display: flex;
  gap: 18px;
}

.app-footer__legal-links a,
.app-footer__legal-links span {
  cursor: pointer;
  transition: var(--transition-default);
}

.app-footer__legal-links a:hover {
  color: var(--color-text);
}

.app-footer--f2 .app-footer__legal-links a:hover {
  color: #fff;
}

@media (max-width: 1023px) {
  .app-footer__grid {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
  .app-footer__brand-col {
    grid-column: 1 / -1;
  }
}

@media (max-width: 767px) {
  .app-footer__grid {
    grid-template-columns: 1fr;
  }
  .app-footer__bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
