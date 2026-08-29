/**
 * External subscription landing URLs per brand × country.
 * When the user hits the "Sign up" CTA we send them to the carrier landing
 * page below instead of the internal /signup phone form. After subscribing
 * via SMS / mix flow they receive their access code and come back to log in.
 *
 * If no mapping exists for the active brand × country (e.g. UK on either
 * brand), the caller falls back to the internal /signup route.
 */
const SUBSCRIBE_LANDING_URLS = {
  football1: {                                              // Nation Foot
    SK: 'https://premium.nationfoot.com/sknatf/click/',     // sms
    PL: 'https://premium.nationfoot.com/plnatf/click/',     // sms
    CZ: 'https://premium.nationfoot.com/cznatf/',           // mix
  },
  football2: {                                              // Goal Plaza
    CZ: 'https://premium.goalplaza.com/czgoal/',            // mix
    RO: 'https://premium.goalplaza.com/rogoal/click/',      // sms
  },
}

export function getSubscribeLandingUrl(brandKey, countryKey) {
  return SUBSCRIBE_LANDING_URLS[brandKey]?.[countryKey] || null
}
