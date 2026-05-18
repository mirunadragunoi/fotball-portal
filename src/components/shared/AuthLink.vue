<script setup>
import { useAuth } from '@/composables/useAuth'

const props = defineProps({
  to: {
    type: String,
    required: true,
  },
  /** When true, route is always allowed (e.g. home). */
  public: {
    type: Boolean,
    default: false,
  },
})

const { authStore, ensureHydrated, goToLogin } = useAuth()

function onClick(event) {
  if (props.public) return
  ensureHydrated()
  if (authStore.isAuthenticated) return
  event.preventDefault()
  goToLogin(props.to)
}
</script>

<template>
  <RouterLink :to="to" @click="onClick">
    <slot />
  </RouterLink>
</template>
