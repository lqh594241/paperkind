"""Create static sharing artwork from the actual printable PDFs.

Development-only: requires Pillow and pdftoppm. Deployment only serves the PNGs.
Run with --pdftoppm PATH when Poppler is not on PATH.
"""
import argparse
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--pdftoppm', default=shutil.which('pdftoppm'))
args = parser.parse_args()
if not args.pdftoppm:
    parser.error('Install Poppler or provide --pdftoppm PATH.')
font_root = Path(os.environ.get('WINDIR', 'C:/Windows')) / 'Fonts'

def font(size, face='arial'):
    return ImageFont.truetype(str(font_root / f'{face}.ttf'), size)

def annotate(page, kind):
    d = ImageDraw.Draw(page)
    scale = page.width / 210
    def xy(x, y): return round(x * scale), round(y * scale)
    def line(points, fill='#526855', width=0.5):
        d.line([xy(*p) for p in points], fill=fill, width=max(1, round(width * scale)))
    def text(x, y, value, size=4, face='georgia', color='#354c3d'):
        d.text(xy(x,y), value, font=font(round(size*scale),face), fill=color)
    if kind == 'graph':
        text(30, 35, 'A little coordinate study', 5, 'georgiai')
        line([(40,200),(175,200)])
        line([(100,245),(100,65)])
        line([(172,198),(175,200),(172,202)])
        line([(98,68),(100,65),(102,68)])
        pts = [(100+x*5, 200-(x*x/8)*5) for x in [i/10 for i in range(-100,101)]]
        line(pts, '#b95a3d', .75)
        for x in [-8,-4,4,8]: text(97+x*5,204,str(x),3)
        text(180,198,'x',4,'georgiai')
        text(104,65,'y',4,'georgiai')
        text(130,110,'y = x² / 8',4,'georgiai', '#b95a3d')
    elif kind == 'dots':
        text(25,27,'A little space for the week',6,'georgiai')
        for y, heading in [(60,'MAKE'),(120,'NOTICE'),(180,'NEXT')]:
            line([(25,y),(185,y)], '#a77e43', .45)
            text(25,y+5,heading,3.5,'arialbd')
        text(25,79,'Something worth trying.',4.5,'georgiai')
        text(25,139,'The small good things.',4.5,'georgiai')
        text(25,199,'One thing at a time.',4.5,'georgiai')
        for y in [217,232,247]:
            d.rectangle([*xy(25,y),*xy(28,y+3)],outline='#526855',width=2)
            line([(34,y+2),(145,y+2)],'#a5ad9d',.2)
    else:
        text(25,32,'A small colorwork exploration',5,'georgiai')
        # Fill whole cells on the exact 5 x 3.75 mm chart.
        for row in range(29):
            for col in range(28):
                x = col % 14
                y = row % 14
                distance = abs(x-6.5) + abs(y-6.5)
                if 3.5 <= distance <= 5.5 or (x in [6,7] and y in [6,7]):
                    left,top=30+col*5,70+row*3.75
                    d.rectangle([*xy(left+.3,top+.25),*xy(left+4.7,top+3.5)],fill='#b15f48')
        text(30,205,'One cell. One stitch.',5,'georgiai')
        text(30,218,'Try a shape. Find a repeat.',4,'georgiai')
    return page

templates = json.loads((ROOT/'scripts/templates.json').read_text(encoding='utf-8'))
with tempfile.TemporaryDirectory(prefix='paperkind-artwork-') as tmp:
    for t in templates:
        prefix = Path(tmp)/t['id']
        subprocess.run([args.pdftoppm,'-singlefile','-png','-r','150',str(ROOT/'assets/downloads'/f"{t['slug']}-a4.pdf"),str(prefix)],check=True,capture_output=True)
        source = Image.open(str(prefix)+'.png').convert('RGB')
        for i, pin in enumerate(t['pins']):
            canvas = Image.new('RGB',(1000,1500),t['background'])
            d = ImageDraw.Draw(canvas)
            ink = '#273b30'
            d.text((65,48),'paperkind',font=font(38,'georgia'),fill=ink)
            d.text((757,60),f"PAPER No. 0{templates.index(t)+1}",font=font(15),fill=ink)
            d.line((65,112,935,112),fill='#a3a99b',width=1)
            d.text((65,150),pin['subtitle'],font=font(17,'arialbd'),fill=ink)
            y=193
            for headline in pin['headline']:
                size=73
                while d.textlength(headline,font=font(size,'georgia'))>870: size-=1
                d.text((61,y),headline,font=font(size,'georgia'),fill=ink)
                y+=88
            sheet = annotate(source.copy(),t['id']) if i else source.copy()
            sheet = sheet.resize((602,852),Image.Resampling.LANCZOS).convert('RGBA')
            sheet = sheet.rotate(-4 if i else 4,resample=Image.Resampling.BICUBIC,expand=True)
            x=(1000-sheet.width)//2
            y=410
            shadow=Image.new('RGBA',canvas.size,(0,0,0,0))
            shadow.paste((39,59,48,44),(x+12,y+20),sheet.getchannel('A'))
            canvas=Image.alpha_composite(canvas.convert('RGBA'),shadow.filter(ImageFilter.GaussianBlur(18)))
            canvas.alpha_composite(sheet,(x,y))
            d=ImageDraw.Draw(canvas)
            d.text((65,1360),'FREE PDF  /  A4 + US LETTER',font=font(22,'arialbd'),fill=ink)
            d.text((65,1405),'Example shown · download is a blank sheet.' if i else 'A blank sheet. Ready for your next idea.',font=font(19),fill=ink)
            d.text((65,1450),'PAPERKIND  ·  PRINT AT ACTUAL SIZE / 100%',font=font(13),fill=ink)
            suffix='example' if i else 'blank'
            dest=ROOT/'sharing'/f"{t['id']}-{suffix}.png"
            canvas.convert('RGB').save(dest,optimize=True)
            print(dest.name)
