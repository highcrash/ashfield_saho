// Seeds the database from data/products.js and assets/js/config.js (the files the Python build writes).
//   node seed.js                      first start: fills an empty database (server.js runs this automatically)
//   node seed.js --new-only [file]    later: adds products/categories whose ids are not in the database yet;
//                                     never changes products already there (the admin panel owns them)
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const D=require('./db');
const Core=require('../assets/js/estimate-core.js');

function loadWindowFile(file){const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});return sandbox.window;}

async function insertProducts(catalog,onlyNew){
  const t=D.now();let addedCats=0,addedProds=0;
  const roomsOf={};for(const [room,ids] of Object.entries(Core.SUGGEST))ids.forEach(id=>{(roomsOf[id]=roomsOf[id]||[]).push(room);});
  const maxSort=Number((await D.q().get('SELECT COALESCE(MAX(sort),0) AS m FROM products')).m);
  await D.q().tx(async db=>{
    for(const [i,g] of catalog.groups.entries()){if(await db.get('SELECT id FROM categories WHERE id=?',g.id))continue;
      await db.run('INSERT INTO categories(id,label,sort,active) VALUES(?,?,?,1)',g.id,g.label,(i+1)*10);addedCats++;}
    for(const [i,p] of catalog.products.entries()){if(await db.get('SELECT id FROM products WHERE id=?',p.id))continue;
      const row={id:p.id,category_id:p.group,cat:p.cat||'',name:p.name,blurb:p.blurb||'',specs:JSON.stringify(p.specs||[]),power:p.power||'',
        unit:JSON.stringify(p.unit||{type:'qty'}),img:p.img||null,code:String(p.code||''),model:String(p.model||''),price:p.price==null?null:Math.round(p.price),
        options:p.options?JSON.stringify(p.options):null,variants:p.variants?JSON.stringify(p.variants):null,rooms:JSON.stringify(roomsOf[p.id]||[]),
        active:1,sort:onlyNew?maxSort+(i+1)*10:(i+1)*10,updated:t};
      await db.run(D.insertSql('products',row),...Object.values(row));addedProds++;}
  });
  D.bump();return {addedCats,addedProds};}

async function seedIfEmpty(){
  if(Number((await D.q().get('SELECT COUNT(*) AS n FROM categories')).n)>0)return false;
  const cat=loadWindowFile(path.join(D.ROOT,'data','products.js')).CATALOG;
  const cfg=loadWindowFile(path.join(D.ROOT,'assets','js','config.js')).APP_CONFIG||{};
  const r=await insertProducts(cat,false);
  for(const k of Object.keys(D.DEFAULT_SETTINGS))if(cfg[k]!==undefined)await D.setSetting(k,cfg[k]);
  await D.setSetting('catLabels',Object.assign({},Core.CAT_LABEL));
  console.log(`  Seeded ${r.addedCats} categories and ${r.addedProds} products from data/products.js`);
  return true;}

if(require.main===module){
  (async()=>{
    await D.init();const args=process.argv.slice(2);
    if(args[0]==='--new-only'){
      const file=path.resolve(args[1]||path.join(D.ROOT,'data','products.js'));
      const r=await insertProducts(loadWindowFile(file).CATALOG,true);
      console.log(`Added ${r.addedCats} new categories and ${r.addedProds} new products from ${file}. Existing products were not changed.`);
    }else if(!await seedIfEmpty())console.log('The database already has products. Use --new-only to add new ones.');
    await D.q().close();
  })().catch(e=>{console.error(e.message);process.exit(1);});
}
module.exports={seedIfEmpty};
