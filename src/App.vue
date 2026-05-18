<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getBrandKey } from '@/config/brand'
import { useBrandStore } from '@/stores/brand'
import { useAuthStore } from '@/stores/auth'
import { prefetchCatalog } from '@/composables/useCatalog'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const route = useRoute()
const brandStore = useBrandStore()
const authStore = useAuthStore()

const isAuthPage = computed(() => Boolean(route.meta?.authPage))

onMounted(() => {
  brandStore.loadBrand(getBrandKey())
  authStore.hydrate()
  if (authStore.isAuthenticated) {
    prefetchCatalog().catch(() => {})
  }
})
</script>

<template>
  <div id="app-root">
    <AppHeader v-if="!isAuthPage" />
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="$route.path" />
      </Transition>
    </RouterView>
    <AppFooter v-if="!isAuthPage" />
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

#app-root {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}
</style>
