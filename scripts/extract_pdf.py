#!/usr/bin/env python3
"""Extrai rótulos de texto (com posição) e fotos do PDF da árvore.
Os caracteres estão aninhados em LTFigure, por isso percorremos recursivamente.
Uso: python3 scripts/extract_pdf.py <caminho.pdf>
Saída JSON: { page_h, labels:[{text,x,y,size}], images:[{x,y,w,h}] }  (y cresce p/ baixo)
"""
import sys, json
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTChar, LTImage

def collect(el, chars, imgs):
    for o in el:
        if isinstance(o, LTChar):
            chars.append(o)
        elif isinstance(o, LTImage):
            imgs.append(o)
        elif hasattr(o, "__iter__"):
            try:
                collect(o, chars, imgs)
            except TypeError:
                pass

def group_lines(chars, xgap=16):
    # agrupa por baseline (y) próximo E por proximidade em x: nomes de pessoas
    # diferentes na mesma linha ficam separados; espaços dentro de um nome (<xgap)
    # mantêm-se juntos.
    chars = [c for c in chars if c.get_text() != ""]
    chars.sort(key=lambda c: (-(c.y0), c.x0))
    lines, cur, last_y, last_x = [], [], None, None
    for c in chars:
        same_row = last_y is not None and abs(c.y0 - last_y) <= 4
        near = last_x is not None and (c.x0 - last_x) <= xgap
        if same_row and near:
            if c.x0 - last_x > c.size * 0.5:
                cur.append((" ", None))
            cur.append((c.get_text(), c)); last_x = c.x1
        else:
            if cur:
                lines.append(cur)
            cur = [(c.get_text(), c)]; last_x = c.x1; last_y = c.y0
    if cur:
        lines.append(cur)
    return lines

def mkline(cur, page_h):
    txt = "".join(t for t, _ in cur).strip()
    cs = [c for _, c in cur if c is not None]
    if not txt or not cs:
        return None
    x0 = min(c.x0 for c in cs); x1 = max(c.x1 for c in cs)
    y0 = min(c.y0 for c in cs); y1 = max(c.y1 for c in cs)
    size = round(sum(c.size for c in cs) / len(cs), 1)
    return {"text": txt, "x": round((x0 + x1) / 2, 1),
            "y": round(page_h - (y0 + y1) / 2, 1), "size": size}

def main(path):
    page = next(iter(extract_pages(path)))
    page_h = page.height
    chars, imgs = [], []
    collect(page, chars, imgs)
    labels = [l for l in (mkline(g, page_h) for g in group_lines(chars)) if l]
    images = [{"x": round((im.x0 + im.x1) / 2, 1),
               "y": round(page_h - (im.y0 + im.y1) / 2, 1),
               "w": round(im.x1 - im.x0, 1), "h": round(im.y1 - im.y0, 1)} for im in imgs]
    print(json.dumps({"page_h": round(page_h, 1), "labels": labels, "images": images}, ensure_ascii=False))

if __name__ == "__main__":
    main(sys.argv[1])
