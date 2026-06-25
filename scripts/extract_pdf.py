#!/usr/bin/env python3
"""Extrai a posição (x, y) de cada rótulo de texto do PDF da árvore.
Uso: python3 scripts/extract_pdf.py <caminho.pdf>
Imprime JSON com [{text, x, y, size}] (y já virado para crescer para baixo).
"""
import sys, json
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextLine, LTTextContainer, LTChar

def main(path):
    items = []
    page_h = 0
    for page in extract_pages(path):
        page_h = max(page_h, page.height)
        for el in page:
            if not isinstance(el, LTTextContainer):
                continue
            for line in el:
                if not isinstance(line, LTTextLine):
                    continue
                txt = line.get_text().strip()
                if not txt:
                    continue
                sizes = [c.size for c in line if isinstance(c, LTChar)]
                size = round(sum(sizes) / len(sizes), 1) if sizes else 0
                x = round((line.x0 + line.x1) / 2, 1)
                y = round((line.y0 + line.y1) / 2, 1)
                items.append({"text": txt, "x": x, "y": y, "size": size})
    # vira o y (PDF cresce para cima → queremos crescer para baixo)
    for it in items:
        it["y"] = round(page_h - it["y"], 1)
    print(json.dumps({"page_h": round(page_h, 1), "items": items}, ensure_ascii=False, indent=0))

if __name__ == "__main__":
    main(sys.argv[1])
