// Dados da Família Champalimaud — transcritos da árvore genealógica real (PDF).
// Espelham o esquema do Supabase (tabelas `members`, `relationships`, `memories`).
//
// NOTA: `name` = nome/apelido de curso; `nickname` = alcunha de praxe (entre aspas no PDF).
// Curso/faculdade/ano ficam por preencher — podem ser editados depois (via Supabase).
//
// ⚠️ As LIGAÇÕES (quem é padrinho/madrinha de quem) são a minha melhor leitura da
// árvore. Algumas podem precisar de correção — vê a lista PARENT_CHILDREN no fim.

export const FACULDADES = {
  FCT: 'Faculdade de Ciências e Tecnologia',
  FD: 'Faculdade de Direito',
  FE: 'Faculdade de Economia',
  FM: 'Faculdade de Medicina',
}

// Membros: { id, name, nickname, generation }  (+ campos vazios prontos para editar)
const M = [
  // ── Geração 0 — fundadores / topo da árvore ──────────────────
  ['ping', 'Ping', 'T-Rex Gregossauro', 0],
  ['jajonhe', 'Jajonhe', 'Tropas', 0],
  ['grizo', 'Grizo', 'Burlão', 0],
  ['hugo', 'Hugo', 'Donald', 0],
  ['vasco', 'Vasco', 'Isqueiro', 0],
  ['leonor_mendes', 'Leonor Mendes', 'Caloirra Frrancesa', 0],
  ['rui_jorge', 'Rui Jorge', 'Dora', 0],
  ['cesar', 'César', 'Inem', 0],
  ['rodolfo', 'Rodolfo', 'Comilão', 0],

  // ── Ramo PING ────────────────────────────────────────────────
  ['carvalheira', 'Carvalheira', 'Mãe Estou Solteiro', 1],
  ['gomes', 'Gomes', 'O Incrível Hulkoiro', 1],
  ['ze_cordeiro', 'Zé Cordeiro', 'Zé Curriqueiro Follow The Leader', 1],
  ['gabriel', 'Gabriel', 'Picha', 2],
  ['joao_dias', 'João Dias', 'Rocha Mole', 2],
  ['vartels', 'Vartels', 'Tintim', 2],
  ['vaz', 'Vaz', 'Sou-Bi-Ónico', 3],
  ['matilde_neves', 'Matilde Neves', 'Apóstolo 12 e Meio', 3],
  ['maria_castro', 'Maria Castro', '', 3],
  ['raul', 'Raul', 'Maré', 4],
  ['joaozinho', 'Joãozinho', 'Joãozinho Joãozinho Joãozinho', 4],
  ['porto', 'Porto', 'Sou um Piço', 4],
  ['catarina', 'Catarina', 'Kirk Kat', 5],
  ['estrela', 'Estrela', 'O Máiore', 5],

  // ── Ramo JAJONHE ─────────────────────────────────────────────
  ['piri', 'Piri', '', 1],
  ['bras', 'Brás', 'Morcelas', 1],
  ['pedro', 'Pedro', 'Edro', 1],
  ['clara', 'Clara', 'Pardalita', 1],
  ['moguels', 'Moguels', 'Vaquinha', 2],
  ['caco', 'Caço', 'Setaque', 2],
  ['ines_costa', 'Inês Costa', 'Fábio Coentrão', 3],
  ['sofia_pascoa', 'Sofia Páscoa', '', 3],
  ['ines_barbeiro', 'Inês Barbeiro', '', 3],
  ['matilde_conde', 'Matilde Conde', 'Macaquinha das Badtrips', 4],
  ['tiago_soares', 'Tiago Soares', '', 4],
  ['migueleo', 'Migueleo', 'Miguélio 50 Pontos', 5],
  ['laura', 'Laura', 'Petite Girly Pop', 5],
  ['tildes', 'Tildes', 'Inspetora Mini', 5],
  ['bia_l', 'Bia L.', '', 5],
  ['marta', 'Marta', '', 5],
  ['pippo', 'Pippo', 'Triângulo Otis', 5],
  ['eva', 'Eva', 'Eva Gina Flor', 6],
  ['matilde_roque', 'Matilde Roque', '', 6],
  ['ana', 'Ana', '', 6],
  ['kika_moreira', 'Kika Moreira', '', 6],
  ['martina', 'Martina', 'Martini', 6],
  ['leti', 'Leti', 'Lanches', 6],
  ['nanda', 'Nanda', 'A Careca dum Calvo que Parece o Rabo dum Macaco', 7],
  ['matilde_alves', 'Matilde Alves', 'Karpa Flávia: A Falhada', 6],
  ['kika_rocha', 'Kika Rocha', '', 6],
  ['luisa', 'Luísa', 'Monstrinho do Álcool', 6],
  ['mini_rita', 'Mini Rita', 'Kréu', 6],

  // ── Ramo VASCO ───────────────────────────────────────────────
  ['tommy', 'Tommy / Tomé', 'Eminem da Praxe', 1],
  ['gui_s', 'Gui S.', 'Guilidades o Caloiro Amor da Minha Vida', 1],

  // ── Ramo LEONOR MENDES ───────────────────────────────────────
  ['binga', 'Binga', 'Chambingo', 1],
  ['rita_c', 'Rita C.', 'Frigorífico', 1],
  ['ines_a', 'Inês A.', 'Jonick', 1],
  ['raquel', 'Raquel', 'Minar-te-ei', 2],
  ['tita', 'Tita', '', 2],
  ['sofia_l', 'Sofia L.', 'Sofia Solista', 2],
  ['rita_pais', 'Rita Pais', 'Padeira de Campolide de Gelatina Quedas Torera', 2],
  ['barriga', 'Barriga', "Belly's", 2],
  ['rui_g', 'Rui G.', 'Machupão Alfa', 3],
  ['carol', 'Carol', 'Letxícia', 4],
  ['joana', 'Joana', 'Bombas', 4],
  ['dinis', 'Dinis', 'Charlotte', 4],
  ['guilherme', 'Guilherme', 'Caloiro do Coito', 5],
  ['leonor_catarino', 'Leonor Catarino', 'Octavia', 5],

  // ── Ramo RODOLFO ─────────────────────────────────────────────
  ['mike', 'Mike', 'GPS', 1],
  ['sassa', 'Sassa', 'MC Completo', 1],
  ['mota', 'Mota', 'Angélico', 1],
  ['neves', 'Neves', 'Caloiro 123', 2],
  ['maquina', 'Máquina', 'Máquina do Álcool', 2],

  // ── Ramo GRIZO ───────────────────────────────────────────────
  ['munha', 'Munhá', 'Varão', 1],
  ['henrique', 'Henrique', 'Phenrique', 1],
  ['maria_p', 'Maria P.', 'Delay', 2],
  ['maravilha', 'Maravilha', 'Pirata Rabolho', 2],
  ['tomas_h', 'Tomás H.', 'Grito', 2],
  ['susi', 'Susi', "Fiambre d'Atum", 2],
  ['tomas_m', 'Tomás M.', 'Caloirinho D.T.T.', 2],
  ['gabi', 'Gabi', 'Camões', 3],
  ['sara', 'Sara', 'Ladrona Ultras Autotuna', 3],
  ['morgana', 'Morgana', 'Unísono', 3],

  // ── Ramo HUGO ────────────────────────────────────────────────
  ['andreia', 'Andreia', 'Kréu', 1],
  ['maria', 'Maria', '', 1],
  ['ximenes', 'Ximenes', 'Palma Bigots X-Men Calvo', 1],
  ['sissi', 'Sissi', '', 2],
  ['carmo', 'Carmo', 'Ca...Clara', 2],
  ['timi', 'Timi', 'Perna de Pau Médio Mal Passado', 3],
]

export const members = M.map(([id, name, nickname, generation]) => ({
  id,
  name,
  nickname,
  generation,
  photo_url: '',
  course: '',
  faculty: '',
  year_joined: null,
  email: '',
  bio: '',
  quote: '',
}))

// Membros femininos (melhor estimativa pelos nomes) — define madrinha vs padrinho.
const FEMALE = new Set([
  'leonor_mendes', 'matilde_neves', 'maria_castro', 'catarina', 'estrela', 'clara',
  'ines_costa', 'sofia_pascoa', 'ines_barbeiro', 'matilde_conde', 'laura', 'tildes',
  'bia_l', 'marta', 'eva', 'matilde_roque', 'ana', 'kika_moreira', 'martina', 'leti',
  'nanda', 'matilde_alves', 'kika_rocha', 'luisa', 'mini_rita', 'rita_c', 'ines_a',
  'raquel', 'tita', 'sofia_l', 'rita_pais', 'carol', 'joana', 'leonor_catarino',
  'maria_p', 'susi', 'gabi', 'sara', 'morgana', 'andreia', 'maria', 'sissi', 'carmo',
])

// Linhagens: padrinho/madrinha → afilhados. Editar aqui para corrigir a árvore.
const PARENT_CHILDREN = [
  // PING
  ['ping', ['carvalheira', 'gomes', 'ze_cordeiro']],
  ['gomes', ['gabriel', 'joao_dias']],
  ['ze_cordeiro', ['vartels']],
  ['joao_dias', ['vaz', 'matilde_neves', 'maria_castro']],
  ['vaz', ['raul', 'joaozinho']],
  ['matilde_neves', ['porto']],
  ['porto', ['catarina', 'estrela']],
  // JAJONHE
  ['jajonhe', ['piri', 'bras', 'pedro', 'clara']],
  ['piri', ['moguels', 'caco']],
  ['moguels', ['ines_costa']],
  ['caco', ['sofia_pascoa', 'ines_barbeiro']],
  ['ines_costa', ['matilde_conde', 'tiago_soares']],
  ['matilde_conde', ['migueleo', 'laura', 'tildes']],
  ['tiago_soares', ['bia_l', 'marta', 'pippo']],
  ['migueleo', ['eva', 'matilde_roque', 'ana']],
  ['laura', ['kika_moreira', 'martina']],
  ['tildes', ['leti']],
  ['leti', ['nanda']],
  ['bia_l', ['matilde_alves']],
  ['marta', ['kika_rocha', 'luisa']],
  ['pippo', ['mini_rita']],
  // VASCO
  ['vasco', ['tommy', 'gui_s']],
  // LEONOR MENDES
  ['leonor_mendes', ['binga', 'rita_c', 'ines_a']],
  ['binga', ['raquel']],
  ['rita_c', ['tita', 'sofia_l']],
  ['ines_a', ['rita_pais', 'barriga']],
  ['barriga', ['rui_g']],
  ['rui_g', ['carol', 'joana', 'dinis']],
  ['dinis', ['guilherme', 'leonor_catarino']],
  // RODOLFO
  ['rodolfo', ['mike', 'sassa', 'mota']],
  ['sassa', ['neves']],
  ['mota', ['maquina']],
  // GRIZO
  ['grizo', ['munha', 'henrique']],
  ['munha', ['maria_p']],
  ['henrique', ['maravilha', 'tomas_h', 'susi', 'tomas_m']],
  ['tomas_h', ['gabi']],
  ['tomas_m', ['sara', 'morgana']],
  // HUGO
  ['hugo', ['andreia', 'maria', 'ximenes']],
  ['maria', ['sissi']],
  ['ximenes', ['carmo']],
  ['carmo', ['timi']],
]

export const relationships = PARENT_CHILDREN.flatMap(([parent, children]) =>
  children.map((child, i) => ({
    id: `r-${parent}-${child}`,
    parent_id: parent,
    child_id: child,
    type: FEMALE.has(parent) ? 'madrinha' : 'padrinho',
  }))
)

// Sem memórias reais por agora — a preencher pelos membros depois do login.
export const memories = []
