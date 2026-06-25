#!/usr/bin/env python3
"""Extrai a geometria das LINHAS desenhadas no PDF (os conectores da árvore).
Saída JSON: { page_h, w, h, lines:[{pts:[[x,y],...], stroke:[r,g,b]|null, lw}] }
y já virado para crescer para baixo. Exclui retângulos fechados (caixas/molduras).
"""
import sys, json
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTLine, LTCurve, LTRect

def collect(el, out, page_h):
    for o in el:
        # LTRect e LTLine são subclasses de LTCurve; tratamos pela ordem certa
        if isinstance(o, LTRect):
            pass  # caixas/molduras — ignorar
        elif isinstance(o, (LTLine, LTCurve)):
            pts = getattr(o, "pts", None)
            if pts and len(pts) >= 2:
                stroke = list(o.stroking_color) if getattr(o, "stroking_color", None) is not None else None
                if isinstance(stroke, (int, float)):
                    stroke = [stroke, stroke, stroke]
                out.append({
                    "pts": [[round(x, 1), round(page_h - y, 1)] for (x, y) in pts],
                    "stroke": stroke,
                    "lw": round(getattr(o, "linewidth", 0) or 0, 2),
                    "fill": bool(getattr(o, "fill", False)),
                })
        if hasattr(o, "__iter__"):
            try:
                collect(o, out, page_h)
            except TypeError:
                pass

def main(path):
    page = next(iter(extract_pages(path)))
    page_h = page.height
    out = []
    collect(page, out, page_h)
    print(json.dumps({"page_h": round(page_h, 1), "w": round(page.width, 1),
                      "h": round(page_h, 1), "lines": out}, ensure_ascii=False))

if __name__ == "__main__":
    main(sys.argv[1])
