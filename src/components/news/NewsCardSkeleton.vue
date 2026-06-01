<template>
  <div class="ncs" aria-hidden="true">
    <div class="ncs__img"></div>
    <div class="ncs__body">
      <div class="ncs__line ncs__line--title"></div>
      <div class="ncs__line ncs__line--title ncs__line--short"></div>
      <div class="ncs__line ncs__line--desc"></div>
      <div class="ncs__line ncs__line--meta"></div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.ncs {
  display: flex;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-line);
  animation: pulse 1.6s ease-in-out infinite;
}

.ncs__img {
  flex-shrink: 0;
  width: 100px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
}

.ncs__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ncs__line {
  height: 12px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
}

.ncs__line--title  { height: 14px; width: 90%; }
.ncs__line--short  { width: 65%; }
.ncs__line--desc   { width: 80%; margin-top: 2px; }
.ncs__line--meta   { width: 40%; margin-top: auto; }
</style>
