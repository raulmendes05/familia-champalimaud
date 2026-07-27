// Distintivos (emblemas) de cada linhagem de fundador.
// `icon: 'torre'` usa o SVG da Torre de Belém; senão usa o emoji.
// Fácil de mudar: troca emoji/label/color, ou pede para usar uma imagem.

export const FOUNDER_ORDER = ['ping', 'jajonhe', 'grizo', 'hugo']

export const FOUNDER_BADGES = {
  ping: { label: 'T-Rex Gregossauro', emoji: '🦖', color: '#3b82f6' }, // azul
  jajonhe: { label: 'Torre', emoji: '🗼', icon: 'torre', color: '#ef4444' }, // vermelho
  grizo: { label: 'Burlão', emoji: '🎩', color: '#8b5cf6' }, // roxo
  hugo: { label: 'Colher de Pau', emoji: '🥄', icon: 'colher', color: '#f97316' }, // laranja
}

export const isFounder = (id) => FOUNDER_ORDER.includes(id)

// Nome "carinhoso" de cada linhagem — usado, por ex., como etiqueta-raiz na
// árvore dos vivos quando o fundador já caiu na roleta.
export const LINEAGE_LABELS = {
  ping: 'Pinginhos',
  jajonhe: 'Jajonhinhos',
  grizo: 'Grizinhos',
  hugo: 'Huguinhos',
}
