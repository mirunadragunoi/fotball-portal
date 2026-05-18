<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 18 },
  stroke: { type: String, default: 'currentColor' },
  strokeWidth: { type: Number, default: 1.75 },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="stroke"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    style="display: block; flex: 0 0 auto"
  >
    <path v-if="name === 'menu'" d="M3 6h18M3 12h18M3 18h18"/>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="7"/>
      <path d="m20 20-3.5-3.5"/>
    </template>
    <path v-else-if="name === 'play'" d="M7 5l12 7-12 7V5z" :fill="stroke"/>
    <path v-else-if="name === 'play-o'" d="M8 5.5l11 6.5-11 6.5V5.5z"/>
    <path v-else-if="name === 'filter'" d="M4 5h16M7 12h10M10 19h4"/>
    <template v-else-if="name === 'ball'">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 3l3 3-1 4-4 0-1-4 3-3zM3.5 10l3 1.5 0 4-3 1.5M20.5 10l-3 1.5 0 4 3 1.5M9 21l1-4 4 0 1 4"/>
    </template>
    <path v-else-if="name === 'chev-r'" d="m9 6 6 6-6 6"/>
    <path v-else-if="name === 'chev-d'" d="m6 9 6 6 6-6"/>
    <path v-else-if="name === 'chev-l'" d="m15 6-6 6 6 6"/>
    <path v-else-if="name === 'fire'" d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s.5 2 2 2c0-3 2-5 2-8z"/>
    <path v-else-if="name === 'bolt'" d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" :fill="stroke"/>
    <template v-else-if="name === 'trophy'">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/>
      <path d="M4 4h4v3a3 3 0 0 1-3-3M20 4h-4v3a3 3 0 0 0 3-3M10 14h4v3h-4zM8 20h8"/>
    </template>
    <template v-else-if="name === 'share'">
      <circle cx="6" cy="12" r="2.5"/>
      <circle cx="18" cy="6" r="2.5"/>
      <circle cx="18" cy="18" r="2.5"/>
      <path d="m8 11 8-4M8 13l8 4"/>
    </template>
    <path v-else-if="name === 'heart'" d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </template>
    <template v-else-if="name === 'user'">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>
    </template>
    <template v-else-if="name === 'android'">
      <path d="M5 11v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/>
      <path d="M5 11a7 7 0 0 1 14 0M8 8.5l-1-2M16 8.5l1-2"/>
      <path d="M3 13v3M21 13v3M9 18v2M15 18v2"/>
    </template>
    <template v-else-if="name === 'html'">
      <path d="M4 3l1.5 17L12 22l6.5-2L20 3H4z"/>
      <path d="M8 8h8l-.5 4H9l.5 4 2.5.5L14 16"/>
    </template>
    <template v-else-if="name === 'live'">
      <circle cx="12" cy="12" r="3" :fill="stroke"/>
      <path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10M4 4a11 11 0 0 0 0 16M20 4a11 11 0 0 1 0 16"/>
    </template>
    <template v-else-if="name === 'calendar'">
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M3 9h18M8 3v4M16 3v4"/>
    </template>
    <path v-else-if="name === 'star'" d="m12 3 2.6 6 6.4.5-4.8 4.2 1.5 6.3L12 16.8 6.3 20l1.5-6.3L3 9.5 9.4 9 12 3z"/>
    <path v-else-if="name === 'x'" d="M6 6l12 12M18 6 6 18"/>
    <template v-else-if="name === 'volume'">
      <path d="M4 9v6h4l5 4V5L8 9H4z"/>
      <path d="M16 8a5 5 0 0 1 0 8"/>
    </template>
    <path v-else-if="name === 'fs'" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>
    <path v-else-if="name === 'arrow-left'" d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
</template>
