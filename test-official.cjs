const assert=require('assert/strict'),boot=require('./tests/site-harness.cjs');
const official={schema:1,season:'2026-2027',results:{S3:31},matches:{S3:{winner:31,teams:[31,25],scores:[3,1]}},updated_at:'2026-10-30T00:00:00Z'};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const page=boot({official});await tick();
 assert(page.node('statepanel').innerHTML.includes('<span class="match-outcome">3</span>'));
 assert(page.node('statepanel').innerHTML.includes('Latest result change:'));
 const manual=boot({official,saved:{'mo-volleyball-state-overrides-2026-v2':JSON.stringify({S3:25})}});await tick();
 assert(manual.node('statepanel').innerHTML.includes('You are viewing manual selections'));
 assert(!manual.node('statepanel').innerHTML.includes('<span class="match-outcome">3</span>'));
 manual.node('resetresults').onclick();await tick();
 assert(manual.node('statepanel').innerHTML.includes('<span class="match-outcome">3</span>'));
 assert(!manual.storage['mo-volleyball-state-overrides-2026-v2']);
 const legacy=boot({official,saved:{'mo-volleyball-state-results-2026-v1':JSON.stringify({S3:25})}});await tick();
 assert(legacy.node('statepanel').innerHTML.includes('<span class="match-outcome">3</span>'));
 console.log('PASS: official scores load, manual overrides stay separate, reset restores official scores, legacy saves do not mask imports');
})().catch(e=>{console.error(e);process.exitCode=1;});
