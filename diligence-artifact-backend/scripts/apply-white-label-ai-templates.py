#!/usr/bin/env python3
import hashlib, html, re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from xml.sax.saxutils import escape

ROOT=Path(__file__).resolve().parents[1]
TROOT=ROOT/'references/document-templates/ai/v2_1'
BANNER=Path(__file__).with_name('neutral-ai-governance-banner.png').read_bytes()
DOCS=sorted(TROOT.glob('lane-*/*.docx'))
BRAND=re.compile(r'lex\s*nova(?:\s*hq)?|lexnovahq|lexnova',re.I)
TOKEN=re.compile(r'\{\{[^{}]+\}\}')
PARA=re.compile(r'<w:p\b[^>]*>.*?</w:p>',re.S)
TEXT=re.compile(r'(<w:t\b[^>]*>)(.*?)(</w:t>)',re.S)
RULES=[
(re.compile(r'LEX NOVA HQ\s*[–—-]\s*AI GOVERNANCE\s*:',re.I),'AI GOVERNANCE:'),
(re.compile(r'This document is a Review-Ready Draft prepared by Lex Nova HQ\.',re.I),'This document is a Review-Ready Draft.'),
(re.compile(r'This document was architected by Lex Nova HQ as a Review-Ready Draft',re.I),'This document is a Review-Ready Draft'),
(re.compile(r'Lex Nova HQ operates as Legal Architects, not as a law firm, and does not provide legal advice\.',re.I),'The document preparer is a legal architecture provider, not a law firm, and does not provide legal advice.'),
(re.compile(r'Lex Nova HQ is a Legal Architecture consultancy, not a law firm\.',re.I),'The document preparer is a legal architecture provider, not a law firm.'),
(re.compile(r'This document was prepared by Lex Nova HQ, a Commercial Architecture Practice\.',re.I),'This document was prepared as a Review-Ready Draft by a commercial legal architecture provider.'),
(re.compile(r'Lex Nova HQ is not a law firm and does not provide legal advice\.',re.I),'The provider is not a law firm and does not provide legal advice.'),
(re.compile(r'based on Lex Nova HQ[’\']s pre-audited Master Architecture',re.I),'based on a pre-audited legal architecture framework'),
(re.compile(r'For Lex Nova HQ Internal Use Only',re.I),'Internal Use Only'),
(re.compile(r'Lex Nova HQ\s*[—–-]\s*Internal Use Only',re.I),'Internal Use Only'),
(re.compile(r'Lex Nova HQ internal use only',re.I),'Internal use only'),
(re.compile(r'For Lex Nova HQ Delivery Team',re.I),'For Delivery Team'),
(re.compile(r'For Lex Nova HQ delivery team',re.I),'For delivery team'),
(re.compile(r'Lex Nova HQ\s*[—–-]\s*',re.I),'')]

def texts(p):
 with ZipFile(p) as z:return '\n'.join(html.unescape(m.group(2)) for n in z.namelist() if n.startswith('word/') and n.endswith('.xml') for m in TEXT.finditer(z.read(n).decode('utf-8','ignore')))
def span(parts,a,b,r):
 pos=[];c=0
 for i,t in enumerate(parts):pos.append((c,c+len(t),i));c+=len(t)
 sa,_,si=next(x for x in pos if x[0]<=a<x[1]);ea,_,ei=next(x for x in pos if x[0]<b<=x[1])
 pre=parts[si][:a-sa];suf=parts[ei][b-ea:]
 if si==ei:parts[si]=pre+r+suf
 else:
  parts[si]=pre+r
  for i in range(si+1,ei):parts[i]=''
  parts[ei]=suf

def paragraph(x):
 ms=list(TEXT.finditer(x)); parts=[html.unescape(m.group(2)) for m in ms]; changed=0
 while ms:
  joined=''.join(parts); hit=None
  for pat,rep in RULES:
   m=pat.search(joined)
   if m:hit=(m,rep);break
  if not hit:break
  m,rep=hit;span(parts,m.start(),m.end(),rep);changed+=1
 if not changed:return x,0
 out=[];last=0
 for i,m in enumerate(ms):
  out.append(x[last:m.start()]); tag=m.group(1)
  if parts[i] and (parts[i].startswith(' ') or parts[i].endswith(' ')) and 'xml:space=' not in tag:tag=tag[:-1]+' xml:space="preserve">'
  out.append(tag+escape(parts[i])+m.group(3));last=m.end()
 out.append(x[last:]);return ''.join(out),changed

def wordxml(data):
 s=data.decode();count=0
 def f(m):
  nonlocal count
  v,n=paragraph(m.group(0));count+=n;return v
 return PARA.sub(f,s).encode(),count

def patch(p):
 before=TOKEN.findall(texts(p));tmp=p.with_suffix('.tmp.docx');reps=0
 with ZipFile(p) as a,ZipFile(tmp,'w',ZIP_DEFLATED,allowZip64=True) as b:
  for info in a.infolist():
   data=a.read(info.filename)
   if info.filename.startswith('word/') and info.filename.endswith('.xml'):data,n=wordxml(data);reps+=n
   elif info.filename=='word/media/image1.png':data=BANNER
   elif info.filename=='docProps/core.xml':
    s=data.decode();s=re.sub(r'(<dc:creator\b[^>]*>).*?(</dc:creator>)',r'\1\2',s,flags=re.S);s=re.sub(r'(<cp:lastModifiedBy\b[^>]*>).*?(</cp:lastModifiedBy>)',r'\1\2',s,flags=re.S);data=s.encode()
   b.writestr(info,data)
 with ZipFile(tmp) as z:
  assert z.testzip() is None
  xml='\n'.join(z.read(n).decode('utf-8','ignore') for n in z.namelist() if n.endswith(('.xml','.rels')))
  assert not BRAND.search(xml),f'BRAND_RESIDUE:{p.name}'
 assert before==TOKEN.findall(texts(tmp)),f'QR_TOKEN_DRIFT:{p.name}'
 assert reps>=3,f'REPLACEMENT_COUNT_LOW:{p.name}:{reps}'
 tmp.replace(p);return reps,len(before)

def manifest():
 p=TROOT/'TEMPLATE_MANIFEST.yml';s=p.read_text()
 if 'mode: WHITE_LABEL' in s:return
 block=('  branding:\n    mode: WHITE_LABEL\n    provider_branding_present: false\n    neutral_ai_governance_banner: true\n'+f'    neutral_banner_sha256: {hashlib.sha256(BANNER).hexdigest()}\n'+'    creator_metadata_scrubbed: true\n')
 assert '  activation:\n' in s;p.write_text(s.replace('  activation:\n',block+'  activation:\n',1))

assert len(DOCS)==13,f'EXPECTED_13_TEMPLATES:{len(DOCS)}'
rows=[patch(p) for p in DOCS];manifest()
print(f'WHITE_LABEL_AI_TEMPLATES_PASS templates={len(rows)} replacements={sum(x[0] for x in rows)} tokens={sum(x[1] for x in rows)}')
