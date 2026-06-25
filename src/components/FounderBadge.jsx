import { FOUNDER_BADGES } from '../data/founders'

// Glifo (silhueta) da Torre de Belém — bastião frontal + torre alta com ameias,
// torreões de cúpula nos cantos e a varanda manuelina. viewBox 0 0 24 22.
export function TorreGlyph({ color = '#fff' }) {
  const Turret = ({ x, top, h }) => (
    <g>
      {/* corpo cilíndrico */}
      <rect x={x} y={top} width="2" height={h} rx="0.4" />
      {/* cúpula */}
      <path d={`M${x - 0.2} ${top} Q${x + 1} ${top - 2.4} ${x + 2.2} ${top} Z`} />
      {/* pináculo */}
      <rect x={x + 0.7} y={top - 4.2} width="0.6" height="2.2" />
      <circle cx={x + 1} cy={top - 4.4} r="0.7" />
    </g>
  )
  return (
    <g fill={color}>
      {/* bastião frontal (baixo, esquerda) */}
      <rect x="2.6" y="14.6" width="9.4" height="6.6" />
      {[2.6, 4.3, 6.0, 7.7, 9.4].map((x, i) => (
        <rect key={`bm${i}`} x={x} y="13" width="1.1" height="1.8" />
      ))}
      {/* torre principal */}
      <rect x="11" y="7" width="8.6" height="14.2" />
      {[11, 12.7, 14.4, 16.1, 17.8].map((x, i) => (
        <rect key={`tm${i}`} x={x} y="5.4" width="1.1" height="1.8" />
      ))}
      {/* varanda manuelina (torreão na face frontal, a meio) */}
      <Turret x="14.2" top="12.4" h="3.2" />
      {/* torreões de canto da torre */}
      <Turret x="9.9" top="6.2" h="6" />
      <Turret x="18.5" top="6.2" h="6" />
      {/* torreão de canto do bastião (ponta arredondada) */}
      <Turret x="1.5" top="12.4" h="8.8" />
      {/* base / pontão */}
      <rect x="1" y="21.2" width="22" height="1.2" rx="0.4" />
    </g>
  )
}

/** SVG simples e estilizado da Torre de Belém (para HTML). */
function TorreBelem({ size = 18, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 22" aria-hidden>
      <TorreGlyph color={color} />
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
