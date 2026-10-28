#!/usr/bin/env python3
"""Import completed MSHSAA Class 3 state matches without third-party dependencies."""
import argparse
from datetime import datetime, date
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import time
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://www.mshsaa.org/activities/scoreboard.aspx?alg=57&date='

class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []
    def text(self):
        return ' '.join(c if isinstance(c, str) else c.text() for c in self.children).strip()
    def find(self, tag=None, cls=None):
        found = []
        for child in self.children:
            if isinstance(child, Node):
                if (tag is None or child.tag == tag) and (cls is None or cls in child.attrs.get('class', '').split()):
                    found.append(child)
                found.extend(child.find(tag, cls))
        return found

class Page(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Node(); self.stack = [self.root]
        self.feed(html)
    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs); self.stack[-1].children.append(n)
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.stack.append(n)
    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, attrs))
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]; break
    def handle_data(self, text):
        self.stack[-1].children.append(text)

def normalize(name):
    return re.sub(r'[^a-z0-9]', '', name.casefold().replace('saint ', 'st. '))

def round_name(label):
    value = label.casefold()
    if 'class 3' not in value or 'state' not in value: return None
    if 'third place' in value or '3rd place' in value: return 'Third place'
    if 'quarterfinal' in value: return 'State quarterfinal'
    if 'semifinal' in value: return 'State semifinal'
    if 'sectional' in value: return 'Sectional'
    if 'championship' in value or re.search(r'state final\b', value): return 'State championship'
    if 'state tournament' in value: return 'State tournament'
    return None

def parse_page(html, game_date):
    page = Page(html)
    blocks = page.root.find('div', 'scoreboardGame')
    if not blocks and 'rptScoreboardGames' not in html:
        raise ValueError('Scoreboard markup was missing; refusing to replace existing results')
    matches = []
    for block in blocks:
        details = block.find('tr', 'gamedetails')
        if len(details) != 1: continue
        links = details[0].find('a')
        state = [a for a in links if 'districtwinners.aspx' in a.attrs.get('href','').lower()
                 and re.search(r'[?&]class=3(?:&|$)', a.attrs.get('href',''))
                 and re.search(r'[?&]alg=57(?:&|$)', a.attrs.get('href',''))
                 and re.search(r'[?&]year=2026(?:&|$)', a.attrs.get('href',''))]
        if len(state) != 1: continue
        round_ = round_name(state[0].text())
        outcomes = details[0].find('span', 'outcome')
        if not round_ or len(outcomes) != 1 or outcomes[0].text().strip().casefold() != 'final': continue
        names, scores = [], []
        for row in block.find('tr'):
            if 'data-school' not in row.attrs: continue
            ns, ss = row.find('span','name'), row.find('td','score')
            if len(ns) != 1 or len(ss) != 1: continue
            names.append(ns[0].text().strip()); scores.append(ss[0].text().strip())
        if len(names) != 2 or any(normalize(n) in {'','tbd'} for n in names): continue
        if not all(re.fullmatch(r'[0-3]', s) for s in scores): continue
        scores = list(map(int, scores))
        if sorted(scores)[1] != 3 or sorted(scores)[0] >= 3: continue
        matches.append({'round':round_, 'date':game_date, 'names':names, 'scores':scores,
                        'competition_id':block.attrs.get('data-competition'), 'url':URL+game_date.replace('-','')[4:]+game_date[:4]})
    return matches

def participants(data, results, game):
    pair=[]
    for slot in game['slots']:
        if 'team' in slot: pair.append(slot['team']); continue
        previous=next(g for g in data['games'] if g['id']==slot['game'])
        win=results.get(previous['id'])
        if not win: pair.append(None)
        elif slot.get('loser'): pair.append(next((t for t in participants(data,results,previous) if t and t!=win),None))
        else: pair.append(win)
    return pair

def clean(data, results):
    valid={}
    for g in data['games']:
        pair=participants(data,valid,g)
        if all(pair) and results.get(g['id']) in pair: valid[g['id']]=results[g['id']]
    return valid

def merge_matches(data, previous, matches):
    results=dict(previous.get('results',{})); records=dict(previous.get('matches',{}))
    names={normalize(t['school']):t['team_id'] for t in data['teams']}
    # Match by round and both exact normalized school names, never position alone.
    pending=list(matches)
    for game in data['games']:
        pair=participants(data,results,game)
        if not all(pair): continue
        candidates=[m for m in pending if m['round'] in {game['round'],'State tournament'}
                    and sorted(names.get(normalize(n),-1) for n in m['names'])==sorted(pair)]
        if len(candidates)!=1: continue
        m=candidates[0]; ordered=[names[normalize(n)] for n in m['names']]
        winner=ordered[m['scores'].index(3)]
        if results.get(game['id']) and results[game['id']]!=winner:
            affected={game['id']}
            for later in data['games']:
                if any(s.get('game') in affected for s in later['slots']):
                    affected.add(later['id']); results.pop(later['id'],None); records.pop(later['id'],None)
        results[game['id']]=winner
        records[game['id']]={'winner':winner,'teams':ordered,'scores':m['scores'],
                             'source_url':m['url'],'competition_id':m['competition_id']}
    results=clean(data,results)
    records={k:v for k,v in records.items() if results.get(k)==v.get('winner')}
    return {'schema':1,'season':data['season'],'results':results,'matches':records,
            'source':'MSHSAA girls volleyball scoreboard'}

def fetch(url):
    for attempt in range(3):
        try:
            request=Request(url,headers={'User-Agent':'MOVolleyball-results/1.0 (public state tournament tracker)'})
            with urlopen(request,timeout=30) as response:
                content=response.read(4_000_001)
                if len(content)>4_000_000: raise ValueError('Unexpectedly large scoreboard response')
                return content.decode('utf-8-sig')
        except Exception:
            if attempt==2: raise
            time.sleep(2**attempt)

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--fixture-dir',type=Path)
    parser.add_argument('--today',default=datetime.now(ZoneInfo('America/Chicago')).date().isoformat())
    parser.add_argument('--output',type=Path,default=ROOT/'data/official-results.json'); args=parser.parse_args()
    today=date.fromisoformat(args.today)
    data=json.loads(re.sub(r';\s*$','',re.sub(r'^\s*window\.STATE_DATA\s*=\s*','',(ROOT/'data/state-data.js').read_text())))
    previous=json.loads(args.output.read_text()) if args.output.exists() else {}
    dates=sorted({g['date'] for g in data['games'] if date.fromisoformat(g['date'])<=today})
    matches=[]
    for day in dates:
        text=(args.fixture_dir/(day+'.html')).read_text() if args.fixture_dir else fetch(URL+datetime.strptime(day,'%Y-%m-%d').strftime('%m%d%Y'))
        parsed=parse_page(text,day); matches.extend(parsed)
        print(f'{day}: {len(parsed)} completed Class 3 state matches')
    current=merge_matches(data,previous,matches)
    comparable={k:v for k,v in previous.items() if k!='updated_at'}
    if comparable==current:
        print('No result changes'); return
    current['updated_at']=datetime.now(ZoneInfo('UTC')).isoformat(timespec='seconds') if dates else None
    args.output.parent.mkdir(parents=True,exist_ok=True)
    temporary=args.output.with_suffix('.tmp'); temporary.write_text(json.dumps(current,indent=2)+'\n'); temporary.replace(args.output)
    print(f'Saved {len(current["results"])} official results')

if __name__=='__main__': main()
