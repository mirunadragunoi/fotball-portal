import { getApiBaseUrl } from '@/config/api'
import {
  TRIVIA_CATEGORY_SPORTS,
  TRIVIA_DEFAULT_AMOUNT,
  localeToOpenTdbLang,
} from '@/config/trivia'
import { getCurrentLocale } from '@/i18n/index.js'
import { decodeHtml } from '@/utils/decodeHtml'

export class TriviaApiError extends Error {
  constructor(message, code = 0) {
    super(message)
    this.name = 'TriviaApiError'
    this.code = code
  }
}

function shuffle(array) {
  const list = [...array]
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

function buildOpenTdbUrl(amount, category, lang) {
  const params = new URLSearchParams({
    amount: String(amount),
    category: String(category),
    lang: String(lang),
  })
  const customUrl = import.meta.env.VITE_OPENTDB_URL
  const useProxy = import.meta.env.DEV && !customUrl
  if (useProxy) return `/opentdb/api.php?${params}`
  const base = (customUrl || 'https://opentdb.com/api.php').replace(/\?.*$/, '')
  return `${base}?${params}`
}

function mapOpenTdbQuestion(raw, index) {
  const correct = decodeHtml(raw.correct_answer)
  const incorrect = (raw.incorrect_answers || []).map(decodeHtml)
  const answers = shuffle([...incorrect, correct])
  let correctIndex = answers.indexOf(correct)
  if (correctIndex < 0) correctIndex = answers.length - 1

  return {
    id: `q-${index}-${raw.question?.slice(0, 12) || index}`,
    type: raw.type,
    difficulty: raw.difficulty,
    category: decodeHtml(raw.category),
    question: decodeHtml(raw.question),
    answers,
    correctIndex,
  }
}

async function requestOpenTdb(amount, lang) {
  const url = buildOpenTdbUrl(amount, TRIVIA_CATEGORY_SPORTS, lang)
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new TriviaApiError(`Trivia request failed (${res.status})`)

  const data = await res.json()
  return data
}

async function fetchFromOpenTdbLang(amount, lang) {
  const data = await requestOpenTdb(amount, lang)
  if (data.response_code !== 0) {
    const messages = {
      1: 'No results — try again.',
      2: 'Invalid parameters.',
      3: 'Session not found.',
      4: 'Token empty.',
      5: 'Rate limit — wait a moment.',
    }
    throw new TriviaApiError(messages[data.response_code] || 'Could not load trivia.', data.response_code)
  }
  return (data.results || []).map(mapOpenTdbQuestion)
}

/** Try portal language first; fall back to English if Sports pool is too small. */
async function fetchFromOpenTdb(amount = TRIVIA_DEFAULT_AMOUNT, portalLocale) {
  const primary = localeToOpenTdbLang(portalLocale)
  try {
    const questions = await fetchFromOpenTdbLang(amount, primary)
    return { questions, contentLang: primary, usedFallback: false }
  } catch (err) {
    if (primary !== 'en' && err instanceof TriviaApiError && (err.code === 1 || err.code === 2)) {
      const questions = await fetchFromOpenTdbLang(amount, 'en')
      return { questions, contentLang: 'en', usedFallback: true }
    }
    throw err
  }
}

/** Optional backend proxy: GET /football/trivia?amount=10&lang=ro */
async function fetchFromBackend(amount = TRIVIA_DEFAULT_AMOUNT, portalLocale) {
  const base = getApiBaseUrl()
  if (!base) return null

  const url = new URL(`${base}/football/trivia`)
  url.searchParams.set('amount', String(amount))
  url.searchParams.set('category', String(TRIVIA_CATEGORY_SPORTS))
  url.searchParams.set('language', portalLocale || getCurrentLocale())

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) return null

  const payload = await res.json()
  const list = payload?.data ?? payload?.results ?? payload?.questions
  if (!Array.isArray(list)) return null

  const questions = list.map((item, index) => {
    if (item.answers && item.correctIndex != null) return { ...item, id: item.id || `q-${index}` }
    return mapOpenTdbQuestion(item, index)
  })

  return {
    questions,
    contentLang: payload?.content_lang || payload?.language || portalLocale,
    usedFallback: Boolean(payload?.used_fallback),
  }
}

/**
 * @returns {{ questions: object[], contentLang: string, usedFallback: boolean }}
 */
export async function fetchTriviaQuestions(
  amount = TRIVIA_DEFAULT_AMOUNT,
  portalLocale = getCurrentLocale()
) {
  const preferBackend = import.meta.env.VITE_TRIVIA_VIA_BACKEND === 'true'
  if (preferBackend) {
    const fromBackend = await fetchFromBackend(amount, portalLocale)
    if (fromBackend?.questions?.length) return fromBackend
  }
  return fetchFromOpenTdb(amount, portalLocale)
}
