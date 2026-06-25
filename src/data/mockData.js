// Dados da Família Champalimaud — transcritos da árvore real e corrigidos pelo Raul.
// Espelham o esquema do Supabase (tabelas `members`, `relationships`, `memories`).
//
// • `name`     = nome próprio / de curso (aparece em DESTAQUE)
// • `nickname` = alcunha de praxe (mais pequena; pode ser vazia, ex.: Piri)
// • Apenas 4 fundadores: Ping, Jajonhe, Grizo, Hugo.
// • Há membros com DOIS padrinhos (co-padrinhos) — o 1.º listado é o "primário"
//   (define a posição na árvore e a geração); o 2.º é desenhado como ligação extra.

export const FACULDADES = {
  FCT: 'Faculdade de Ciências e Tecnologia',
  FD: 'Faculdade de Direito',
  FE: 'Faculdade de Economia',
  FM: 'Faculdade de Medicina',
}

const FOUNDERS = ['ping', 'jajonhe', 'grizo', 'hugo']

// [id, nome, alcunha]
const NAMES = [
  ['ping', 'Ping', 'T-Rex Gregossauro'],
  ['jajonhe', 'Jajonhe', 'Tropas'],
  ['grizo', 'Grizo', 'Burlão'],
  ['hugo', 'Hugo', 'Donald'],
  ['carvalheira', 'Carvalheira', 'Mãe Estou Solteiro'],
  ['gomes', 'Gomes', 'O Incrível Hulkoiro'],
  ['piri', 'Piri', ''],
  ['bras', 'Brás', 'Morcelas'],
  ['clara', 'Clara', 'Pardalita'],
  ['ze_cordeiro', 'Zé Cordeiro', 'Zé Curriqueiro Follow The Leader'],
  ['pedro', 'Pedro', 'Edro'],
  ['vartels', 'Vartels', 'Tintim'],
  ['joao_dias', 'João Dias', 'Rocha Mole'],
  ['gabriel', 'Gabriel', 'Picha'],
  ['moguels', 'Moguels', 'Vaquinha'],
  ['caco', 'Caço', 'Setaque'],
  ['carmo', 'Carmo', 'Ca...Clara'],
  ['vaz', 'Vaz', 'Sou-Bi-Ónico'],
  ['maria_castro', 'Maria Castro', ''],
  ['matilde_neves', 'Matilde Neves', 'Apóstolo 12 e Meio'],
  ['ines_costa', 'Inês Costa', 'Fábio Coentrão'],
  ['sofia_pascoa', 'Sofia Páscoa', ''],
  ['migueleo', 'Migueleo', 'Miguélio 50 Pontos'],
  ['tildes', 'Matilde', 'Inspetora Mini'],
  ['bia_l', 'Bia Landeiro', ''],
  ['marta', 'Marta', ''],
  ['pippo', 'Pippo', 'Triângulo Otis'],
  ['leti', 'Letícia', 'Lanches'],
  ['matilde_alves', 'Matilde', 'A Falhada'],
  ['kika_rocha', 'Kika Rocha', ''],
  ['mini_rita', 'Mini Rita', 'Kréu'],
  ['rui_jorge', 'Rui Jorge', 'Dora'],
  ['vasco', 'Vasco', 'Isqueiro'],
  ['rodolfo', 'Rodolfo', 'Comilão'],
  ['cesar', 'César', 'Inem'],
  ['maria_p', 'Maria P.', 'Delay'],
  ['tommy', 'Tommy', 'Eminem da Praxe'],
  ['mike', 'Mike', 'GPS'],
  ['sassa', 'Sassa', 'MC Completo'],
  ['mota', 'Mota', 'Angélico'],
  ['munha', 'Munhá', 'Varão'],
  ['ximenes', 'Ximenes', 'Palma Bigots X-Men Calvo'],
  ['henrique', 'Henrique', 'Phenrique'],
  ['maria_costa', 'Maria Costa', ''],
  ['andreia', 'Andreia', 'Kréu'],
  ['tomas_h', 'Tomás H.', 'Grito'],
  ['maravilha', 'Maravilha', 'Pirata Rabolho'],
  ['sissi', 'Sissi', ''],
  ['gabi', 'Gabi', 'Camões'],
  ['carol', 'Carol', 'Letxícia'],
  ['dinis', 'Dinis', 'Charlotte'],
  ['joana', 'Joana', 'Bombas'],
  ['susi', 'Susi', "Fiambre d'Atum"],
  ['tomas_m', 'Tomás M.', 'Caloirinho D.T.T.'],
  ['nanda', 'Nanda', 'A Careca dum Calvo que Parece o Rabo dum Macaco'],
  ['raul', 'Raul', 'Maré'],
  ['rita_pais', 'Rita Pais', 'Padeira de Campolide de Gelatina Quedas Torera'],
  ['eva', 'Eva', 'Eva Gina Flor'],
  ['sara', 'Sara', 'Ladrona Ultras Autotuna'],
  ['sofia_l', 'Sofia', 'Sofia Solista'],
  ['tita', 'Tita', ''],
  ['morgana', 'Morgana', 'Unísono'],
  ['ana', 'Ana', ''],
  ['luisa', 'Luísa', 'Monstrinho do Álcool'],
  ['neves', 'Neves', 'Caloiro 123'],
  ['barriga', 'Barriga', "Belly's"],
  ['joaozinho', 'Joãozinho', 'Joãozinho Joãozinho Joãozinho'],
  ['rui_g', 'Rui Guedes', 'Machupão Alfa'],
  ['catarina', 'Catarina', 'Kirk Kat'],
  ['estrela', 'Estrela', 'O Máiore'],
  ['porto', 'Porto', 'Sou um Piço'],
  ['tiago_soares', 'Tiago Soares', ''],
  ['maquina', 'Máquina', 'Máquina do Álcool'],
  ['matilde_roque', 'Matilde Roque', ''],
  ['timi', 'Timi', 'Perna de Pau Médio Mal Passado'],
  ['matilde_conde', 'Matilde Conde', 'Macaquinha das Badtrips'],
  ['martina', 'Martina', 'Martini'],
  ['kika_moreira', 'Kika Moreira', ''],
  ['guilherme', 'Gui Gomes', 'Caloiro do Coito'],
  ['laura', 'Laura', 'Petite Girly Pop'],
  ['leonor_mendes', 'Leonor Mendes', 'Caloirra Frrancesa'],
  ['rita_c', 'Rita Correia', 'Frigorífico'],
  ['gui_s', 'Gui Santos', 'Guilidades o Caloiro Amor da Minha Vida'],
  ['binga', 'Binga', 'Chambingo'],
  ['ines_a', 'Inês Alvelos', 'Jonick'],
  ['raquel', 'Raquel', 'Minar-te-ei'],
  ['ines_barbeiro', 'Inês Barbeiro', ''],
  ['leonor_catarino', 'Leonor Catarino', 'Octavia'],
]

// afilhado → [padrinhos/madrinhas]  (o 1.º é o primário)
const PADRINHOS = [
  ['carvalheira', ['ping']],
  ['gomes', ['ping', 'jajonhe']],
  ['piri', ['jajonhe']],
  ['bras', ['jajonhe']],
  ['clara', ['jajonhe']],
  ['ze_cordeiro', ['jajonhe']],
  ['pedro', ['jajonhe']],
  ['vartels', ['gomes']],
  ['joao_dias', ['gomes']],
  ['gabriel', ['gomes']],
  ['moguels', ['piri', 'bras']],
  ['caco', ['bras']],
  ['carmo', ['vartels', 'maria_costa']],
  ['vaz', ['joao_dias']],
  ['maria_castro', ['joao_dias']],
  ['matilde_neves', ['joao_dias']],
  ['ines_costa', ['moguels']],
  ['sofia_pascoa', ['caco']],
  ['migueleo', ['clara']],
  ['tildes', ['clara']],
  ['bia_l', ['clara']],
  ['marta', ['clara']],
  ['pippo', ['clara']],
  ['ana', ['clara']],
  ['luisa', ['clara']],
  ['laura', ['clara']],
  ['nanda', ['clara', 'leti']],
  ['leti', ['tildes']],
  ['matilde_alves', ['marta']],
  ['kika_rocha', ['marta']],
  ['mini_rita', ['pippo', 'tommy']],
  ['rui_jorge', ['grizo']],
  ['vasco', ['grizo']],
  ['rodolfo', ['grizo']],
  ['cesar', ['grizo']],
  ['leonor_mendes', ['grizo']],
  ['maria_p', ['grizo', 'henrique']],
  ['tommy', ['vasco']],
  ['mike', ['rodolfo']],
  ['sassa', ['mike']],
  ['mota', ['mike', 'maravilha']],
  ['carol', ['cesar']],
  ['dinis', ['cesar']],
  ['joana', ['cesar']],
  ['guilherme', ['cesar']],
  ['munha', ['hugo']],
  ['ximenes', ['hugo']],
  ['henrique', ['hugo']],
  ['maria_costa', ['hugo']],
  ['andreia', ['hugo']],
  ['tomas_h', ['henrique']],
  ['maravilha', ['henrique']],
  ['sissi', ['maria_costa']],
  ['gabi', ['andreia']],
  ['susi', ['maravilha']],
  ['tomas_m', ['maravilha']],
  ['sara', ['maravilha']],
  ['raul', ['vaz']],
  ['joaozinho', ['vaz']],
  ['rita_pais', ['ines_a', 'leonor_mendes']],
  ['barriga', ['rui_jorge', 'ines_a']],
  ['rui_g', ['rui_jorge']],
  ['eva', ['migueleo']],
  ['sofia_l', ['rita_c']],
  ['tita', ['rita_c']],
  ['morgana', ['gabi']],
  ['neves', ['sassa']],
  ['catarina', ['matilde_neves']],
  ['estrela', ['matilde_neves']],
  ['porto', ['joao_dias', 'maria_castro']],
  ['tiago_soares', ['sofia_pascoa']],
  ['matilde_conde', ['sofia_pascoa']],
  ['maquina', ['mota']],
  ['matilde_roque', ['susi', 'piri']],
  ['timi', ['carmo']],
  ['martina', ['leti']],
  ['kika_moreira', ['laura']],
  ['rita_c', ['leonor_mendes']],
  ['gui_s', ['leonor_mendes']],
  ['binga', ['leonor_mendes']],
  ['ines_a', ['leonor_mendes']],
  ['raquel', ['binga']],
  ['ines_barbeiro', ['caco']],
  ['leonor_catarino', ['joana']],
]

// Membros femininos (melhor estimativa) — define madrinha vs padrinho.
const FEMALE = new Set([
  'piri', 'clara', 'maria_castro', 'maria_costa', 'matilde_neves', 'ines_costa',
  'sofia_pascoa', 'tildes', 'bia_l', 'marta', 'leti', 'matilde_alves', 'kika_rocha',
  'mini_rita', 'maria_p', 'sissi', 'gabi', 'carol', 'joana', 'susi', 'nanda',
  'rita_pais', 'eva', 'sara', 'sofia_l', 'tita', 'morgana', 'ana', 'luisa',
  'catarina', 'estrela', 'matilde_roque', 'matilde_conde', 'martina', 'kika_moreira',
  'laura', 'leonor_mendes', 'rita_c', 'binga', 'ines_a', 'raquel', 'ines_barbeiro',
  'leonor_catarino', 'andreia', 'carmo',
])

// Geração calculada a partir do padrinho PRIMÁRIO (fundadores = geração 1).
const primaryParent = new Map(PADRINHOS.map(([child, parents]) => [child, parents[0]]))
function generationOf(id) {
  let gen = 1
  let cur = id
  const guard = new Set()
  while (!FOUNDERS.includes(cur) && primaryParent.has(cur) && !guard.has(cur)) {
    guard.add(cur)
    cur = primaryParent.get(cur)
    gen += 1
  }
  return gen
}

export const members = NAMES.map(([id, name, nickname]) => ({
  id,
  name,
  nickname,
  generation: generationOf(id),
  photo_url: '',
  course: '',
  faculty: '',
  year_joined: null,
  email: '',
  bio: '',
  quote: '',
}))

export const relationships = PADRINHOS.flatMap(([child, parents]) =>
  parents.map((parent, i) => ({
    id: `r-${parent}-${child}`,
    parent_id: parent,
    child_id: child,
    type: FEMALE.has(parent) ? 'madrinha' : 'padrinho',
    is_primary: i === 0,
  }))
)

// Sem memórias reais por agora — a preencher pelos membros depois do login.
export const memories = []
