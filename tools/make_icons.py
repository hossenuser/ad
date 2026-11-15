"""Resize the ORIGINAL logo (no edits) into the icon sizes each platform needs."""
import os, sys
from PIL import Image
src, android_res, desktop_build = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert("RGBA")
os.makedirs(desktop_build, exist_ok=True)
im.resize((512, 512), Image.LANCZOS).save(os.path.join(desktop_build, "icon.png"))
im.save(os.path.join(desktop_build, "icon.ico"), sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
for d, s in {"mdpi":48,"hdpi":72,"xhdpi":96,"xxhdpi":144,"xxxhdpi":192}.items():
    p = os.path.join(android_res, f"mipmap-{d}"); os.makedirs(p, exist_ok=True)
    r = im.resize((s, s), Image.LANCZOS)
    for n in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
        r.save(os.path.join(p, n))
    # adaptive icon files would crop the logo, so remove them and keep the plain logo icon
    for n in ("ic_launcher.xml",):
        q = os.path.join(p, n)
        if os.path.exists(q): os.remove(q)
for d in ("mipmap-anydpi-v26",):
    p = os.path.join(android_res, d)
    if os.path.isdir(p):
        for f in os.listdir(p): os.remove(os.path.join(p, f))
print("icons written")
