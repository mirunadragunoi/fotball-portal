import { getApiBaseUrl, getPortalName } from '@/config/api'
import { getCountry } from '@/config/brand'

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

function unwrapData(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data
  }
  return payload
}

async function request(path, { method = 'GET', query, body } = {}) {
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

export async function fetchFavorites({ accessCode, portalName, language } = {}) {
  const data = await request('/football/favorites', {
    query: {
      ...authParams(accessCode, portalName),
      language: language || getLanguage(),
    },
  })
  const list = unwrapData(data)
  return Array.isArray(list) ? list : []
}

export async function toggleFavorite(productId, { accessCode, portalName } = {}) {
  return request(`/football/favorites/${productId}`, {
    method: 'POST',
    body: authParams(accessCode, portalName),
  })
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
