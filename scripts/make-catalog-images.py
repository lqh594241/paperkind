"""Development-only PDF render QA and sharing images. No website dependency."""
import argparse, json, subprocess, tempfile, textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

parser=argparse.ArgumentParser()
parser.add_argument('--pdftoppm',required=True)
parser.add_argument('--review-dir',required=True)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
review=Path(args.review_dir);review.mkdir(parents=True,exist_ok=True)
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {additions} from './scripts/catalog-data.mjs'; console.log(JSON.stringify(additions));"],cwd=root))
original=json.loads((root/'scripts/templates.json').read_text(encoding='utf-8'))
all_templates=original+data
font_dir=Path('C:/Windows/Fonts')
title_font=ImageFont.truetype(str(font_dir/'georgia.ttf'),62)
small_font=ImageFont.truetype(str(font_dir/'arial.ttf'),23)
label_font=ImageFont.truetype(str(font_dir/'arial.ttf'),16)
for paper in ['a4','letter']:
    contact=Image.new('RGB',(1200,5*350),'#eeeee8')
    contact_draw=ImageDraw.Draw(contact)
    for i,t in enumerate(all_templates):
        prefix=review/f'{t["slug"]}-{paper}'
        result=subprocess.run([args.pdftoppm,'-r','85','-singlefile','-png',str(root/'assets/downloads'/f'{t["slug"]}-{paper}.pdf'),str(prefix)],capture_output=True)
        if result.returncode:raise RuntimeError(result.stderr.decode(errors='replace'))
        sheet=Image.open(prefix.with_suffix('.png')).convert('RGB')
        thumb=sheet.copy();thumb.thumbnail((220,300))
        x=(i%5)*240+(240-thumb.width)//2;y=(i//5)*350+8
        contact.paste(thumb,(x,y))
        for j,line in enumerate(textwrap.wrap(t['name'],25)):
            contact_draw.text(((i%5)*240+10,(i//5)*350+311+j*18),line,font=label_font,fill='#273b30')
        if paper=='a4' and t in data:
            share=Image.new('RGB',(1000,1500),t['background']);draw=ImageDraw.Draw(share)
            draw.text((70,65),'PAPERKIND / FREE PRINTABLE PAPER',font=small_font,fill='#273b30')
            ytitle=123
            for line in textwrap.wrap(t['name'],25):
                draw.text((70,ytitle),line,font=title_font,fill='#273b30');ytitle+=76
            draw.text((70,ytitle+12),'A4 + US LETTER  /  VECTOR PDF',font=small_font,fill='#657063')
            page=sheet.copy();page.thumbnail((660,940))
            px=(1000-page.width)//2;py=400
            draw.rectangle((px+12,py+12,px+page.width+12,py+page.height+12),fill='#d0d0c5')
            share.paste(page,(px,py))
            draw.text((70,1415),'A blank page. A good beginning.',font=small_font,fill='#273b30')
            share.save(root/'sharing'/f'{t["id"]}-blank.png',optimize=True)
    contact.save(review/f'contact-{paper}.png')
print(f'Rendered {len(all_templates)*2} PDFs; generated {len(data)} sharing images. Review: {review}')
