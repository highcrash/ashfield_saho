/* Smart Home Estimator — pricing core shared by the app, the admin panel and the server.
   Browser: window.EstimateCore.create(catalog, cfg). Node: require('./estimate-core').create(...) */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.EstimateCore=factory();})(this,function(){
'use strict';
// Display names for the spreadsheet categories (product.cat). The admin can override them (catalog.catLabels).
const CAT_LABEL={'LED CV DRIVER (NON SMART)':'LED Driver (Non-smart)','Magnetic track lighting':'Magnetic Track Lighting','Air-conditioning Gateway VRF':'AC Gateway (VRF)','Gang Switch':'Smart Switch','Packages':'Starter Kit','Smart Dashboard':'Control Panel','Dimmer Controller (light)':'Dimmer Controller','Light Strip (RGB)':'RGB Light Strip','Climate Sensor':'Climate & Air Sensor'};
// Products suggested per room type, used when the catalog has no product.rooms data (static fallback).
const SUGGEST={
  whole:['p18','p42','p2','p31','p11'],foyer:['c200','p23','p43','p28','blend'],living:['n7','blend','p16','p19','p71','p36'],
  family:['p38','blend','p16','p19','p71'],dining:['blend','p71','p17','p37'],kitchen:['p21','p20','blend','p13'],
  bedroom:['blend','p16','p19','p14','p71'],child:['blend','p24','p14','p19'],guest:['blend','p16','p19'],
  bath:['p20','p17','blend'],balcony:['p25','p23','blend'],custom:['blend','p71','p19']};

function create(catalog,cfg){
  cfg=cfg||{};catalog=catalog||{groups:[],products:[]};
  const PRODUCTS=catalog.products||[];
  const PMAP=Object.fromEntries(PRODUCTS.map(p=>[p.id,p]));
  const LABELS=Object.assign({},CAT_LABEL,catalog.catLabels||{});
  const catLabel=c=>LABELS[c]||c;
  const fmt=n=>(cfg.currency||'BDT')+' '+Math.round(n).toLocaleString('en-US');
  let suggest=SUGGEST;
  if(PRODUCTS.some(p=>Array.isArray(p.rooms))){suggest={};
    PRODUCTS.forEach(p=>{if(p.hidden||!Array.isArray(p.rooms))return;p.rooms.forEach(r=>{(suggest[r]=suggest[r]||[]).push(p.id);});});}

  function variantOf(p,opt){if(!p||!p.variants)return null;return p.variants.find(v=>v.opt.every((o,i)=>o===(opt||[])[i]))||p.variants[0];}
  // Current catalog price of a line (ignores the price frozen on the line)
  function catalogPrice(it){const p=PMAP[it.pid];if(!p)return null;const v=variantOf(p,it.opt||[]);const pr=v?v.price:p.price;return pr==null?null:+pr;}
  // A line keeps the price it had when it was added (it.price). Lines from older projects have none and use the catalog.
  const hasFrozen=it=>Object.prototype.hasOwnProperty.call(it,'price');
  function lineInfo(it){
    if(it.custom){const c=it.custom;const q=c.unit==='m'?(+it.length||0):(+it.qty||0);
      return {name:c.name,cat:c.cat||'Other',img:null,code:'',model:'',opt:c.note||'',price:+c.price||0,unitLabel:c.unit==='m'?'m':'pcs',qtyText:c.unit==='m'?`${q} m`:`${q}`,billQty:q,amount:q*(+c.price||0),onRequest:false,custom:true,power:'',catalogPrice:null,priceChanged:false,override:false};}
    const p=PMAP[it.pid];if(!p)return null;
    const v=variantOf(p,it.opt||[]);const cp=catalogPrice(it);
    const price=hasFrozen(it)?(it.price==null?null:+it.price):cp;
    let billQty,qtyText,unitLabel;
    if(p.unit.type==='length'){const m=+it.length||0;billQty=Math.ceil(m/p.unit.step-1e-9);if(m<=0)billQty=0;
      unitLabel=p.unit.step===1?'m':`roll (${p.unit.step} m)`;
      qtyText=p.unit.step===1?`${billQty} m`:`${m} m → ${billQty} roll${billQty===1?'':'s'}`;}
    else{billQty=+it.qty||0;qtyText=String(billQty);unitLabel='pcs';}
    return {name:p.name,cat:(v&&v.cat)||p.cat,img:p.img,code:v?v.code:p.code,model:v?v.model:p.model,opt:v?v.opt.join(' · '):'',price,unitLabel,qtyText,billQty,
      amount:price?price*billQty:0,onRequest:!price,custom:false,power:(v&&v.power)||p.power,
      catalogPrice:cp,priceChanged:hasFrozen(it)&&(price||null)!==(cp||null),override:!!it.override,hidden:!!p.hidden};
  }
  const roomTotal=r=>r.items.reduce((s,it)=>{const l=lineInfo(it);return s+(l?l.amount:0);},0);
  const projTotal=pr=>pr&&pr.rooms?pr.rooms.reduce((s,r)=>s+roomTotal(r),0):0;
  const projCount=pr=>pr&&pr.rooms?pr.rooms.reduce((s,r)=>s+r.items.length,0):0;
  function onRequestCount(pr){let n=0;pr.rooms.forEach(r=>r.items.forEach(it=>{const l=lineInfo(it);if(l&&l.onRequest)n++;}));return n;}
  function changedCount(pr){let n=0;pr.rooms.forEach(r=>r.items.forEach(it=>{const l=lineInfo(it);if(l&&l.priceChanged&&!l.override)n++;}));return n;}
  // Freeze current catalog prices on every catalog line (keeps admin overrides unless all=true)
  function reprice(pr,all){pr.rooms.forEach(r=>r.items.forEach(it=>{if(it.custom||!PMAP[it.pid])return;if(it.override&&!all)return;it.price=catalogPrice(it);delete it.override;}));return pr;}
  function priceLabel(p){if(p.variants){const ps=p.variants.map(v=>v.price).filter(Boolean);if(!ps.length)return 'Price on request';const lo=Math.min(...ps),hi=Math.max(...ps);return lo===hi?fmt(lo):'From '+fmt(lo);}return p.price?fmt(p.price):'Price on request';}
  const unitText=p=>p.unit.type==='length'?(p.unit.step===1?'per metre':`per ${p.unit.step} m roll`):'per piece';
  function estNo(p){const d=new Date(p.created||Date.now());return 'EST-'+d.getFullYear().toString().slice(2)+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'-'+String(p.id||'').slice(0,4).toUpperCase();}
  return {PRODUCTS,PMAP,GROUPS:catalog.groups||[],SUGGEST:suggest,catLabel,fmt,variantOf,catalogPrice,lineInfo,roomTotal,projTotal,projCount,onRequestCount,changedCount,reprice,priceLabel,unitText,estNo};
}
return {create,CAT_LABEL,SUGGEST};
});
