const fs=require('fs'),vm=require('vm'),path=require('path');
module.exports=function boot({saved={},official}={}){
 const nodes=new Map(),listeners={},storage={...saved};
 function node(id){if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',hidden:false,dataset:{},events:{},classList:{toggle(){}},addEventListener(type,fn){this.events[type]=fn;},querySelectorAll(){return [];}});return nodes.get(id);}
 const context={console,Event:class{constructor(type){this.type=type;}},document:{getElementById:node,querySelectorAll(){return [];},createElement(){return {};},head:{append(){}},addEventListener(type,fn){listeners[type]=fn;},dispatchEvent(event){listeners[event.type]?.();}},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},location:{hash:'',href:'http://example.test/'},history:{replaceState(){}},navigator:{},setTimeout,URL,Blob,confirm:()=>true};
 context.window=context;context.addEventListener=()=>{};context.scrollTo=()=>{};
 if(official)context.fetch=async()=>({ok:true,json:async()=>official});
 vm.createContext(context);
 const root=path.join(__dirname,'..'),html=fs.readFileSync(root+'/index.html','utf8');
 for(const match of html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g))vm.runInContext(match[1]?fs.readFileSync(root+'/'+match[1].split('?')[0],'utf8'):match[2],context);
 return {node,listeners,storage,html,context};
};
