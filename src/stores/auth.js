import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getBrandConfig } from '@/config/brand'
import { getPortalName } from '@/config/api'
import * as footballApi from '@/services/footballApi'
import { ApiError } from '@/services/footballApi'
import { isValidAccessCode, sanitizeAccessCodeInput } from '@/utils/accessCode'

function storageKey() {
  return `${getBrandConfig().storagePrefix || 'portal'}_access_code`
}

function readAccessCode() {
  try {
    return localStorage.getItem(storageKey()) || ''
  } catch {
    return ''
  }
}

function writeAccessCode(code) {
  try {
    if (code) localStorage.setItem(storageKey(), code)
    else localStorage.removeItem(storageKey())
  } catch {
    /* ignore */
  }
}

const SESSION_KEY_SUFFIX = '_session_meta'

function sessionMetaKey() {
  return `${getBrandConfig().storagePrefix || 'portal'}${SESSION_KEY_SUFFIX}`
}

function readSessionMeta() {
  try {
    const raw = localStorage.getItem(sessionMetaKey())
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSessionMeta(meta) {
  try {
    if (meta) localStorage.setItem(sessionMetaKey(), JSON.stringify(meta))
    else localStorage.removeItem(sessionMetaKey())
  } catch {
    /* ignore */
  }
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '')
}

export const useAuthStore = defineStore('auth', () => {
  const accessCode = ref('')
  const portal = ref(null)
  const country = ref(null)
  const hydrated = ref(false)

  const isAuthenticated = computed(() => Boolean(accessCode.value))
  const portalName = computed(() => getPortalName())

  function hydrate() {
    if (hydrated.value) return
    accessCode.value = readAccessCode()
    const meta = readSessionMeta()
    if (meta) {
      portal.value = meta.portal ?? null
      country.value = meta.country ?? null
    }
    hydrated.value = true
  }

  async function login(accessCodeInput) {
    const code = sanitizeAccessCodeInput(accessCodeInput)
    if (!isValidAccessCode(code)) {
      return { ok: false, error: 'invalidCode' }
    }

    const portalNameValue = getPortalName()
    if (!portalNameValue) {
      return { ok: false, error: 'config', message: 'VITE_PORTAL_NAME is not set' }
    }

    try {
      const data = await footballApi.login(code, portalNameValue)
      accessCode.value = code
      writeAccessCode(code)
      portal.value = data.portal ?? null
      country.value = data.country ?? null
      writeSessionMeta({ portal: portal.value, country: country.value })
      return { ok: true }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.errorCode === 4007) {
          return { ok: false, error: 'invalidCredentials' }
        }
        return { ok: false, error: 'network', message: err.message }
      }
      return { ok: false, error: 'network', message: err?.message }
    }
  }

  async function signup(phoneInput) {
    const phone = normalizePhone(phoneInput)
    if (phone.length < 8) {
      return { ok: false, error: 'invalidPhone' }
    }

    try {
      const data = await footballApi.signup(phone, getPortalName())
      const issued =
        data?.access_code ||
        data?.accessCode ||
        data?.code ||
        (data?.message && /[A-Za-z0-9]{4,}/.exec(data.message)?.[0])

      return {
        ok: true,
        accessCode: issued ? sanitizeAccessCodeInput(issued) : null,
        phone,
        message: data?.message,
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : ''
      if (message.toLowerCase().includes('exist') || message.toLowerCase().includes('registered')) {
        return { ok: false, error: 'phoneExists' }
      }
      return { ok: false, error: 'network', message }
    }
  }

  function logout() {
    accessCode.value = ''
    portal.value = null
    country.value = null
    writeAccessCode('')
    writeSessionMeta(null)
  }

  function getAuthQuery() {
    if (!accessCode.value) return null
    return {
      accessCode: accessCode.value,
      portalName: getPortalName(),
    }
  }

  return {
    accessCode,
    portal,
    country,
    portalName,
    hydrated,
    isAuthenticated,
    hydrate,
    login,
    signup,
    logout,
    getAuthQuery,
  }
})
