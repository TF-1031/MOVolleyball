const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
global.window=global;require('./state-engine.js');vm.runInThisContext(fs.readFileSync(__dirname+'/data/state-data.js','utf8'));
const d=STATE_DATA,e=BracketEngine;
let r={};
assert.equal(d.teams.length,16);assert.equal(d.games.length,16);
for(const g of d.games){const pair=e.participants(d,r,g);assert(pair.every(Boolean));r=e.select(d,r,g.id,pair[0]);}
assert.equal(Object.keys(r).length,16);
assert.notEqual(e.participants(d,r,d.games.find(g=>g.id==='P'))[0],r.M1);
const changed=e.select(d,r,'S1',d.games[0].slots[1].team);
for(const id of ['Q1','M1','F','P'])assert.equal(changed[id],undefined);
assert.equal(changed.Q2,r.Q2);assert.equal(changed.M2,r.M2);
assert.deepEqual(e.clean(d,{F:999,S1:999}),{});
const reset=e.select(d,r,'S1',null);assert.equal(reset.S1,undefined);assert.equal(reset.F,undefined);
assert.deepEqual(e.clean(d,JSON.parse(JSON.stringify(r))),r);
const html=fs.readFileSync(__dirname+'/index.html','utf8');
for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
console.log('PASS: all rounds, third-place losers, correction cascade, clearing, invalid results, JSON roundtrip, inline syntax');
