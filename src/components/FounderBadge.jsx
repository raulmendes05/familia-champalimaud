import { FOUNDER_BADGES } from '../data/founders'

/** Glifo da Torre de Belém. viewBox 0 0 24 22. */
export function TorreGlyph({ color = '#fff' }) {
  const Turret = ({ x, top, h }) => (
    <g>
      <rect x={x} y={top} width="2" height={h} rx="0.4" />
      <path d={`M${x - 0.2} ${top} Q${x + 1} ${top - 2.4} ${x + 2.2} ${top} Z`} />
      <rect x={x + 0.7} y={top - 4.2} width="0.6" height="2.2" />
      <circle cx={x + 1} cy={top - 4.4} r="0.7" />
    </g>
  )
  return (
    <g fill={color}>
      <rect x="2.6" y="14.6" width="9.4" height="6.6" />
      {[2.6, 4.3, 6.0, 7.7, 9.4].map((x, i) => (
        <rect key={`bm${i}`} x={x} y="13" width="1.1" height="1.8" />
      ))}
      <rect x="11" y="7" width="8.6" height="14.2" />
      {[11, 12.7, 14.4, 16.1, 17.8].map((x, i) => (
        <rect key={`tm${i}`} x={x} y="5.4" width="1.1" height="1.8" />
      ))}
      <Turret x="14.2" top="12.4" h="3.2" />
      <Turret x="9.9" top="6.2" h="6" />
      <Turret x="18.5" top="6.2" h="6" />
      <Turret x="1.5" top="12.4" h="8.8" />
      <rect x="1" y="21.2" width="22" height="1.2" rx="0.4" />
    </g>
  )
}

/** Glifo de uma colher de pau. viewBox 0 0 24 24. */
export function SpoonGlyph({ color = '#fff' }) {
  return (
    <g fill="none" stroke={color}>
      {/* concha */}
      <ellipse cx="12" cy="7" rx="5.2" ry="6.2" strokeWidth="1.6" />
      {/* interior da concha (sugere madeira escavada) */}
      <ellipse cx="12" cy="7" rx="2.6" ry="3.4" strokeWidth="1.1" />
      {/* cabo */}
      <path d="M12 13.2 L12 22.4" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  )
}

const GLYPHS = {
  torre: { vb: '0 0 24 22', C: TorreGlyph },
  colher: { vb: '0 0 24 24', C: SpoonGlyph },
}

/** Devolve { vb, C } para um ícone com glifo próprio, ou null. */
export function glyphFor(icon) {
  return (icon && GLYPHS[icon]) || null
}

/**
 * Distintivo de uma linhagem de fundador.
 * Props: founderId, size, showLabel
 */
export default function FounderBadge({ founderId, size = 18, showLabel = false, className = '' }) {
  const b = FOUNDER_BADGES[founderId]
  if (!b) return null
  const glyph = glyphFor(b.icon)
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
        {glyph ? (
          <svg width={size} height={size} viewBox={glyph.vb} aria-hidden>
            <glyph.C color={b.color} />
          </svg>
        ) : (
          <span style={{ fontSize: size - 1, lineHeight: 1 }}>{b.emoji}</span>
        )}
      </span>
      {showLabel && <span className="text-sm font-medium">{b.label}</span>}
    </span>
  )
}
