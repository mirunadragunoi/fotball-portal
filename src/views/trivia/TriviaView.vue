<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import { useTriviaStore } from '@/stores/trivia'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import AppIcon from '@/components/shared/AppIcon.vue'
import TriviaProgress from '@/components/trivia/TriviaProgress.vue'
import TriviaQuestion from '@/components/trivia/TriviaQuestion.vue'
import TriviaResults from '@/components/trivia/TriviaResults.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'

const { t } = useI18n()
const brandStore = useBrandStore()
const store = useTriviaStore()

const isF2 = computed(() => brandStore.activeBrand === 'football2')

const highlightKeys = ['trivia.highlight1', 'trivia.highlight2', 'trivia.highlight3']

const resultMessage = computed(() => {
  const pct = store.total ? (store.score / store.total) * 100 : 0
  if (pct >= 90) return t('trivia.resultPerfect')
  if (pct >= 70) return t('trivia.resultGreat')
  if (pct >= 40) return t('trivia.resultGood')
  return t('trivia.resultTryAgain')
})

const errorMessage = computed(() => {
  if (!store.error) return ''
  if (store.error === 'empty') return t('trivia.errorEmpty')
  return typeof store.error === 'string' ? store.error : t('trivia.errorLoad')
})

const feedbackText = computed(() => {
  const q = store.current
  if (!q || !store.answered) return ''
  return store.selectedIndex === q.correctIndex
    ? t('trivia.correct')
    : t('trivia.incorrect', { answer: q.answers[q.correctIndex] })
})

async function onStart() {
  await store.startQuiz()
}

function onPlayAgain() {
  onStart()
}
</script>

<template>
  <div class="trivia-page" :class="{ 'trivia-page--f2': isF2 }">
    <div class="trivia-page__inner">
      <SectionHeader
        eyebrow="Quiz"
        :title="t('trivia.title')"
        :subtitle="t('trivia.subtitle')"
        id="trivia-heading"
      />

      <!-- Intro -->
      <section
        v-if="store.status === 'idle' || (store.status === 'loading' && !store.questions.length)"
        class="trivia-intro"
        aria-labelledby="trivia-heading"
      >
        <div class="trivia-intro__card">
          <div class="trivia-intro__icon" aria-hidden="true">
            <AppIcon name="trophy" :size="36" stroke="var(--color-accent)" />
          </div>
          <p class="trivia-intro__lead">{{ t('trivia.intro') }}</p>
          <ul class="trivia-intro__highlights">
            <li v-for="key in highlightKeys" :key="key">{{ t(key) }}</li>
          </ul>
          <p class="trivia-intro__challenge">{{ t('trivia.challenge') }}</p>
          <p v-if="errorMessage" class="trivia-intro__error" role="alert">{{ errorMessage }}</p>
          <BaseButton
            variant="primary"
            size="lg"
            :disabled="store.status === 'loading'"
            @click="onStart"
          >
            {{ store.status === 'loading' ? t('trivia.loading') : t('trivia.start') }}
          </BaseButton>
        </div>
      </section>

      <!-- Loading skeleton -->
      <div v-else-if="store.status === 'loading'" class="trivia-loading" aria-busy="true">
        <SkeletonCard v-for="n in 3" :key="n" />
      </div>

      <!-- Quiz -->
      <section
        v-else-if="store.status === 'playing' && store.current"
        class="trivia-quiz"
        aria-live="polite"
      >
        <p v-if="store.usedLanguageFallback" class="trivia-quiz__notice">
          {{ t('trivia.fallbackNotice') }}
        </p>
        <TriviaProgress
          :current="store.currentIndex + 1"
          :total="store.total"
          :score="store.score"
        />
        <TriviaQuestion
          :question="store.current"
          :selected-index="store.selectedIndex"
          :answered="store.answered"
          :is-last="store.isLastQuestion"
          @select="store.selectAnswer"
          @next="store.nextQuestion"
        >
          <template #feedback>{{ feedbackText }}</template>
          <template #next-label>
            {{ store.isLastQuestion ? t('trivia.seeResults') : t('trivia.next') }}
          </template>
        </TriviaQuestion>
      </section>

      <!-- Results -->
      <section v-else-if="store.status === 'finished'" class="trivia-done">
        <TriviaResults
          :score="store.score"
          :total="store.total"
          @play-again="onPlayAgain"
        >
          <template #title>{{ t('trivia.finishedTitle') }}</template>
          <template #score>{{ store.score }} / {{ store.total }}</template>
          <template #message>{{ resultMessage }}</template>
          <template #play-again>{{ t('trivia.playAgain') }}</template>
          <template #home>{{ t('trivia.backHome') }}</template>
        </TriviaResults>
      </section>

      <!-- Fallback -->
      <section v-else class="trivia-intro">
        <div class="trivia-intro__card">
          <p v-if="errorMessage" class="trivia-intro__error" role="alert">{{ errorMessage }}</p>
          <p v-else class="trivia-intro__lead">{{ t('trivia.errorLoad') }}</p>
          <BaseButton variant="primary" size="lg" @click="onStart">
            {{ t('trivia.start') }}
          </BaseButton>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.trivia-page {
  flex: 1;
  padding: 32px var(--content-padding) 64px;
}

.trivia-page__inner {
  max-width: 720px;
  margin-inline: auto;
}

.trivia-intro__card {
  margin-top: 28px;
  padding: 32px 28px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.trivia-page--f2 .trivia-intro__card {
  border-radius: 24px;
}

.trivia-intro__icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  display: grid;
  place-items: center;
}

.trivia-intro__lead {
  font-size: 17px;
  line-height: 1.5;
  color: var(--color-text);
  margin: 0;
  font-weight: 600;
}

.trivia-intro__highlights {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.trivia-intro__highlights li {
  position: relative;
  padding-left: 28px;
  font-size: 14px;
  line-height: 1.45;
  color: var(--color-text-secondary);
}

.trivia-intro__highlights li::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 7px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
}

.trivia-intro__challenge {
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);
  font-family: var(--font-heading);
  letter-spacing: 0.02em;
}

.trivia-intro__error {
  color: var(--color-red, #e53935);
  font-size: 14px;
  margin: 0;
}

.trivia-loading {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trivia-quiz {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.trivia-quiz__notice {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  padding: 10px 14px;
  border-radius: var(--radius-card);
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  border: 1px solid var(--color-line);
}

.trivia-done {
  margin-top: 16px;
}
</style>
