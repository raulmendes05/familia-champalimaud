// ╔══════════════════════════════════════════════════════════════╗
// ║  Layout FIXO da árvore — réplica do PDF "CHAMPI - FINAL ASR"     ║
// ╚══════════════════════════════════════════════════════════════╝
// Cada membro tem uma posição (x, y) em coordenadas "cruas" (~espaço do
// PDF). O componente multiplica por SCALE para caber os nós (168×64) sem
// sobreposições. Mexer aqui é a forma de afinar a árvore: muda o (x, y)
// de quem estiver fora do sítio e a linha acompanha automaticamente.
//
// Para ajustar: x maior = mais à direita, y maior = mais abaixo.

export const SCALE = { x: 3.3, y: 2.9 }

export const POSITIONS = {
  // ── Fundadores ──
  ping: [200, 80], jajonhe: [470, 80], grizo: [1080, 80], hugo: [1300, 80],

  // ── Linha logo abaixo dos fundadores ──
  carvalheira: [150, 180], gomes: [240, 180], ze_cordeiro: [330, 180],
  piri: [415, 180], bras: [470, 180], pedro: [525, 180], clara: [585, 180],
  vasco: [655, 180], leonor_mendes: [810, 180], rui_jorge: [985, 180],
  cesar: [1045, 180], rodolfo: [1105, 180], munha: [1165, 180],
  henrique: [1225, 180], andreia: [1300, 180], maria_costa: [1360, 180],
  ximenes: [1420, 180],

  // ── 3.ª faixa ──
  gabriel: [175, 290], joao_dias: [250, 290], vartels: [335, 290],
  moguels: [415, 290], caco: [475, 290], binga: [685, 290], rita_c: [775, 290],
  ines_a: [875, 290], maria_p: [1110, 290], maravilha: [1175, 290],
  tomas_h: [1240, 290], sissi: [1360, 290],

  // ── 4.ª faixa ──
  vaz: [185, 400], matilde_neves: [255, 400], maria_castro: [330, 400],
  ines_costa: [420, 400], sofia_pascoa: [480, 400], ines_barbeiro: [540, 400],
  raquel: [700, 400], tita: [765, 400], sofia_l: [825, 400], mike: [1060, 400],
  gabi: [1300, 400],

  rita_pais: [865, 470], barriga: [945, 470], rui_g: [1000, 490],
  susi: [1150, 470], tomas_m: [1240, 470],

  matilde_conde: [420, 500], tiago_soares: [505, 500], tommy: [610, 500],
  gui_s: [700, 500],

  porto: [335, 560], carol: [845, 560], joana: [920, 560], dinis: [990, 560],
  morgana: [1300, 540], sara: [1215, 560],

  migueleo: [420, 580], laura: [485, 580], tildes: [545, 580], bia_l: [615, 580],
  marta: [680, 580], pippo: [745, 580],

  raul: [195, 610], joaozinho: [265, 610], sassa: [1080, 600], mota: [1175, 600],

  guilherme: [825, 645], leonor_catarino: [920, 645], eva: [415, 655],
  kika_moreira: [490, 655], leti: [550, 655], matilde_alves: [615, 655],
  kika_rocha: [680, 655], mini_rita: [760, 655], carmo: [1380, 620],

  neves: [1080, 690], maquina: [1175, 690], catarina: [215, 715],
  estrela: [290, 715], matilde_roque: [130, 720], ana: [455, 720],
  martina: [515, 720], nanda: [580, 720], luisa: [710, 720], timi: [1380, 730],
}

// Encaminhamentos à mão para as ligações de co-padrinho que atravessam a
// árvore (as que não dá para ligar com um simples cotovelo sem cruzar).
// Chave = id do AFILHADO. Lista de pontos [x, y] (crus) do padrinho → afilhado,
// contornando por uma margem livre. As restantes ligações usam cotovelo auto.
export const ROUTE_OVERRIDES = {
  // Carmo (Maria Costa, lado direito) → desce pela margem direita
  carmo: [[1360, 180], [1360, 120], [1475, 120], [1475, 620], [1380, 620]],
  // Matilde Roque (Piri, centro-esquerda) → contorna pela margem esquerda
  matilde_roque: [[415, 180], [415, 120], [100, 120], [100, 720], [130, 720]],
}
