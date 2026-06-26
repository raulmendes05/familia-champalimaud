// Fotos dos membros guardadas no browser (localStorage). As imagens são
// reduzidas a ~256px antes de guardar, para caberem várias sem estourar o
// limite. (Mais tarde isto pode passar para o Supabase Storage.)
import { useSyncExternalStore } from 'react'

const KEY = 'champi_photos'
const subs = new Set()

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

let cache = read()

function commit(next) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch (e) {
    console.warn('Não foi possível guardar a foto (localStorage cheio?)', e)
  }
  subs.forEach((fn) => fn())
}

export function getPhoto(id) {
  return cache[id] || null
}

export function setPhoto(id, dataUrl) {
  commit({ ...cache, [id]: dataUrl })
}

export function removePhoto(id) {
  const next = { ...cache }
  delete next[id]
  commit(next)
}

function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

/** Hook React: devolve o mapa { id: dataUrl } e re-renderiza quando muda. */
export function usePhotos() {
  return useSyncExternalStore(subscribe, () => cache, () => cache)
}

// Posteriza (5 níveis) + satura — "cozinha" o efeito cartoon na própria imagem.
const LEVELS = [0, 69, 135, 199, 255]
function bakeCartoon(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h)
  const a = img.data
  for (let i = 0; i < a.length; i += 4) {
    const r = a[i], g = a[i + 1], b = a[i + 2]
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    const R = Math.max(0, Math.min(255, gray + (r - gray) * 1.4))
    const G = Math.max(0, Math.min(255, gray + (g - gray) * 1.4))
    const B = Math.max(0, Math.min(255, gray + (b - gray) * 1.4))
    a[i] = LEVELS[Math.min(4, (R * 5) >> 8)]
    a[i + 1] = LEVELS[Math.min(4, (G * 5) >> 8)]
    a[i + 2] = LEVELS[Math.min(4, (B * 5) >> 8)]
  }
  ctx.putImageData(img, 0, 0)
}

/** Lê uma imagem, reduz (~384px) e devolve um data-URL JÁ em estilo cartoon. */
export function fileToScaledDataURL(file, max = 384, quality = 0.86) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * s))
      const h = Math.max(1, Math.round(img.height * s))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      bakeCartoon(ctx, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}
