import { FOUNDER_BADGES } from '../data/founders'

/** SVG simples e estilizado da Torre de Belém. */
function TorreBelem({ size = 18, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <g stroke={color} strokeWidth="1.3" strokeLinejoin="round" fill="none">
        {/* baluarte / base */}
        <path d="M3 21h18M5 21v-6h14v6" />
        {/* torre principal */}
        <path d="M9 15V7h6v8" />
        {/* ameias no topo da torre */}
        <path d="M9 7V5h1.3v1.3h1.4V5H13v1.3h1.4V5H15v2" />
        {/* torreão pequeno */}
        <path d="M10.5 15v-2.4h3V15" />
        {/* janela */}
        <path d="M11.4 11.2h1.2" />
      </g>
    </svg>
  )
}

/**
 * Distintivo de uma linhagem de fundador.
 * Props: founderId, size, showLabel
 */
export default function FounderBadge({ founderId, size = 18, showLabel = false, className = '' }) {
  const b = FOUNDER_BADGES[founderId]
  if (!b) return null
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={`Linhagem ${b.label}`}
      style={{ color: b.color }}
    >
      <span
        className="grid place-items-center rounded-full"
        style={{
          width: size + 10,
          height: size + 10,
          background: `${b.color}22`,
          border: `1px solid ${b.color}66`,
        }}
      >
        {b.icon === 'torre' ? (
          <TorreBelem size={size} color={b.color} />
        ) : (
          <span style={{ fontSize: size - 1, lineHeight: 1 }}>{b.emoji}</span>
        )}
      </span>
      {showLabel && <span className="text-sm font-medium">{b.label}</span>}
    </span>
  )
}
