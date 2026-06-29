#!/usr/bin/env python3
"""Aplica o efeito cartoon a cada foto, reduz e carrega para o Supabase (members.photo_url).
Uso: python3 scripts/upload_photos.py <pasta-com-fotos>

- As fotos JÁ VÊM enquadradas/zoomadas pela pessoa. NÃO se faz deteção de cara
  nem zoom — só se recorta para quadrado (centro) e se aplica o cartoon.
- Os ficheiros devem ter o NOME ou o ID da pessoa (ex.: "Ping.jpg", "joao_dias.png").
- Aceita jpg/png/webp e HEIC (iPhone, convertido com `sips`).
- Precisa de uma política temporária no Supabase a permitir UPDATE (ver instruções).
"""
import sys, os, json, base64, unicodedata, subprocess, tempfile, urllib.request, urllib.error
import cv2
import numpy as np

# ── credenciais (lidas do .env.local) ──
def load_env():
    env = {}
    root = os.path.join(os.path.dirname(__file__), '..')
    with open(os.path.join(root, '.env.local')) as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"')
    return env

ENV = load_env()
URL = ENV['VITE_SUPABASE_URL']
KEY = ENV['VITE_SUPABASE_ANON_KEY']

def norm(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return ''.join(c for c in s.lower() if c.isalnum())

# ── carrega membros do Supabase para casar nomes ──
def fetch_members():
    req = urllib.request.Request(f"{URL}/rest/v1/members?select=id,name,nickname",
                                 headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    return json.load(urllib.request.urlopen(req))

def build_lookup(members):
    by_id = {}
    lookup = {}
    for m in members:
        by_id[m['id']] = m
        for key in [m['id'], m.get('name') or '', m.get('nickname') or '']:
            n = norm(key)
            if n and n not in lookup:
                lookup[n] = m['id']
        # id tem prioridade
        lookup[norm(m['id'])] = m['id']
    return lookup, by_id

# ── leitura de imagem (com conversão HEIC) ──
def read_image(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in ('.heic', '.heif'):
        tmp = tempfile.mktemp(suffix='.jpg')
        subprocess.run(['sips', '-s', 'format', 'jpeg', path, '--out', tmp],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        img = cv2.imread(tmp)
        try: os.remove(tmp)
        except OSError: pass
        return img
    return cv2.imread(path)

def cartoonize(img):
    """Efeito ilustração: suaviza preservando contornos, satura e posteriza."""
    sm = cv2.bilateralFilter(img, 9, 90, 90)
    hsv = cv2.cvtColor(sm, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.4, 0, 255)
    sat = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    levels = np.array([0, 69, 135, 199, 255], dtype=np.uint8)
    idx = np.clip((sat.astype(np.int32) * 5) // 256, 0, 4)
    return levels[idx]

def square_crop(img, size=384):
    """Recorta ao quadrado pelo centro (sem zoom) e reduz para `size`.
    A foto já vem enquadrada — só se ajusta a proporção para quadrado."""
    h, w = img.shape[:2]
    s = min(w, h)
    x0 = (w - s) // 2
    y0 = (h - s) // 2
    crop = img[y0:y0 + s, x0:x0 + s]
    return cv2.resize(crop, (size, size), interpolation=cv2.INTER_AREA)

def to_data_url(img):
    ok, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 86])
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.tobytes()).decode()

def upload(member_id, data_url):
    body = json.dumps({'photo_url': data_url}).encode()
    req = urllib.request.Request(
        f"{URL}/rest/v1/members?id=eq.{member_id}", data=body, method='PATCH',
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}',
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'})
    urllib.request.urlopen(req)

def main(folder):
    members = fetch_members()
    lookup, by_id = build_lookup(members)
    files = [f for f in sorted(os.listdir(folder))
             if os.path.splitext(f)[1].lower() in ('.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif')]
    if not files:
        print('Sem imagens na pasta.'); return
    done, unmatched, errors = 0, [], []
    for fn in files:
        stem = os.path.splitext(fn)[0]
        mid = lookup.get(norm(stem))
        if not mid:
            unmatched.append(fn); continue
        try:
            img = read_image(os.path.join(folder, fn))
            if img is None:
                errors.append(f'{fn} (não consegui ler)'); continue
            crop = square_crop(img)
            upload(mid, to_data_url(cartoonize(crop)))
            done += 1
            print(f'  ✓ {by_id[mid]["name"]:22}  ← {fn}')
        except urllib.error.HTTPError as e:
            errors.append(f'{fn} → HTTP {e.code} {e.read().decode()[:120]}')
        except Exception as e:
            errors.append(f'{fn} → {e}')
    print(f'\nCarregadas: {done}/{len(files)}')
    if unmatched:
        print('Sem correspondência (renomeia com o nome/id da pessoa):')
        for f in unmatched: print('   -', f)
    if errors:
        print('Erros:')
        for e in errors: print('   -', e)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Uso: python3 scripts/upload_photos.py <pasta-com-fotos>'); sys.exit(1)
    main(sys.argv[1])
