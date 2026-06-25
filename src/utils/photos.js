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

/** Lê um ficheiro de imagem e devolve um data-URL reduzido (JPEG ~256px). */
export function fileToScaledDataURL(file, max = 256, quality = 0.82) {
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
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
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
