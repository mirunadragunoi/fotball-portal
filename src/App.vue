<script setup>
import { onMounted } from 'vue'
import { useBrandStore } from '@/stores/brand'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const brandStore = useBrandStore()

onMounted(async () => {
  const brand = typeof __DEFAULT_BRAND__ !== 'undefined' ? __DEFAULT_BRAND__ : 'football1'
  await brandStore.loadBrand(brand)
})
</script>

<template>
  <div id="app-root">
    <AppHeader />
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="$route.path" />
      </Transition>
    </RouterView>
    <AppFooter />
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
