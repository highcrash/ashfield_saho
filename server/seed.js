// Seeds the database from data/products.js and assets/js/config.js (the files the Python build writes).
//   node seed.js                      first start: fills an empty database (server.js runs this automatically)
//   node seed.js --new-only [file]    later: adds products/categories whose ids are not in the database yet;
//                                     never changes products already there (the admin panel owns them)
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const D=require('./db');
const Core=require('../assets/js/estimate-core.js');

function loadWindowFile(file){const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});return sandbox.window;}

function insertProducts(catalog,onlyNew){
  const t=D.now();let addedCats=0,addedProds=0;
  const roomsOf={};for(const [room,ids] of Object.entries(Core.SUGGEST))ids.forEach(id=>{(roomsOf[id]=roomsOf[id]||[]).push(room);});
  const hasCat=D.db.prepare('SELECT 1 FROM categories WHERE id=?'),hasProd=D.db.prepare('SELECT 1 FROM products WHERE id=?');
  const maxSort=D.db.prepare('SELECT COALESCE(MAX(sort),0) m FROM products').get().m;
  D.tx(()=>{
    catalog.groups.forEach((g,i)=>{if(hasCat.get(g.id))return;
      D.db.prepare('INSERT INTO categories(id,label,sort,active) VALUES(?,?,?,1)').run(g.id,g.label,(i+1)*10);addedCats++;});
    catalog.products.forEach((p,i)=>{if(hasProd.get(p.id))return;
      D.db.prepare(`INSERT INTO products(id,category_id,cat,name,blurb,specs,power,unit,img,code,model,price,options,variants,rooms,active,sort,updated)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`).run(
        p.id,p.group,p.cat||'',p.name,p.blurb||'',JSON.stringify(p.specs||[]),p.power||'',JSON.stringify(p.unit||{type:'qty'}),p.img||null,
        String(p.code||''),String(p.model||''),p.price==null?null:Math.round(p.price),
        p.options?JSON.stringify(p.options):null,p.variants?JSON.stringify(p.variants):null,JSON.stringify(roomsOf[p.id]||[]),
        onlyNew?Number(maxSort)+(i+1)*10:(i+1)*10,t);addedProds++;});
  });
  D.bump();return {addedCats,addedProds};}

function seedIfEmpty(){
  if(D.db.prepare('SELECT COUNT(*) n FROM categories').get().n>0)return false;
  const cat=loadWindowFile(path.join(D.ROOT,'data','products.js')).CATALOG;
  const cfg=loadWindowFile(path.join(D.ROOT,'assets','js','config.js')).APP_CONFIG||{};
  const r=insertProducts(cat,false);
  for(const k of Object.keys(D.DEFAULT_SETTINGS))if(cfg[k]!==undefined)D.setSetting(k,cfg[k]);
  D.setSetting('catLabels',Object.assign({},Core.CAT_LABEL));
  console.log(`  Seeded ${r.addedCats} categories and ${r.addedProds} products from data/products.js`);
  return true;}

if(require.main===module){
  const args=process.argv.slice(2);
  if(args[0]==='--new-only'){
    const file=path.resolve(args[1]||path.join(D.ROOT,'data','products.js'));
    const r=insertProducts(loadWindowFile(file).CATALOG,true);
    console.log(`Added ${r.addedCats} new categories and ${r.addedProds} new products from ${file}. Existing products were not changed.`);
  }else if(!seedIfEmpty())console.log('The database already has products. Use --new-only to add new ones.');
}
module.exports={seedIfEmpty};
