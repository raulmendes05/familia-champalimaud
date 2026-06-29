import { useMemo } from 'react'
import { useMembers } from '../hooks/useMembers'
import { ELIMINATIONS, ROULETTE_EXCLUDED, eliminationMap, dateOfDay } from '../data/roleta'

export default function RoletaPage() {
  const { members } = useMembers()
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])
  const elimMap = useMemo(() => eliminationMap(), [])

  const excluded = new Set(ROULETTE_EXCLUDED)
  const participants = members.filter((m) => !excluded.has(m.id))
  const survivors = participants
    .filter((m) => !elimMap.has(m.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  const dia = ELIMINATIONS.length

  // timeline: do mais recente para o mais antigo
  const timeline = ELIMINATIONS.map((id, i) => ({ day: i + 1, member: id ? byId.get(id) : null }))
    .reverse()

  return (
    <div className="mx-auto h-full w-full max-w-5xl overflow-y-auto p-6">
      <div className="mb-5">
        <h1 className="font-display text-3xl font-semibold text-champi-gold">🎰 Roleta Champi</h1>
        <p className="mt-1 text-sm text-champi-text-dim">
          Todos os dias alguém é “expulso” da família (tudo na brincadeira). Aqui ficam os
          sobreviventes e a cronologia das eliminações.{' '}
          <span className="text-champi-text-dim/40 italic">O m0guels tem isto tudo comprado!</span>
        </p>
      </div>

      {/* Estatísticas */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={dia} label="Dia atual" />
        <Stat value={survivors.length} label="Sobreviventes" tone="green" />
        <Stat value={participants.length - survivors.length} label="Eliminados" tone="red" />
        <Stat value={participants.length} label="Na roleta" />
      </div>

      {/* Sobreviventes */}
      <section className="mb-8">
        <h2 className="mb-3 border-b border-champi-line pb-2 font-display text-xl font-semibold text-champi-text">
          🟢 Ainda na família · {survivors.length}
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7">
          {survivors.map((m) => (
            <div key={m.id} className="flex flex-col items-center text-center">
              <Avatar member={m} />
              <p className="mt-1 w-full truncate text-xs font-medium text-champi-text">{m.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section>
        <h2 className="mb-3 border-b border-champi-line pb-2 font-display text-xl font-semibold text-champi-text">
          ⚰️ Eliminados · cronologia
        </h2>
        <ol className="relative ml-3 border-l-2 border-champi-line">
          {timeline.map(({ day, member }) => (
            <li key={day} className="mb-4 ml-5">
              <span className="absolute -left-[11px] mt-3 grid h-5 w-5 place-items-center rounded-full bg-champi-ink-3 text-[9px] font-bold text-champi-gold ring-2 ring-champi-line">
                {day}
              </span>
              <div className="card flex items-center gap-3 p-2.5">
                <Avatar member={member} dead />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold text-champi-text">
                    {member ? member.name : '??? (por confirmar)'}
                  </p>
                  {member?.nickname && (
                    <p className="truncate text-xs text-champi-text-dim">“{member.nickname}”</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-champi-gold">Dia {day}</p>
                  {dateOfDay(day) && (
                    <p className="text-[10px] text-champi-text-dim">
                      {dateOfDay(day).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function Avatar({ member, dead = false }) {
  const photo = member?.photo_url
  return (
    <div
      className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 ${
        dead ? 'border-champi-line opacity-70 grayscale' : 'border-champi-gold/60'
      } bg-champi-ink text-lg font-bold text-champi-gold`}
    >
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        (member?.name || '?').charAt(0)
      )}
    </div>
  )
}

function Stat({ value, label, tone }) {
  const color =
    tone === 'green' ? 'text-emerald-400' : tone === 'red' ? 'text-red-400' : 'text-champi-text'
  return (
    <div className="card p-3 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-champi-text-dim">{label}</p>
    </div>
  )
}
