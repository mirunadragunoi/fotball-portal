import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCurrentLocale } from '@/i18n/index.js'
import { fetchTriviaQuestions, TriviaApiError } from '@/services/triviaApi'

export const useTriviaStore = defineStore('trivia', () => {
  const status = ref('idle') // idle | loading | playing | finished
  const questions = ref([])
  const currentIndex = ref(0)
  const score = ref(0)
  const selectedIndex = ref(null)
  const answered = ref(false)
  const error = ref(null)
  const usedLanguageFallback = ref(false)

  const total = computed(() => questions.value.length)
  const current = computed(() => questions.value[currentIndex.value] || null)
  const progress = computed(() => {
    if (!total.value) return 0
    return Math.round((currentIndex.value / total.value) * 100)
  })
  const isLastQuestion = computed(() => currentIndex.value >= total.value - 1)

  function reset() {
    status.value = 'idle'
    questions.value = []
    currentIndex.value = 0
    score.value = 0
    selectedIndex.value = null
    answered.value = false
    error.value = null
    usedLanguageFallback.value = false
  }

  async function startQuiz() {
    error.value = null
    questions.value = []
    currentIndex.value = 0
    score.value = 0
    selectedIndex.value = null
    answered.value = false
    status.value = 'loading'
    try {
      const { questions: list, usedFallback } = await fetchTriviaQuestions(
        undefined,
        getCurrentLocale()
      )
      usedLanguageFallback.value = usedFallback
      if (!list.length) {
        error.value = 'empty'
        status.value = 'idle'
        return { ok: false }
      }
      questions.value = list
      currentIndex.value = 0
      status.value = 'playing'
      return { ok: true }
    } catch (err) {
      error.value = err instanceof TriviaApiError ? err.message : 'network'
      status.value = 'idle'
      return { ok: false }
    }
  }

  function selectAnswer(index) {
    if (answered.value || status.value !== 'playing') return
    selectedIndex.value = index
    answered.value = true
    const q = current.value
    if (q && index === q.correctIndex) score.value += 1
  }

  function nextQuestion() {
    if (!answered.value) return
    if (isLastQuestion.value) {
      status.value = 'finished'
      return
    }
    currentIndex.value += 1
    selectedIndex.value = null
    answered.value = false
  }

  return {
    status,
    questions,
    currentIndex,
    score,
    selectedIndex,
    answered,
    error,
    usedLanguageFallback,
    total,
    current,
    progress,
    isLastQuestion,
    reset,
    startQuiz,
    selectAnswer,
    nextQuestion,
  }
})
