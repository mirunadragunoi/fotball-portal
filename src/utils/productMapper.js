import { PRODUCT_TYPES, platformFromProductType } from '@/config/api'

const GAME_COLORS = ['#1B5E20', '#FF6F00', '#2979FF', '#00C853', '#7C4DFF', '#E53935']
const VIDEO_TONES = ['dark', 'pitch', 'warm', 'cool']

function pickColor(id) {
  const n = Number(id) || 0
  return GAME_COLORS[n % GAME_COLORS.length]
}

function slugFromProduct(product) {
  if (product.code) return String(product.code)
  if (product.slug) return String(product.slug)
  const title = product.title || product.name || ''
  if (title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
  return String(product.id)
}

function thumbnailUrl(product) {
  return (
    product.icon_large ||
    product.banner_medium ||
    product.banner_small ||
    product.icon_small ||
    product.banner_large ||
    product.thumbnail ||
    ''
  )
}

function platformsFromProduct(product) {
  const platform = platformFromProductType(product.type)
  return platform ? [platform] : ['html5']
}

function formatCount(value) {
  if (value === undefined || value === null) return '0'
  if (typeof value === 'string') return value
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function mapProductToGame(product) {
  const id = String(product.id)
  const productType = Number(product.type)
  const platform = platformsFromProduct(product)
  return {
    id,
    slug: slugFromProduct(product),
    productType,
    title: product.title || 'Game',
    description: product.description_long || product.description_short || '',
    descriptionShort: product.description_short || '',
    instructions: product.instructions || '',
    thumbnail: thumbnailUrl(product),
    bannerLarge: product.banner_large || '',
    platform,
    playUrl: product.url || '',
    videoPresentation: product.video_presentation || '',
    featured: false,
    category: productType === PRODUCT_TYPES.android ? 'Android' : 'HTML5',
    color: pickColor(id),
    rating: Number(product.rating_points ?? 0) || 0,
    ratingCount: Number(product.rating_count ?? 0) || 0,
    plays: formatCount(product.rating_count ?? 0),
    duration: '',
    releaseDate: '',
    raw: product,
  }
}

export function mapProductToVideo(product) {
  const id = String(product.id)
  const idx = Number(id) || 0
  return {
    id,
    slug: slugFromProduct(product),
    productType: Number(product.type) || PRODUCT_TYPES.video,
    title: product.title || 'Video',
    description: product.description_long || product.description_short || '',
    descriptionShort: product.description_short || '',
    thumbnail: thumbnailUrl(product),
    videoUrl: product.video_presentation || product.url || '',
    embedCode: '',
    duration: '',
    category: 'Video',
    featured: false,
    views: formatCount(product.rating_count ?? 0),
    publishedAt: '',
    tone: VIDEO_TONES[idx % VIDEO_TONES.length],
    raw: product,
  }
}
