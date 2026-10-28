(function(){
'use strict';
const data=window.STATE_DATA, engine=window.BracketEngine;
const officialStateUrl='https://www.mshsaa.org/Activities/DistrictWinners.aspx?alg=57&class=3&year=2026';
const key='mo-volleyball-state-results-2026-v1';
let results=engine.clean(data,data.results||{}),editing=false,status='',selectedDate='all';
try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved)results=engine.clean(data,saved);}catch(e){status='Browser storage is unavailable. Download your results to keep them.';}
const school=id=>data.teams.find(t=>t.team_id===id)?.school||'TBD';
function save(){try{localStorage.setItem(key,JSON.stringify(results));status='Saved in this browser. Download the results file to publish or keep a backup.';}catch(e){status='Could not save in this browser. Download the results file to keep your changes.';}}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function slotLabel(slot){return slot.team?school(slot.team):(slot.loser?'Loser':'Winner')+' of '+slot.game;}
function favoriteGame(g){return engine.participants(data,results,g).some(id=>id&&favs.teams.includes(id));}
function roundGames(round){return data.games.filter(g=>g.round===round&&(selectedDate==='all'||g.date===selectedDate)).sort((a,b)=>Number(favoriteGame(b))-Number(favoriteGame(a)));}
function matchCard(g){const pair=engine.participants(data,results,g),winner=results[g.id];return `<article class="state-match ${favoriteGame(g)?'state-favorite':''}"><div class="head"><strong>${esc(g.round)} · ${g.id}</strong><span class="small">${winner?'Final':'Awaiting result'}</span></div><div class="date">${fmt(g.date,g.time)}</div>${pair.map((id,i)=>`<div class="state-team ${id&&id===winner?'state-winner':''}">${id?`<button type="button" class="match-star" data-favorite-team="${id}" aria-label="${favs.teams.includes(id)?'Remove':'Add'} favorite: ${esc(school(id))}" aria-pressed="${favs.teams.includes(id)}">${favs.teams.includes(id)?'★':'☆'}</button>`:''}<span class="match-school">${esc(id?school(id):slotLabel(g.slots[i]))}</span><span class="match-outcome">${id&&id===winner?'WIN ✓':''}</span></div>`).join('')}${editing?`<label for="pick-${g.id}" class="small">Select winner</label><select id="pick-${g.id}" data-pick="${g.id}" ${pair.every(Boolean)?'':'disabled'}><option value="">No result yet</option>${pair.filter(Boolean).map(id=>`<option value="${id}" ${id===winner?'selected':''}>${esc(school(id))}</option>`).join('')}</select>`:''}</article>`;}
function draw(){
const rounds=['Sectional','State quarterfinal','State semifinal','State championship','Third place'];
$('statepanel').innerHTML=`<div class="card hero"><span class="pill">CLASS 3 · 2026 STATE TOURNAMENT</span><div class="title">Road to the championship</div><p>16 district champions · October 29–November 7</p><p class="small">State bracket reference: <a href="${esc(officialStateUrl)}" target="_blank" rel="noopener">MSHSAA Class 3 state tournament ↗</a>. Quarterfinal times and venues are unconfirmed.</p><div class="row"><button id="editresults" aria-pressed="${editing}">${editing?'Done selecting winners':'Enter match winners'}</button><button id="exportresults">Download results file</button><button id="importresults">Import results file</button><button id="resetresults">Use published results</button></div><input type="file" id="resultsfile" accept=".js,.json" hidden><p class="small">Manual changes stay on this device. To update the public site, replace <strong>data/state-data.js</strong> in your GitHub repository with the downloaded file.</p><p role="status" class="small">${esc(status)}</p></div><nav class="scoreboard-dates" aria-label="Filter tournament games by date"><button type="button" data-match-date="all" aria-pressed="${selectedDate==='all'}">All dates</button>${[...new Set(data.games.map(g=>g.date))].map(date=>`<button type="button" data-match-date="${date}" aria-pressed="${selectedDate===date}">${esc(fmt(date,null).replace(' · Time TBD',''))}</button>`).join('')}</nav><div class="state-grid">${rounds.filter(round=>roundGames(round).length).map(round=>`<section><h2 class="section">${round}</h2>${roundGames(round).map(matchCard).join('')}</section>`).join('')}</div>`;
$('statepanel').querySelectorAll('[data-match-date]').forEach(button=>button.onclick=()=>{selectedDate=button.dataset.matchDate;draw();});
$('editresults').onclick=()=>{editing=!editing;draw();};
$('exportresults').onclick=()=>download('state-data.js','window.STATE_DATA = '+JSON.stringify({...data,results},null,2)+';\n','text/javascript');
$('importresults').onclick=()=>$('resultsfile').click();
$('resultsfile').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;const text=await file.text();const parsed=JSON.parse(text.replace(/^\s*window\.STATE_DATA\s*=\s*/,'').replace(/;\s*$/,''));if(parsed.schema!==1||parsed.season!==data.season||!parsed.results||typeof parsed.results!=='object'||Array.isArray(parsed.results))throw Error('Invalid file');const checked=engine.clean(data,parsed.results);if(JSON.stringify(Object.entries(checked).sort())!==JSON.stringify(Object.entries(parsed.results).sort()))throw Error('Invalid winners or unresolved games');results=checked;save();draw();render();}catch(e){status='Could not import: choose a valid results file downloaded from this bracket.';draw();}};
$('resetresults').onclick=()=>{if(!confirm('Replace this browser’s manual selections with the published results?'))return;results=engine.clean(data,data.results||{});save();draw();render();};
document.querySelectorAll('[data-pick]').forEach(select=>select.onchange=()=>{results=engine.select(data,results,select.dataset.pick,Number(select.value)||null);save();draw();render();});
}
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-favorite-team]');
 if(!button)return;
 const id=Number(button.dataset.favoriteTeam);
 favs.teams=favs.teams.includes(id)?favs.teams.filter(x=>x!==id):[...favs.teams,id];
 saveFavorites();render();
});
document.addEventListener('teamfavoriteschange',draw);
const priorRender=render;
render=function(){
 draw();
 if(mode!=='team'){priorRender();return;}
 const t=teams.find(t=>t.team_id===Number(sel.value));
 const qualifier=data.teams.find(x=>x.team_id===t.team_id);
 let body=`<div class="card hero"><span class="pill">DISTRICT ${t.district}</span><div class="title">${esc(t.school)}</div><p>${qualifier?'District champion · State qualifier':'Did not advance to the state bracket'}</p></div>`;
 if(qualifier){
   const first=data.games.find(g=>g.slots.some(s=>s.team===t.team_id));
   let relevant=new Set([first.id]);
   for(const g of data.games)if(g.slots.some(s=>relevant.has(s.game)))relevant.add(g.id);
   body+='<h2 class="section">State tournament path</h2>';
   let eliminated=false;
   for(const g of data.games.filter(g=>relevant.has(g.id))){
     const pair=engine.participants(data,results,g);
     const isThird=g.id==='P';
     function possibleSlot(slot){
       if(slot.team)return [slot.team];
       const previous=data.games.find(x=>x.id===slot.game),win=results[slot.game];
       if(win)return slot.loser?engine.participants(data,results,previous).filter(id=>id!==win):[win];
       return previous.slots.flatMap(possibleSlot);
     }
     if(!g.slots.flatMap(possibleSlot).includes(t.team_id))continue;
     if(eliminated&&!pair.includes(t.team_id))continue;
     body+=`<div class="card ${favoriteGame(g)?'state-favorite':''}"><p class="small">${pair.includes(t.team_id)?'Confirmed matchup':isThird?'If the team loses its semifinal':'If advancing'}</p>${matchCard(g).replace(/<label[\s\S]*?<\/select>/,'')}</div>`;
     if(results[g.id]&&pair.includes(t.team_id)&&results[g.id]!==t.team_id&&!g.round.includes('semifinal'))eliminated=true;
   }
 }
 $('content').innerHTML=body;showFavorites();updateFavButtons();updateBackButton();currentTeam=Number(sel.value);
};
const style=document.createElement('style');style.textContent='.state-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;align-items:start}.state-match{padding:15px;background:#fff;border:1px solid #ccd8e5;border-radius:12px;margin-bottom:12px}.state-match.state-favorite,.card.state-favorite{background:#fff6d5;border-color:#e5d69c}.state-reference{display:inline-flex;align-items:center;padding:10px 14px;border-radius:8px;text-decoration:none}.scoreboard-dates{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.scoreboard-dates button{background:#fff;color:#193452;border:1px solid #b9c8d8}.scoreboard-dates button[aria-pressed=true]{background:#193452;color:#fff}.state-team{display:flex;align-items:center;gap:8px;padding:10px;border-top:1px solid #e3eaf1}.match-star{background:transparent;color:#946c00;font-size:22px;border:0;padding:3px 6px;flex-shrink:0}.match-school{flex:1}.match-outcome{font-size:11px;font-weight:800;white-space:nowrap}.state-winner{background:#e5f4eb;color:#146039;font-weight:750}.state-match select{margin-top:5px}.row{flex-wrap:wrap}#statepanel{margin-bottom:28px}.state-grid .head{gap:8px;flex-wrap:wrap}';document.head.append(style);
draw();render();
})();
