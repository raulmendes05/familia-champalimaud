#!/usr/bin/env python3
"""Recorta a cara de cada foto, reduz e carrega para o Supabase (members.photo_url).
Uso: python3 scripts/upload_photos.py <pasta-com-fotos>

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

CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def crop_face(img, size=256):
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = CASCADE.detectMultiScale(gray, scaleFactor=1.15, minNeighbors=5, minSize=(60, 60))
    if len(faces):
        fx, fy, fw, fh = max(faces, key=lambda f: f[2] * f[3])
        cx, cy = fx + fw / 2, fy + fh / 2
        half = max(fw, fh) * 0.95  # margem à volta da cara
        cy -= fh * 0.1            # sobe um pouco (cabelo/testa)
    else:
        cx, cy = w / 2, h / 2
        half = min(w, h) / 2
    half = min(half, w / 2, h / 2)
    x0 = int(max(0, min(cx - half, w - 2 * half)))
    y0 = int(max(0, min(cy - half, h - 2 * half)))
    s = int(2 * half)
    crop = img[y0:y0 + s, x0:x0 + s]
    return cv2.resize(crop, (size, size), interpolation=cv2.INTER_AREA), len(faces) > 0

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
    done, faces_found, unmatched, errors = 0, 0, [], []
    for fn in files:
        stem = os.path.splitext(fn)[0]
        mid = lookup.get(norm(stem))
        if not mid:
            unmatched.append(fn); continue
        try:
            img = read_image(os.path.join(folder, fn))
            if img is None:
                errors.append(f'{fn} (não consegui ler)'); continue
            crop, had_face = crop_face(img)
            upload(mid, to_data_url(crop))
            done += 1
            faces_found += 1 if had_face else 0
            print(f'  ✓ {by_id[mid]["name"]:22} {"(cara)" if had_face else "(centro)"}  ← {fn}')
        except urllib.error.HTTPError as e:
            errors.append(f'{fn} → HTTP {e.code} {e.read().decode()[:120]}')
        except Exception as e:
            errors.append(f'{fn} → {e}')
    print(f'\nCarregadas: {done}/{len(files)}  | cara detetada: {faces_found}')
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
