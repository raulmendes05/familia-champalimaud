// ╔══════════════════════════════════════════════════════════════╗
// ║  Roleta Champi — todos os dias alguém é "expulso" (brincadeira) ║
// ╚══════════════════════════════════════════════════════════════╝
// ELIMINATIONS: ordem = dia (índice 0 = Dia 1). Cada valor é o id do membro.
// (null = ainda por confirmar quem é.)

// Quem NÃO entra na roleta (entraram na família mais tarde).
export const ROULETTE_EXCLUDED = ['andre', 'bia_wood', 'leonor_catarino', 'guilherme']

// Data do Dia 1 (opcional) — para mostrar datas reais na timeline.
// Ex.: '2026-05-01'. Deixar null mostra só "Dia N".
export const ROULETTE_START = null

export const ELIMINATIONS = [
  'susi',          // Dia 1 — Susana
  'henrique',      // Dia 2 — Tio Rick (= Henrique)
  'maria_castro',  // Dia 3 — Maria Castro
  'mota',          // Dia 4 — Bernardo Mota
  'porto',         // Dia 5 — Tomás Porto
  'moguels',       // Dia 6 — Moguels
  'kika_rocha',    // Dia 7 — Kika Rocha
  'rodolfo',       // Dia 8 — Rodolfo
  'mike',          // Dia 9 — Mike
  'migueleo',      // Dia 10 — Migueleo
  'joana',         // Dia 11 — Joana Bombas
  'matilde_conde', // Dia 12 — Matilde Conde
  'laura',         // Dia 13 — Laura
  'bia_l',         // Dia 14 — Beatriz Landeiro
  'kika_moreira',  // Dia 15 — Francisca Moreira
  'marta',         // Dia 16 — Marta Fernandes
  'matilde_alves', // Dia 17 — Matilde Falhada
  'raul',          // Dia 18 — Raul Mendes
  'neves',         // Dia 19 — João Neves
  'rui_jorge',     // Dia 20 — Rui Jorge
  'andreia',       // Dia 21 — Andreia
  'timi',          // Dia 22 — Tiago Coelho
  'raquel',        // Dia 23 — Rachel
  'matilde_neves', // Dia 24 — Matilde Neves
  'sissi',         // Dia 25 — Sissi
  'matilde_roque', // Dia 26 — Matilde Roque
  'leonor_mendes', // Dia 27 — Leonor Mendes
  'sara',          // Dia 28 — Sara
  'tomas_h',       // Dia 29 — Grito
  'gomes',         // Dia 30 — Gomes
  'ines_costa',    // Dia 31 — Inês Costa
  'tomas_m',       // Dia 32 — Tomás Martins
  'luisa',         // Dia 33 — Maria Luísa
  'rita_c',        // Dia 34 — Rita Correia
  'maria_costa',   // Dia 35 — Maria Costa
  'mini_rita',     // Dia 36 — Ritinha (= mini_rita)
  'binga',         // Dia 37 — Binga
  'carmo',         // Dia 38 — Carmo
  'maravilha',     // Dia 39 — Maravilha
  'ze_cordeiro',   // Dia 40 — Zé Cordeiro
  'gabi',          // Dia 41 — Gabi
  'caco',          // Dia 42 — Tomás Caço
  'dinis',         // Dia 43 — Charlote
  'gui_s',         // Dia 44 — Guilherme Santos
  'cesar',         // Dia 45 — César Castro
  'ines_a',        // Dia 46 — Inês Alvelos
  'ana',           // Dia 47 — Ana Oliveira
  'tommy',         // Dia 48 — Tomé
  'maria_p',       // Dia 49 — Maria Pereira
  'munha',         // Dia 50 — Munhá
  'grizo',         // Dia 51 — Grizo (fundador)
  'sassa',         // Dia 52 — Sassa
  'maquina',       // Dia 53 — Miguel Sousa
  'carol',         // Dia 54 — Carol Sampaio
  'carvalheira',   // Dia 55 — Nuno Carvalheira
  'hugo',          // Dia 56 — Hugo (fundador)
  'ping',          // Dia 57 — Ping (fundador)
  'barriga',       // Dia 58 — Barriga
  'nanda',         // Dia 59 — Nanda
  'tiago_soares',  // Dia 60 — Tiago Soares
  'sofia_l',       // Dia 61 — Sofia Solista
  'eva',           // Dia 62 — Eva
  'jajonhe',       // Dia 63 — Jajonhe (fundador)
  'ximenes',       // Dia 64 — Ximenes
  'rui_g',         // Dia 65 — Rui Guedes
  'sofia_pascoa',  // Dia 66 — Sofia Páscoa
  'tildes',        // Dia 67 — Matilde Bernardino
  'joao_dias',     // Dia 68 — João Dias
  'rita_pais',     // Dia 69 — Rita Pais
  'morgana',       // Dia 70 — Morgana
  'joaozinho',     // Dia 71 — Joãozinho
  'pippo',         // Dia 72 — Pippo
  'martina',       // Dia 73 — Martina
  'ines_barbeiro', // Dia 74 — Inês Barbeiro
  'estrela',       // Dia 75 — Estrela
  'tita',          // Dia 76 — Tita (Matilde Matos)
  'piri',          // Dia 77 — Piri
  'catarina',      // Dia 78 — Catarina
  'clara',         // Dia 79 — Clara
  'gabriel',       // Dia 80 — Gabriel (Picha)
]

// Notas/comentários da roleta por dia (o que foi dito no sorteio de cada dia).
// Chave = número do dia.
export const ELIMINATION_NOTES = {
  2: 'ao balcão',
  9: 'palavras / latas',
  19: 'o fake',
  30: 'de chinelo',
  35: 'não ganhou',
  39: 'já não há balcão',
  40: 'de jato',
  59: 'a das fotos',
  75: 'quer cometa',
}

/** Map id → dia (1-based) dos eliminados. */
export function eliminationMap() {
  const m = new Map()
  ELIMINATIONS.forEach((id, i) => {
    if (id) m.set(id, i + 1)
  })
  return m
}

/** Data (Date) de um dia, se ROULETTE_START estiver definido. */
export function dateOfDay(day) {
  if (!ROULETTE_START) return null
  const d = new Date(ROULETTE_START + 'T00:00:00')
  d.setDate(d.getDate() + (day - 1))
  return d
}
