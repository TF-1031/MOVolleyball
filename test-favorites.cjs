// Execute the actual page scripts and favorite-button handler with a minimal DOM.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const nodes=new Map(),listeners={};
function node(id){if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',hidden:false,dataset:{},events:{},classList:{toggle(){}},addEventListener(type,fn){this.events[type]=fn;},querySelectorAll(){return [];}});return nodes.get(id);}
const storage={};
const context={console,Event:class{constructor(type){this.type=type;}},document:{getElementById:node,querySelectorAll(){return [];},createElement(){return {};},head:{append(){}},addEventListener(type,fn){listeners[type]=fn;},dispatchEvent(event){listeners[event.type]?.();}},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},location:{hash:'',href:'http://example.test/'},history:{replaceState(){}},navigator:{},setTimeout,URL,Blob,confirm:()=>true};
context.window=context;context.addEventListener=()=>{};context.scrollTo=()=>{};
vm.createContext(context);
const html=fs.readFileSync(__dirname+'/index.html','utf8');
for(const match of html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g))vm.runInContext(match[1]?fs.readFileSync(__dirname+'/'+match[1].split('?')[0],'utf8'):match[2],context);
assert(!node('statepanel').innerHTML.includes('state-match state-favorite'));
node('starteam').events.click();
assert(node('statepanel').innerHTML.includes('state-match state-favorite'));
assert(node('content').innerHTML.includes('card state-favorite'));
const sectionals=node('statepanel').innerHTML.split('<h2 class="section">Sectional</h2>')[1];
assert(sectionals.indexOf('Sectional · S3')<sectionals.indexOf('Sectional · S1'));
node('starteam').events.click();
assert(!node('statepanel').innerHTML.includes('state-match state-favorite'));
assert(!html.includes('id="districtbtn"'));
assert(html.includes('DistrictWinners.aspx?alg=57&amp;class=3&amp;year=2026'));
listeners.click({target:{closest(){return {dataset:{favoriteTeam:'31'}};}}});
assert(node('statepanel').innerHTML.includes('state-match state-favorite'));
assert(node('statepanel').innerHTML.includes('data-favorite-team="31" aria-label="Remove favorite: St. Francis Borgia" aria-pressed="true"'));
assert(node('statepanel').innerHTML.includes('data-match-date="2026-10-29"'));
listeners.click({target:{closest(){return {dataset:{favoriteTeam:'31'}};}}});
assert(!node('statepanel').innerHTML.includes('state-match state-favorite'));
console.log('PASS: actual favorite click highlights main bracket and team-path containers, sorts games, clears highlight on removal, and uses state reference');
