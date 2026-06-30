import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  isSupabaseConfigured,
  fetchEvents,
  createEvent,
  approveEvent,
  deleteEvent,
  fetchEventComments,
  addEventComment,
  fetchEventPhotos,
  uploadEventPhoto,
  addEventPhoto,
} from '../lib/supabase'

const NAME_KEY = 'champi_name'
const getSavedName = () => {
  try {
    return localStorage.getItem(NAME_KEY) || ''
  } catch {
    return ''
  }
}
const saveName = (n) => {
  try {
    localStorage.setItem(NAME_KEY, n)
  } catch {
    /* ignore */
  }
}

const fmtDate = (d) =>
  d
    ? new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null

export default function EventsPage() {
  const { email, isAdmin } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(null) // evento aberto (detalhe)
  const [creating, setCreating] = useState(false)

  const reload = () => {
    setLoading(true)
    fetchEvents()
      .then((data) => setEvents(data))
      .catch((e) => setError(e.message || String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }
    reload()
  }, [])

  if (!isSupabaseConfigured()) {
    return (
      <div className="grid h-full place-items-center p-6 text-center text-sm text-champi-text-dim">
        Os eventos precisam da base de dados (Supabase), que não está ligada neste ambiente.
      </div>
    )
  }

  if (open) {
    return <EventDetail event={open} isAdmin={isAdmin} onBack={() => setOpen(null)} onDeleted={() => { setOpen(null); reload() }} />
  }

  return (
    <div className="mx-auto h-full w-full max-w-3xl overflow-y-auto p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-champi-gold">📅 Eventos Champi</h1>
          <p className="mt-1 text-sm text-champi-text-dim">
            Jantares, convívios e tudo o que a família faz. Comenta e põe fotos — qualquer pessoa pode.
          </p>
        </div>
        {email ? (
          <button onClick={() => setCreating((v) => !v)} className="btn-gold shrink-0">
            {creating ? 'Fechar' : '＋ Novo evento'}
          </button>
        ) : (
          <Link to="/login" className="btn-ghost shrink-0">
            Entra para criar
          </Link>
        )}
      </div>

      {creating && email && (
        <CreateForm
          email={email}
          onCreated={() => {
            setCreating(false)
            reload()
          }}
        />
      )}

      {loading ? (
        <p className="mt-10 text-center text-sm text-champi-text-dim">A carregar eventos…</p>
      ) : error ? (
        <p className="mt-10 text-center text-sm text-red-400">Erro: {error}</p>
      ) : events.length === 0 ? (
        <p className="mt-10 text-center text-sm text-champi-text-dim">
          Ainda não há eventos. {email ? 'Cria o primeiro!' : 'Entra para criar o primeiro!'}
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((ev) => (
            <li key={ev.id}>
              <button
                onClick={() => setOpen(ev)}
                className="card flex w-full items-center justify-between gap-3 p-4 text-left transition hover:border-champi-gold/60"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-lg font-semibold text-champi-text">
                      {ev.title}
                    </p>
                    {ev.status === 'pending' && (
                      <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                        pendente
                      </span>
                    )}
                  </div>
                  {fmtDate(ev.event_date) && (
                    <p className="text-xs text-champi-gold">{fmtDate(ev.event_date)}</p>
                  )}
                  {ev.location && <p className="text-xs text-champi-text-dim">📍 {ev.location}</p>}
                  {ev.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-champi-text-dim">{ev.description}</p>
                  )}
                </div>
                <span className="shrink-0 text-champi-text-dim">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isAdmin && (
        <p className="mt-6 text-center text-xs text-champi-text-dim">
          És admin: vês também os eventos pendentes e podes aprová-los/apagá-los ao abri-los.
        </p>
      )}
    </div>
  )
}

function CreateForm({ email, onCreated }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    setErr(null)
    try {
      await createEvent({
        title: title.trim(),
        event_date: date || null,
        location: location.trim() || null,
        description: description.trim() || null,
        created_by_email: email,
      })
      onCreated()
    } catch (e2) {
      setErr(e2.message || String(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card mb-5 space-y-3 p-4">
      <p className="text-xs text-champi-text-dim">
        O evento fica <b>pendente</b> até o admin aprovar.
      </p>
      <Input value={title} onChange={setTitle} placeholder="Nome do evento *" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-champi-line bg-champi-ink-3/70 px-3 py-2 text-sm text-champi-text focus:border-champi-gold/60 focus:outline-none"
        />
        <Input value={location} onChange={setLocation} placeholder="Local" />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição (opcional)"
        rows={3}
        className="w-full rounded-lg border border-champi-line bg-champi-ink-3/70 px-3 py-2 text-sm text-champi-text focus:border-champi-gold/60 focus:outline-none"
      />
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button disabled={busy || !title.trim()} className="btn-gold disabled:opacity-50">
        {busy ? 'A enviar…' : 'Submeter evento'}
      </button>
    </form>
  )
}

function EventDetail({ event, isAdmin, onBack, onDeleted }) {
  const [comments, setComments] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = () => {
    setLoading(true)
    Promise.all([fetchEventComments(event.id), fetchEventPhotos(event.id)])
      .then(([c, p]) => {
        setComments(c)
        setPhotos(p)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id])

  const handleApprove = async () => {
    await approveEvent(event.id)
    onBack()
  }
  const handleDelete = async () => {
    if (!confirm('Apagar este evento e todos os comentários/fotos?')) return
    await deleteEvent(event.id)
    onDeleted()
  }

  return (
    <div className="mx-auto h-full w-full max-w-3xl overflow-y-auto p-6">
      <button onClick={onBack} className="mb-4 text-sm text-champi-text-dim hover:text-champi-gold">
        ‹ Voltar aos eventos
      </button>

      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-semibold text-champi-gold">{event.title}</h1>
          {event.status === 'pending' && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              pendente
            </span>
          )}
        </div>
        {fmtDate(event.event_date) && <p className="text-sm text-champi-gold">{fmtDate(event.event_date)}</p>}
        {event.location && <p className="text-sm text-champi-text-dim">📍 {event.location}</p>}
        {event.description && <p className="mt-2 text-sm text-champi-text">{event.description}</p>}

        {isAdmin && (
          <div className="mt-3 flex gap-2">
            {event.status === 'pending' && (
              <button onClick={handleApprove} className="btn-gold">
                ✓ Aprovar
              </button>
            )}
            <button onClick={handleDelete} className="btn-ghost text-red-300 hover:border-red-500/60">
              Apagar
            </button>
          </div>
        )}
      </div>

      {/* Fotos */}
      <section className="mb-8">
        <h2 className="mb-3 border-b border-champi-line pb-2 font-display text-xl font-semibold text-champi-text">
          📸 Fotos · {photos.length}
        </h2>
        <PhotoUpload eventId={event.id} onAdded={reload} />
        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <figure key={p.id} className="card overflow-hidden">
                <a href={p.url} target="_blank" rel="noreferrer">
                  <img src={p.url} alt={p.caption || ''} className="aspect-square w-full object-cover" />
                </a>
                {(p.caption || p.author_name) && (
                  <figcaption className="p-2 text-xs text-champi-text-dim">
                    {p.caption && <span className="text-champi-text">{p.caption} </span>}
                    {p.author_name && <span>· {p.author_name}</span>}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </section>

      {/* Comentários */}
      <section>
        <h2 className="mb-3 border-b border-champi-line pb-2 font-display text-xl font-semibold text-champi-text">
          💬 Comentários · {comments.length}
        </h2>
        <CommentForm eventId={event.id} onAdded={reload} />
        {loading ? (
          <p className="mt-4 text-sm text-champi-text-dim">A carregar…</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg bg-champi-ink-3/60 p-3 text-sm">
                <p className="text-champi-text">{c.text}</p>
                <p className="mt-1 text-xs text-champi-text-dim">
                  — {c.author_name} ·{' '}
                  {new Date(c.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                </p>
              </li>
            ))}
            {comments.length === 0 && (
              <li className="text-sm text-champi-text-dim">Sê o primeiro a comentar.</li>
            )}
          </ul>
        )}
      </section>
    </div>
  )
}

function CommentForm({ eventId, onAdded }) {
  const [name, setName] = useState(getSavedName())
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !text.trim()) return
    setBusy(true)
    setErr(null)
    try {
      saveName(name.trim())
      await addEventComment(eventId, name.trim(), text.trim())
      setText('')
      onAdded()
    } catch (e2) {
      setErr(e2.message || String(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr]">
        <Input value={name} onChange={setName} placeholder="O teu nome *" />
        <Input value={text} onChange={setText} placeholder="Escreve um comentário…" />
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button disabled={busy || !name.trim() || !text.trim()} className="btn-gold disabled:opacity-50">
        {busy ? 'A enviar…' : 'Comentar'}
      </button>
    </form>
  )
}

function PhotoUpload({ eventId, onAdded }) {
  const [name, setName] = useState(getSavedName())
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return
    setBusy(true)
    setErr(null)
    try {
      if (name.trim()) saveName(name.trim())
      const url = await uploadEventPhoto(eventId, file)
      await addEventPhoto(eventId, name.trim() || null, url, caption.trim() || null)
      setFile(null)
      setCaption('')
      onAdded()
    } catch (e2) {
      setErr(e2.message || String(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr]">
        <Input value={name} onChange={setName} placeholder="O teu nome" />
        <Input value={caption} onChange={setCaption} placeholder="Legenda (opcional)" />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-champi-text-dim file:mr-3 file:rounded-lg file:border-0 file:bg-champi-ink-3 file:px-3 file:py-2 file:text-sm file:text-champi-text hover:file:bg-champi-line/60"
        />
        <button disabled={busy || !file} className="btn-gold shrink-0 disabled:opacity-50">
          {busy ? 'A enviar…' : 'Pôr foto'}
        </button>
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
    </form>
  )
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-champi-line bg-champi-ink-3/70 px-3 py-2 text-sm text-champi-text placeholder:text-champi-text-dim/60 focus:border-champi-gold/60 focus:outline-none"
    />
  )
}
