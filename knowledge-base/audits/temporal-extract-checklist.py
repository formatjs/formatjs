#!/usr/bin/env python3
"""Finite extraction register from pinned published Temporal HTML; not conformance."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter,defaultdict
import re,json,csv,hashlib,argparse
ap=argparse.ArgumentParser();ap.add_argument('--html',default='/tmp/temporal-published.html');ap.add_argument('--output',default='/tmp/temporal-requirement-checklist.tsv');ap.add_argument('--scope',choices=['core','amendments','all'],default='core');a=ap.parse_args()
path=Path(a.html);raw=path.read_bytes();html=raw.decode();digest=hashlib.sha256(raw).hexdigest();base='https://tc39.es/proposal-temporal/'
biblio=json.loads(re.search(r'let biblio = JSON.parse\(`(.*?)`\);',html,re.S)[1]);meta={e['id']:e for e in biblio['entries'] if e.get('type')=='clause' and re.fullmatch(r'\d+(?:\.\d+)*',str(e.get('number',''))) and (a.scope=='all' or (int(e['number'].split('.')[0])<=13)==(a.scope=='core'))}
class Text:
 def __init__(self,value,parent,order):self.value=value;self.parent=parent;self.order=order
class Node:
 def __init__(self,tag,attrs,parent,order,pos):
  self.tag=tag;self.attrs=dict(attrs);self.parent=parent;self.order=order;self.pos=pos;self.children=[]
 def ancestors(self):
  n=self.parent
  while n:yield n;n=n.parent
 def nearest(self,tag):return next((n for n in self.ancestors() if n.tag==tag),None)
 def owner(self):return next((n for n in [self,*self.ancestors()] if n.tag=='emu-clause' and n.attrs.get('id') in meta),None)
 def active(self):return self.tag!='del' and not any(n.tag=='del' for n in self.ancestors())
 def nodes(self):
  for n in self.children:
   if isinstance(n,Node):yield n;yield from n.nodes()
 def texts(self,skip=None):
  for n in self.children:
   if isinstance(n,Text):yield n
   elif n.active() and not (skip and skip(n)):yield from n.texts(skip)
class Parser(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.root=Node('root',[],None,0,(1,0));self.current=self.root;self.counter=0
 def handle_starttag(self,tag,attrs):
  self.counter+=1;n=Node(tag,attrs,self.current,self.counter,self.getpos());self.current.children.append(n)
  if tag not in {'meta','link','img','hr','br','input','source','wbr','area','base','col','embed','param','track'}:self.current=n
 def handle_endtag(self,tag):
  n=self.current
  while n.parent and n.tag!=tag:n=n.parent
  if n.parent:self.current=n.parent
 def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs);self.handle_endtag(tag)
 def handle_data(self,data):self.counter+=1;self.current.children.append(Text(data,self.current,self.counter))
p=Parser();p.feed(html);nodes=list(p.root.nodes());clauses={n.attrs['id']:n for n in nodes if n.tag=='emu-clause' and n.attrs.get('id') in meta};assert set(clauses)==set(meta)
rows=[];covered=set();block_counts=defaultdict(Counter);diagnostics=[];step_shapes=[];algorithm_total=0

def clean(text):return re.sub(r'\s+',' ',text).strip()
def label(n,depth):
 if depth%3==0:return str(n)
 if depth%3==1:
  s=''
  while n:n,k=divmod(n-1,26);s=chr(97+k)+s
  return s
 out=''
 for v,s in [(1000,'m'),(900,'cm'),(500,'d'),(400,'cd'),(100,'c'),(90,'xc'),(50,'l'),(40,'xl'),(10,'x'),(9,'ix'),(5,'v'),(4,'iv'),(1,'i')]:
  while n>=v:out+=s;n-=v
 return out

def emit(owner,n,kind,key,texts=None,text=None):
 ident=owner.attrs['id'];section=meta[ident]['number'];texts=list(n.texts()) if texts is None else list(texts)
 for t in texts:covered.add(t.order)
 value=clean(''.join(t.value for t in texts)) if text is None else text
 if not value:return
 anchor=base+'#'+n.attrs.get('id',ident)
 rows.append({'id':f'{section}/{key}','section':section,'anchor':anchor,'kind':kind,'requirement_text':value,'status':'unreviewed','source':f'{base} snapshot=2026-11-21 sha256={digest} html_line={n.pos[0]} html_column={n.pos[1]}','evidence':'','_order':n.order})
 block_counts[ident][kind]+=1

for ident,clause in clauses.items():
 section=meta[ident]['number'];heading=next((n for n in clause.nodes() if n.tag=='h1' and n.owner() is clause and n.active()),None)
 emit(clause,heading or clause,'clause_scope','clause',texts=list(heading.texts()) if heading else [],text=f'§{section} {clean(re.sub("<[^>]+>","",meta[ident].get("title",meta[ident].get("titleHTML",""))))}: review complete clause, including prose, attributes, realm/dependency obligations and nonalgorithm content.')
 algs=[n for n in clause.nodes() if n.tag=='emu-alg' and n.owner() is clause and n.active()]
 for ai,alg in enumerate(algs,1):
  algorithm_total+=1;ols=[n for n in alg.nodes() if n.tag=='ol' and n.nearest('emu-alg') is alg and n.nearest('ol') is None]
  # nearest('ol') is normally None at each algorithm's root, but ancestor lists may surround embedded algorithms.
  ols=[n for n in alg.nodes() if n.tag=='ol' and n.nearest('emu-alg') is alg and not any(x.tag=='ol' and x.nearest('emu-alg') is alg for x in n.ancestors()) and n.active()]
  if len(ols)!=1:diagnostics.append({'section':section,'algorithm':ai,'root_ordered_lists':len(ols),'line':alg.pos[0]})
  def walk(ol,path=()):
   count=int(ol.attrs.get('start','1'))
   for li in [n for n in ol.children if isinstance(n,Node) and n.tag=='li' and n.active()]:
    number=int(li.attrs.get('value',count));parts=path+(number,);step='.'.join(label(v,d) for d,v in enumerate(parts));step_shapes.append(parts)
    emit(clause,li,'algorithm_step',f'algorithm-{ai}/step-{step}',texts=li.texts(lambda n:n.tag in ('ol','emu-alg')))
    nested=[n for n in li.nodes() if n.tag=='ol' and n.nearest('li') is li and n.nearest('emu-alg') is alg and n.active()]
    for sub in nested:walk(sub,parts)
    count=number+1
  for ol in ols:walk(ol)
  extra=[t for t in alg.texts() if t.order not in covered and clean(t.value)]
  if extra:emit(clause,alg,'algorithm_nonstep_text',f'algorithm-{ai}/nonstep-text',texts=extra)
 # Explicit prose/list/grammar/table/equation rows, excluding numbered algorithms.
 candidates=[n for n in clause.nodes() if n.owner() is clause and n.active() and not n.nearest('emu-alg')]
 for n in candidates:
  if n.tag=='emu-grammar' and not n.nearest('emu-grammar'):
   k=block_counts[ident]['grammar_block']+1;emit(clause,n,'grammar_block',f'grammar-{k}')
  elif n.tag=='table' and not n.nearest('table'):
   k=block_counts[ident]['table_block']+1;emit(clause,n,'table_block',f'table-{k}')
  elif n.tag in ('p','li','emu-eqn','pre','figcaption'):
   if any(x.tag in ('emu-grammar','table','h1') for x in n.ancestors()):continue
   if n.tag=='p' and n.nearest('li'):continue
   if n.tag in ('emu-eqn','pre') and any(x.tag in ('li','p') for x in n.ancestors()):continue
   texts=[t for t in n.texts(lambda x:x.tag in ('ol','ul','emu-alg')) if t.order not in covered]
   value=clean(''.join(t.value for t in texts))
   if not value:continue
   note=n.nearest('emu-note')
   kind='informative_note' if note else 'attribute_prose' if 'attributes' in value.lower() else 'prose_list_item' if n.tag=='li' else 'equation' if n.tag=='emu-eqn' else 'prose'
   k=block_counts[ident][kind]+1;emit(clause,n,kind,f'{kind}-{k}',texts=texts)
 # No remaining active own-clause text silently discarded: unresolved blocks get explicit rows.
 leftovers=defaultdict(list)
 for t in clause.texts(lambda n:n.tag=='emu-clause'):
  if t.order in covered or not clean(t.value):continue
  # Headings already covered; deleted text excluded by texts().
  parent=t.parent
  while parent.parent and parent.tag not in ('p','li','emu-note','emu-eqn','pre','figcaption','div','emu-clause'):parent=parent.parent
  leftovers[parent].append(t)
 for n,texts in leftovers.items():
  k=block_counts[ident]['unclassified_nonalgorithm_text']+1;emit(clause,n,'unclassified_nonalgorithm_text',f'unclassified-{k}',texts=texts)

rows.sort(key=lambda r:(r['_order'],r['id']))
for r in rows:
 del r['_order']
 if a.scope!='core':
  r['scope']='core' if int(r['section'].split('.')[0])<=13 else 'amendment'
  r['applicability']='pending' if r['scope']=='amendment' else 'in_scope'
assert len({r['id'] for r in rows})==len(rows),'duplicate checklist ids'
# Independent structural count: every active li with an owning emu-alg and ol is a potential numbered step.
active_li=[n for n in nodes if n.tag=='li' and n.active() and n.owner() and n.nearest('emu-alg') and n.nearest('ol') and n.nearest('emu-alg').owner() is n.owner()]
potential_li=active_li
active_li=[n for n in potential_li if clean(''.join(t.value for t in n.texts(lambda x:x.tag in ('ol','emu-alg'))))]
empty_deleted_li=[n for n in potential_li if n not in active_li]
step_rows=[r for r in rows if r['kind']=='algorithm_step'];uncovered_li=[n.pos for n in active_li if not any(t.order in covered for t in n.texts())]
all_text=[t for c in clauses.values() for t in c.texts(lambda n:n.tag=='emu-clause') if clean(t.value)]
missing_text=[{'line':t.parent.pos[0],'text':clean(t.value)[:160]} for t in all_text if t.order not in covered]
out=Path(a.output)
with out.open('w') as f:
 w=csv.DictWriter(f,fieldnames=['id','section','anchor','kind','requirement_text','status','source','evidence']+(['scope','applicability'] if a.scope!='core' else []),delimiter='\t');w.writeheader();w.writerows(rows)
summary={'source':base,'snapshot_retrieved':'2026-11-21','snapshot_sha256':digest,'selected_scope':a.scope,'scope_note':'Core chapters1–13 and amendments14–15 are finite comparison sections; amendment applicability remains pending.','selected_clauses':len(clauses),'core_clauses':sum(int(meta[k]['number'].split('.')[0])<=13 for k in clauses),'amendment_clauses':sum(int(meta[k]['number'].split('.')[0])>=14 for k in clauses),'rows':len(rows),'kind_counts':dict(Counter(r['kind'] for r in rows)),'active_algorithm_blocks':algorithm_total,'numbered_step_rows':len(step_rows),'independent_active_algorithm_list_item_count':len(active_li),'step_count_agrees':len(active_li)==len(step_rows),'empty_or_wholly_deleted_list_items_excluded':len(empty_deleted_li),'max_step_depth':max(map(len,step_shapes)),'algorithm_structure_diagnostics':diagnostics,'uncovered_algorithm_li_positions':uncovered_li,'uncovered_active_nonempty_text_nodes':missing_text,'all_statuses_unreviewed':all(r['status']=='unreviewed' for r in rows),'unreviewed_means':'Checklist row not reconciled against evidence; does not mean implementation absent or broken. Existing working polyfill is baseline.','limits':['Mechanical extraction is not a normative-requirement count or semantic completeness proof.','Each prose/grammar/table block may contain multiple obligations; rows need manual decomposition during review.','Clause gates explicitly retain property-attribute, realm and dependency obligations not mechanically separable.','Nested step labels follow rendered ecmarkup numeric/alpha/roman cycle; counts cross-checked against all active algorithm list items.','Snapshot contains inserted/deleted amendment markup; deleted text excluded, inserted text included. Numbered paths retain published list positions, including gaps left by wholly deleted steps; these empty/deleted items are counted separately.','Unclassified text rows remain explicit review obligations, not silently dropped.','Snapshot is pinned Nov21; live TOC rechecked Nov22 separately, full-body future changes require regeneration.']}
out.with_suffix('.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));out.with_name(out.stem+'-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,indent=2))
