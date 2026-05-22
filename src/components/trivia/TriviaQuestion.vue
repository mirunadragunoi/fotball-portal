<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/shared/BaseButton.vue'

const { t } = useI18n()

const props = defineProps({
  question: { type: Object, required: true },
  selectedIndex: { type: Number, default: null },
  answered: { type: Boolean, default: false },
  isLast: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'next'])

const difficultyLabel = computed(() => {
  const key = props.question.difficulty
  if (key && t(`trivia.difficulty.${key}`) !== `trivia.difficulty.${key}`) {
    return t(`trivia.difficulty.${key}`)
  }
  return key
})

function optionClass(index) {
  if (!props.answered) return ''
  if (index === props.question.correctIndex) return 'trivia-option--correct'
  if (index === props.selectedIndex) return 'trivia-option--wrong'
  return 'trivia-option--dim'
}

</script>

<template>
  <div class="trivia-question">
    <div class="trivia-question__badges">
      <span class="trivia-question__badge">{{ question.category }}</span>
      <span class="trivia-question__badge trivia-question__badge--muted">{{ difficultyLabel }}</span>
    </div>

    <h2 class="trivia-question__text" id="trivia-question-heading">{{ question.question }}</h2>

    <ul class="trivia-question__options" role="list">
      <li v-for="(answer, index) in question.answers" :key="index">
        <button
          type="button"
          class="trivia-option"
          :class="optionClass(index)"
          :disabled="answered"
          :aria-pressed="selectedIndex === index"
          @click="emit('select', index)"
        >
          <span class="trivia-option__letter" aria-hidden="true">{{ String.fromCharCode(65 + index) }}</span>
          <span class="trivia-option__text">{{ answer }}</span>
        </button>
      </li>
    </ul>

    <div v-if="answered" class="trivia-question__footer">
      <p
        class="trivia-question__feedback"
        :class="selectedIndex === question.correctIndex ? 'trivia-question__feedback--ok' : 'trivia-question__feedback--bad'"
        role="status"
      >
        <slot name="feedback" />
      </p>
      <BaseButton variant="primary" size="md" @click="emit('next')">
        <slot name="next-label" />
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
.trivia-question {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trivia-question__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.trivia-question__badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  color: var(--color-primary);
}

.trivia-question__badge--muted {
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
  color: var(--color-text-secondary);
}

.trivia-question__text {
  font-family: var(--font-heading);
  font-size: clamp(22px, 4vw, 32px);
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text);
  margin: 0;
}

.trivia-question__options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trivia-option {
  width: 100%;
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: var(--radius-card);
  border: 2px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;
}

.trivia-option:hover:not(:disabled) {
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.trivia-option:disabled {
  cursor: default;
}

.trivia-option__letter {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 13px;
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
}

.trivia-option--correct {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
}

.trivia-option--wrong {
  border-color: var(--color-red, #e53935);
  background: color-mix(in srgb, var(--color-red, #e53935) 10%, var(--color-surface));
}

.trivia-option--dim {
  opacity: 0.55;
}

.trivia-question__footer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding-top: 8px;
}

.trivia-question__feedback {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.trivia-question__feedback--ok {
  color: var(--color-primary);
}

.trivia-question__feedback--bad {
  color: var(--color-red, #e53935);
}
</style>
