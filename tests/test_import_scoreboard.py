import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('importer',ROOT/'scripts/import_scoreboard.py')
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
DATA=json.loads((ROOT/'data/state-data.js').read_text().split('=',1)[1].strip().removesuffix(';'))

def card(a='St. Francis Borgia',b='Lutheran St. Charles',sa='3',sb='1',outcome='Final',label='Class 3 State Tournament',cls=3):
    return f'''<div class="scoreboardGame" data-competition="example-1"><table>
    <tr data-school="544"><td><span class="name">{a}</span></td><td class="score">{sa}</td></tr>
    <tr data-school="225"><td><span class="name">{b}</span></td><td class="score">{sb}</td></tr>
    <tr class="gamedetails"><td><a href="/Activities/DistrictWinners.aspx?alg=57&amp;class={cls}&amp;year=2026">{label}, </a><span>Washington</span><span class="outcome">{outcome}</span></td></tr></table></div>'''

def match(game,results,reverse=False):
    pair=m.participants(DATA,results,game)
    if reverse: pair.reverse()
    names=[next(t['school'] for t in DATA['teams'] if t['team_id']==id_) for id_ in pair]
    return {'names':names,'scores':[3,1],'round':game['round'],'date':game['date'],'url':'https://www.mshsaa.org/example','competition_id':game['id']}

class ImportTests(unittest.TestCase):
    def test_generic_state_label_and_reversed_home_away(self):
        parsed=m.parse_page(card(),'2026-10-29')
        self.assertEqual(len(parsed),1)
        merged=m.merge_matches(DATA,{},parsed)
        self.assertEqual(merged['results'],{'S3':31})
        self.assertEqual(merged['matches']['S3']['scores'],[3,1])
        self.assertEqual(parsed[0]['url'],m.URL+'10292026')

    def test_nonfinal_incomplete_wrong_class_and_impossible_scores(self):
        for change in [{'outcome':'6:30 PM'},{'outcome':'In Progress'},{'sa':'2','sb':'1'},
                       {'sa':'3','sb':''},{'sa':'3','sb':'3'},{'sa':'4'},{'a':'TBD'},
                       {'cls':4},{'label':'Class 3 District Final'}]:
            with self.subTest(change=change):self.assertEqual(m.parse_page(card(**change),'2026-10-29'),[])

    def test_normalized_names_and_unknown_opponent(self):
        self.assertEqual(m.merge_matches(DATA,{},m.parse_page(card(a='Saint Francis Borgia'),'2026-10-29'))['results'],{'S3':31})
        self.assertEqual(m.merge_matches(DATA,{},m.parse_page(card(a='Other school'),'2026-10-29'))['results'],{})

    def test_all_rounds_and_third_place(self):
        results={}; matches=[]
        for game in DATA['games']:
            current=match(game,results); matches.append(current)
            results[game['id']]=next(t['team_id'] for t in DATA['teams'] if t['school']==current['names'][0])
        imported=m.merge_matches(DATA,{},list(reversed(matches)))
        self.assertEqual(imported['results'],results)
        self.assertEqual(len(imported['results']),16)
        third=DATA['games'][-1]
        self.assertNotIn(results['M1'],m.participants(DATA,results,third))

    def test_official_correction_clears_affected_results_only(self):
        results={}; matches=[]
        for game in DATA['games']:
            current=match(game,results); matches.append(current)
            results[game['id']]=next(t['team_id'] for t in DATA['teams'] if t['school']==current['names'][0])
        old=m.merge_matches(DATA,{},matches)
        corrected=match(DATA['games'][0],{},True)
        new=m.merge_matches(DATA,old,[corrected])
        for game_id in ['Q1','M1','F','P']:self.assertNotIn(game_id,new['results'])
        self.assertEqual(new['results']['M2'],old['results']['M2'])
        self.assertEqual(new['results']['S1'],7)
        self.assertNotIn('F',new['matches'])

    def test_empty_page_preserves_results_and_bad_markup_fails(self):
        old={'results':{'S3':31},'matches':{}}
        self.assertEqual(m.merge_matches(DATA,old,[])['results'],old['results'])
        with self.assertRaises(ValueError):m.parse_page('<html>Access denied</html>','2026-10-29')

    def test_conflicting_duplicate_matches_are_ignored(self):
        matches=m.parse_page(card()+card(sa='1',sb='3'),'2026-10-29')
        self.assertEqual(m.merge_matches(DATA,{},matches)['results'],{})

if __name__=='__main__':unittest.main()
