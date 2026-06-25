#!/usr/bin/env python3
"""Encontra a posição exata de cada um dos 88 membros, procurando o seu nome
(tal como aparece no PDF) na sopa de caracteres. Lida com nomes de 1 e 2
palavras (lado-a-lado OU empilhados). Saída: JSON id -> [x, y] (y cresce p/ baixo).
"""
import sys, json, unicodedata
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTChar

NFC = lambda s: unicodedata.normalize("NFC", s)
def cf(s): return NFC(s).casefold()

# id -> rótulo no PDF
LABELS = {
 "ping":"PING","jajonhe":"JAJONHE","grizo":"GRIZO","hugo":"HUGO",
 "carvalheira":"CARVALHEIRA","gomes":"GOMES","ze_cordeiro":"ZÉ CORDEIRO","piri":"PIRI",
 "bras":"BRÁS","pedro":"PEDRO","clara":"CLARA","vasco":"VASCO","leonor_mendes":"LEONOR MENDES",
 "rui_jorge":"RUI JORGE","cesar":"CÉSAR","rodolfo":"RODOLFO","munha":"MUNHÁ","henrique":"HENRIQUE",
 "andreia":"ANDREIA","maria_costa":"MARIA","ximenes":"XIMENES",
 "gabriel":"GABRIEL","joao_dias":"JOÃO DIAS","vartels":"VARTELS","moguels":"MOGUELS","caco":"CAÇO",
 "binga":"BINGA","rita_c":"RITA C.","ines_a":"INÊS A.","maria_p":"MARIA P.","maravilha":"MARAVILHA",
 "tomas_h":"TOMÁS H.","sissi":"SISSI",
 "vaz":"VAZ","matilde_neves":"MATILDE NEVES","maria_castro":"MARIA CASTRO","ines_costa":"INÊS COSTA",
 "sofia_pascoa":"SOFIA PÁSCOA","ines_barbeiro":"INÊS BARBEIRO","raquel":"RAQUEL","tita":"TITA",
 "sofia_l":"SOFIA L.","mike":"MIKE","gabi":"GABI",
 "rita_pais":"RITA PAIS","barriga":"BARRIGA","rui_g":"RUI G.","susi":"SUSI","tomas_m":"TOMÁS M.",
 "matilde_conde":"MATILDE CONDE","tiago_soares":"TIAGO SOARES","tommy":"TOMMY","gui_s":"GUI S.",
 "porto":"PORTO","carol":"CAROL","joana":"JOANA","dinis":"DINIS","morgana":"MORGANA","sara":"SARA",
 "migueleo":"MIGUELEO","laura":"LAURA","tildes":"TILDES","bia_l":"BIA L.","marta":"MARTA","pippo":"PIPPO",
 "raul":"RAUL","joaozinho":"JOÃOZINHO","sassa":"SASSA","mota":"MOTA",
 "guilherme":"GUILHERME","leonor_catarino":"LEONOR CATARINO","eva":"EVA","kika_moreira":"KIKA MOREIRA",
 "leti":"LETI","matilde_alves":"MATILDE ALVES","kika_rocha":"KIKA ROCHA","mini_rita":"MINI RITA","carmo":"CARMO",
 "neves":"NEVES","maquina":"MÁQUINA","catarina":"CATARINA","estrela":"ESTRELA","matilde_roque":"MATILDE ROQUE",
 "ana":"ANA","martina":"MARTINA","nanda":"NANDA","luisa":"LUÍSA","timi":"TIMI",
}

def collect(el, out):
    for o in el:
        if isinstance(o, LTChar):
            t = o.get_text()
            if t.strip():
                out.append({"ch": cf(t), "x0": o.x0, "x1": o.x1, "y0": o.y0, "y1": o.y1,
                            "cx": (o.x0+o.x1)/2, "cy": (o.y0+o.y1)/2})
        elif hasattr(o, "__iter__"):
            try: collect(o, out)
            except TypeError: pass

def find_word(word, chars, used):
    """Todas as ocorrências de `word` como sequência contígua numa baseline."""
    w = [c for c in cf(word) if c != " "]
    res = []
    n = len(chars)
    for i in range(n):
        if used[i] or chars[i]["ch"] != w[0]:
            continue
        base = chars[i]["y0"]; lastx = chars[i]["x1"]; idxs = [i]; ok = True
        ci = i
        for k in range(1, len(w)):
            found = -1
            for j in range(n):
                if used[j] or j in idxs: continue
                c = chars[j]
                if c["ch"] == w[k] and abs(c["y0"]-base) < 3.2 and c["x0"] >= chars[idxs[-1]]["x0"]-0.5 and (c["x0"]-lastx) < 13 and (c["x0"]-lastx) > -3:
                    found = j; break
            if found < 0: ok = False; break
            idxs.append(found); lastx = chars[found]["x1"]
        if ok:
            xs0=min(chars[k]["x0"] for k in idxs); xs1=max(chars[k]["x1"] for k in idxs)
            ys0=min(chars[k]["y0"] for k in idxs); ys1=max(chars[k]["y1"] for k in idxs)
            res.append({"idxs": idxs, "x0":xs0,"x1":xs1,"y0":ys0,"y1":ys1,"cx":(xs0+xs1)/2,"cy":(ys0+ys1)/2})
    return res

def assemble(words, chars, used):
    """Encontra a 1.ª combinação onde as palavras estão lado-a-lado ou empilhadas."""
    occ = [find_word(w, chars, used) for w in words]
    if any(not o for o in occ): return None
    def chain(prev, k):
        if k == len(words): return [prev]
        for cand in occ[k]:
            if set(cand["idxs"]) & set(prev["idxs"]): continue
            right = abs(cand["y0"]-prev["y0"]) < 3.2 and 0 < (cand["x0"]-prev["x1"]) < 26
            below = abs(cand["cx"]-prev["cx"]) < 30 and -4 < (prev["y0"]-cand["y1"]) < 24
            if right or below:
                r = chain({"idxs": prev["idxs"]+cand["idxs"],
                           "x0":min(prev["x0"],cand["x0"]),"x1":max(prev["x1"],cand["x1"]),
                           "y0":min(prev["y0"],cand["y0"]),"y1":max(prev["y1"],cand["y1"])}, k+1)
                if r: return r
        return None
    for first in occ[0]:
        r = chain(first, 1)
        if r: return r[0]
    return None

def main(path):
    page = next(iter(extract_pages(path)))
    page_h = page.height
    chars = []; collect(page, chars)
    used = [False]*len(chars)
    # processa nomes com mais palavras primeiro (consome para desambiguar)
    order = sorted(LABELS.items(), key=lambda kv: (-len(kv[1].split()), -len(kv[1])))
    pos = {}; misses = []
    for mid, label in order:
        words = label.split()
        m = assemble(words, chars, used) if len(words) > 1 else (find_word(words[0], chars, used) or [None])[0]
        if not m:
            misses.append((mid, label)); continue
        for k in m["idxs"]: used[k] = True
        cx = round((m["x0"]+m["x1"])/2, 1)
        cy = round(page_h - (m["y0"]+m["y1"])/2, 1)
        pos[mid] = [cx, cy]
    print(json.dumps({"page_h": round(page_h,1), "pos": pos,
                      "missing": misses, "found": len(pos)}, ensure_ascii=False))

if __name__ == "__main__":
    main(sys.argv[1])
