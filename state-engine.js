/* Dependency resolution shared by the bracket UI and validation tests. */
(function(root){
  function participants(data, results, game){
    return game.slots.map(slot=>{
      if(slot.team)return slot.team;
      const previous=data.games.find(g=>g.id===slot.game);
      const winner=results[slot.game];
      if(!winner||!previous)return null;
      return slot.loser?participants(data,results,previous).find(id=>id&&id!==winner)||null:winner;
    });
  }
  function clean(data, input){
    const results={};
    for(const game of data.games){
      const pair=participants(data,results,game);
      if(pair.every(Boolean)&&pair.includes(input[game.id]))results[game.id]=input[game.id];
    }
    return results;
  }
  function select(data, input, id, winner){
    const results={...input};
    const affected=new Set([id]);
    for(const game of data.games){
      if(game.slots.some(s=>affected.has(s.game))){affected.add(game.id);delete results[game.id];}
    }
    if(winner)results[id]=winner;else delete results[id];
    return clean(data,results);
  }
  root.BracketEngine={participants,clean,select};
})(typeof window==='undefined'?globalThis:window);
