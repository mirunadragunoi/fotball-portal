import { createI18n } from 'vue-i18n'

// Base locales — neutral, no brand references
import baseEn from '@/i18n/locales/en.json'
import baseRo from '@/i18n/locales/ro.json'
import baseCz from '@/i18n/locales/cz.json'
import baseSk from '@/i18n/locales/sk.json'
import basePl from '@/i18n/locales/pl.json'

// Brand overrides — only keys that differ from base
import f1En from '@/brands/football1/i18n/locales/en.json'
import f1Ro from '@/brands/football1/i18n/locales/ro.json'
import f1Cz from '@/brands/football1/i18n/locales/cz.json'
import f1Sk from '@/brands/football1/i18n/locales/sk.json'
import f1Pl from '@/brands/football1/i18n/locales/pl.json'

import f2En from '@/brands/football2/i18n/locales/en.json'
import f2Ro from '@/brands/football2/i18n/locales/ro.json'
import f2Cz from '@/brands/football2/i18n/locales/cz.json'
import f2Sk from '@/brands/football2/i18n/locales/sk.json'
import f2Pl from '@/brands/football2/i18n/locales/pl.json'

import { getBrandConfig, getBrandKey, getCountry, getCountryKey } from '@/config/brand'
import { getCookie, setCookie } from '@/utils/cookies'

/** Recursively merge override into base. Override keys win; nested objects are merged. */
function mergeMessages(base, override) {
  const out = { ...base }
  for (const [k, v] of Object.entries(override || {})) {
    const baseVal = out[k]
    if (
      baseVal && typeof baseVal === 'object' && !Array.isArray(baseVal) &&
      typeof v === 'object' && !Array.isArray(v)
    ) {
      out[k] = mergeMessages(baseVal, v)
    } else {
      out[k] = v
    }
  }
  return out
}

const BRAND_LOCALES = {
  football1: { en: f1En, ro: f1Ro, cz: f1Cz, sk: f1Sk, pl: f1Pl },
  football2: { en: f2En, ro: f2Ro, cz: f2Cz, sk: f2Sk, pl: f2Pl },
}

const BASE_LOCALES = {
  en: baseEn,
  ro: baseRo,
  cz: baseCz,
  sk: baseSk,
  pl: basePl,
}

const brand      = getBrandConfig()
const brandKey   = getBrandKey()
const country    = getCountry()
const countryKey = getCountryKey()
const brandOverrides = BRAND_LOCALES[brandKey] || {}

function buildMessages() {
  const out = {}
  for (const [lang, base] of Object.entries(BASE_LOCALES)) {
    out[lang] = mergeMessages(base, brandOverrides[lang] || {})
  }
  return out
}

// Cookie name: "{storagePrefix}-locale-{country}" — unique per brand + country
const cookieName = `${brand.storagePrefix}-locale-${countryKey}`

function readSavedLocale() {
  if (typeof document === 'undefined') return country?.defaultLanguage || 'en'
  const saved = getCookie(cookieName)
  if (saved && country?.languages?.includes(saved)) return saved
  return country?.defaultLanguage || 'en'
}

const initialLocale = readSavedLocale()

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: buildMessages(),
  globalInjection: true,
})

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('lang', initialLocale)
}

export function setLocale(locale) {
  if (!country?.languages?.includes(locale)) return
  i18n.global.locale.value = locale
  setCookie(cookieName, locale)
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', locale)
  }
}

export function getCurrentLocale() {
  return i18n.global.locale.value
}

export const LOCALE_LABELS = {
  en: 'English',
  ro: 'Română',
  cz: 'Čeština',
  sk: 'Slovenčina',
  pl: 'Polski',
}

export const availableLocales = (country?.languages || ['en']).map(code => ({
  code,
  label: LOCALE_LABELS[code] || code.toUpperCase(),
}))
