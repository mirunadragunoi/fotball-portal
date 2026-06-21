import { getApiBaseUrl, getPortalName } from '@/config/api'
import { getCountry, getCountryKey } from '@/config/brand'

export class ApiError extends Error {
  constructor(message, data = null, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.data = data
    this.status = status
    this.errorCode = data?.error_code ?? null
  }
}

let onUnauthorized = null

/** Register handler for 401 responses (logout + redirect to login). */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

function buildUrl(path, query = {}) {
  const base = getApiBaseUrl()
  const url = new URL(`${base}${path}`)
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
}

async function parseResponse(res) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export function unwrapData(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data
  }
  return payload
}

export async function request(path, { method = 'GET', query, body } = {}) {
  const res = await fetch(buildUrl(path, query), {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await parseResponse(res)

  if (res.status === 401) {
    onUnauthorized?.()
    const message = data?.error || data?.message || 'Unauthorized'
    throw new ApiError(message, data, 401)
  }

  if (!res.ok) {
    const message =
      data?.error ||
      data?.message ||
      data?.detail ||
      (typeof data === 'string' ? data : `Request failed (${res.status})`)
    throw new ApiError(message, data, res.status)
  }

  return data
}

export function getLanguage() {
  return getCountry()?.defaultLanguage || 'en'
}

/** Auth query/body params required by most football endpoints. */
export function authParams(accessCode, portalName = getPortalName()) {
  return {
    access_code: accessCode,
    portal_name: portalName,
  }
}

export async function login(accessCode, portalName = getPortalName()) {
  const data = await request('/football/auth/login', {
    method: 'POST',
    body: {
      access_code: accessCode,
      portal_name: portalName,
    },
  })
  return unwrapData(data) ?? data
}

export async function signup(phone, portalName = getPortalName()) {
  const data = await request('/football/auth/signup', {
    method: 'POST',
    body: {
      phone,
      portal_name: portalName,
    },
  })
  return unwrapData(data) ?? data
}

export async function fetchProducts({ accessCode, portalName, language, productType } = {}) {
  const query = {
    ...authParams(accessCode, portalName),
    language: language || getLanguage(),
  }
  if (productType !== undefined && productType !== null) {
    query.product_type = productType
  }
  const data = await request('/football/products', { query })
  const list = unwrapData(data)
  return Array.isArray(list) ? list : []
}

export async function fetchProductById(id, { accessCode, portalName, language } = {}) {
  const data = await request(`/football/products/${id}`, {
    query: {
      ...authParams(accessCode, portalName),
      language: language || getLanguage(),
    },
  })
  return unwrapData(data)
}

export async function fetchAbout({ accessCode, portalName, language } = {}) {
  const data = await request('/football/about', {
    query: {
      ...authParams(accessCode, portalName),
      language: language || getLanguage(),
    },
  })
  return unwrapData(data)
}

// ─── Legal / about endpoints (public) ────────────────────────────────────────
// Public endpoints — no access_code. Backend identifies the content to serve
// from portal_name + country + language only.

function legalContext(language) {
  return {
    portal_name: getPortalName(),
    country:     getCountryKey(),
    language:    language || getLanguage(),
  }
}

// Backend wraps legal responses as { treatment, error_code, error_description, <key>: ... }.
// Some endpoints (like /about on Goalplaza) additionally wrap in { data: {...} } — unwrapData
// + the per-endpoint key access below normalises both cases to a usable shape.

export async function getAbout({ language } = {}) {
  // Backend returns the About payload flat: { content, label, language }.
  // No need to unwrap a `data` envelope here (per FRONTEND_NEWS_API.md 2026-06-08).
  const data = await request('/football/about', { query: legalContext(language) })
  return data?.content ?? null
}

/** Returns the contact info as a single text/HTML string (joined from the backend's ordered list). */
export async function getLegalContact({ language } = {}) {
  const data = await request('/football/legals/contact', { query: legalContext(language) })
  const items = unwrapData(data)?.contact
  if (!Array.isArray(items) || !items.length) return null
  return [...items]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((i) => i.content || '')
    .filter(Boolean)
    .join('\n\n')
}

/** Returns an array of FAQ items ({ order, question, answer }) ready for the view. */
export async function getLegalFaq({ language } = {}) {
  const data = await request('/football/legals/faq', { query: legalContext(language) })
  const items = unwrapData(data)?.faq
  return Array.isArray(items) ? items : []
}

export async function getLegalTerms({ language } = {}) {
  const data = await request('/football/legals/terms', { query: legalContext(language) })
  return unwrapData(data)?.content ?? null
}

export async function getLegalPrivacy({ language } = {}) {
  const data = await request('/football/legals/privacy', { query: legalContext(language) })
  return unwrapData(data)?.content ?? null
}

export async function getLegalCookies({ language } = {}) {
  const data = await request('/football/legals/cookies_policy', { query: legalContext(language) })
  return unwrapData(data)?.content ?? null
}

/**
 * Per-portal/country intro text shown above the unsubscribe form.
 * Returns null on any backend failure so the form still renders.
 */
export async function getLegalUnsubscribe({ language } = {}) {
  try {
    const data = await request('/football/legals/unsubscribe', { query: legalContext(language) })
    return unwrapData(data)?.content ?? null
  } catch {
    return null
  }
}

export async function unsubscribePhoneNumber({ country, language, phoneNumber, recaptchaToken } = {}) {
  const data = await request('/football/UnsubscribePhoneNumber', {
    method: 'POST',
    body: {
      portal_name:    getPortalName(),
      country:        country || getCountryKey(),
      language,
      phone_number:   phoneNumber,
      recaptcha_token: recaptchaToken,
    },
  })
  return unwrapData(data)
}
