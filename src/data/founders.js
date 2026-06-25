// Distintivos (emblemas) de cada linhagem de fundador.
// `icon: 'torre'` usa o SVG da Torre de Belém; senão usa o emoji.
// Fácil de mudar: troca emoji/label/color, ou pede para usar uma imagem.

export const FOUNDER_ORDER = ['ping', 'jajonhe', 'grizo', 'hugo']

export const FOUNDER_BADGES = {
  ping: { label: 'T-Rex Gregossauro', emoji: '🦖', color: '#d4af37' },
  jajonhe: { label: 'Torre de Belém', emoji: '🗼', icon: 'torre', color: '#7c4dff' },
  grizo: { label: 'Burlão', emoji: '🎩', color: '#e8c969' },
  hugo: { label: 'Donald', emoji: '🦆', color: '#5aa9e6' },
}

export const isFounder = (id) => FOUNDER_ORDER.includes(id)
