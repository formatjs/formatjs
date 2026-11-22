# Arithmetic provider finite proof notebook

Reviewed 2026-11-22. Exact-integer mathematical analysis used by
[provider chronology audit](temporal-arithmetic-provider-chronology-audit.md).
These expressions record finite proof premises and outputs, not execution of
production TS/Rust or an independent calendar-authority oracle. They do not
replace Bazel conformance tests. Source equations and binary64 correspondence
need the separate line-by-line review in that audit.

## Hebrew finite domain

```python
from collections import Counter

def months(y): return (235*y-234)//19
def leap(y): return (7*y+1)%19<7
def delay(y):
 m=months(y)
 d=29*m+(12084+13753*m)//25920
 return d+((3*(d+1))%7<3)
def start(y):
 p=delay(y)
 return -2092590+p+(2 if delay(y+1)-p==356 else 1 if p-delay(y-1)==382 else 0)

counts=Counter(); bad=[]; inverse=0
for y in range(-400000,400001):
 length=start(y+1)-start(y); is_leap=leap(y); count=13 if is_leap else 12
 counts[length]+=1
 if months(y+1)-months(y)!=count: bad.append((y,'serial'))
 total=0
 for ordinal in range(1,count+1):
  shape=ordinal+(not is_leap and ordinal>=6)
  days=29 if shape in [4,7,9,11,13] else (30 if length%10==5 else 29) if shape==2 else (29 if length%10==3 else 30) if shape==3 else 30
  total+=days
  code=(5,True) if is_leap and ordinal==6 else (ordinal-(is_leap and ordinal>6),False)
  resolved=6 if code==(5,True) else code[0]+(is_leap and code[0]>=6)
  if resolved!=ordinal: bad.append((y,'identity',ordinal))
  inverse+=1
 if total!=length or length not in ([383,384,385] if is_leap else [353,354,355]): bad.append((y,'length',length,total))
print({'years':800001,'month_identities':inverse,'year_lengths':dict(sorted(counts.items())),'failures':bad[:10],'failure_count':len(bad),'domain_start':start(-400000),'domain_end_exclusive':start(400001)})
def locate(epoch):
 low=-400000; high=400001
 while low+1<high:
  mid=(low+high)//2
  if start(mid)<=epoch: low=mid
  else: high=mid
 return low
lo=locate(-110000000); hi=locate(110000000)
min_delta=100; max_delta=-100
for y in range(lo,hi+1):
 for epoch in [max(-110000000,start(y)),min(110000000,start(y+1)-1)]:
  estimate=((epoch+2092590)*492480)//179876755+1
  min_delta=min(min_delta,estimate-y); max_delta=max(max_delta,estimate-y)
print({'raw_epoch_hebrew_year_min':lo,'raw_epoch_hebrew_year_max':hi,'estimate_minus_exact_year_min':min_delta,'estimate_minus_exact_year_max':max_delta})
```

Recorded output: 800001 years, 9894749 month identities, zero failures.
Year lengths/counts: 353/80321, 354/194348, 355/230595, 383/123776,
384/42105, 385/128856. Outer starts: −148191690 and144006128.
Raw containing years: −295436..306896; inverse estimate error−1..+1.

## Other arithmetic periods

```python
from collections import Counter

def greg_start(y): return 365*(y-1970)+(y-1969)//4-(y-1901)//100+(y-1601)//400

def start(c,y):
 if c=='coptic': return 1824665-2440588+365*y+y//4
 if c in ['ethiopic','ethioaa']:
  z=y-(5500 if c=='ethioaa' else 0)
  return 1723856-2440588+365*z+z//4
 if c=='indian': return greg_start(y+78)+80
 if c in ['islamic-civil','islamic-tbla']: return 1948440-2440588-(c=='islamic-tbla')+354*(y-1)+(3+11*y)//30
 return 1948320-2440588+365*(y-1)+(8*y+21)//33

def locate(c,e):
 lo=-400000; hi=400001
 while lo+1<hi:
  mid=(lo+hi)//2
  if start(c,mid)<=e: lo=mid
  else: hi=mid
 return lo

def civil(e):
 lo=-400100; hi=400100
 while lo+1<hi:
  mid=(lo+hi)//2
  if greg_start(mid)<=e: lo=mid
  else: hi=mid
 return lo

def estimate(c,e):
 jd=e+2440588
 if c=='coptic':return (4*(jd-1824665)+3)//1461
 if c in ['ethiopic','ethioaa']:return (4*(jd-1723856)+3)//1461+(5500 if c=='ethioaa' else 0)
 if c=='indian':return civil(e)-78
 if c in ['islamic-civil','islamic-tbla']:return (30*(jd-1948440+(c=='islamic-tbla'))+10646)//10631
 return 1+(33*(jd-1948320)+3)//12053

for c,period,days in [('coptic',4,1461),('ethiopic',4,1461),('ethioaa',4,1461),('indian',400,146097),('islamic-civil',30,10631),('islamic-tbla',30,10631),('persian',33,12053)]:
 counts=Counter(); errors=[]; failed=[]
 for y in range(-period,period):
  length=start(c,y+1)-start(c,y); counts[length]+=1
  if start(c,y+period)-start(c,y)!=days:failed.append((y,'period'))
  if c in ['coptic','ethiopic','ethioaa']: months=[30]*12+[length-360]
  elif c=='indian':months=[30+(greg_start(y+79)-greg_start(y+78)==366)]+[31]*5+[30]*6
  elif c in ['islamic-civil','islamic-tbla']:months=[30 if m%2 or (m==12 and length==355) else 29 for m in range(1,13)]
  else:months=[31]*6+[30]*5+[length-336]
  if min(months)<=0 or sum(months)!=length:failed.append((y,'partition'))
  # Estimate monotone within each year; extrema occur at endpoints.
  for e in [start(c,y),start(c,y+1)-1]:
   errors.append(estimate(c,e)-y)
   if estimate(c,e+days)!=estimate(c,e)+period:failed.append((y,'estimate_period'))
 print(dict(calendar=c,period_years=period,period_days=days,year_lengths=dict(counts),estimate_minus_year=(min(errors),max(errors)),raw_years=(locate(c,-110000000),locate(c,110000000)),failures=failed))
```

Recorded output: no failed period, estimate-period or positive-partition checks.
Coptic/Ethiopic/Ethioaa, Islamic and Persian estimates have error0; Indian0..+1.
Raw endpoints and numeric bounds are recorded in the chronology audit.
