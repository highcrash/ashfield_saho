// Data layer: settings, catalog, clients, projects. Works on PostgreSQL or SQLite through sql.js.
// Call `await init()` once before use.
'use strict';
const path=require('path'),crypto=require('crypto');
const Core=require('../assets/js/estimate-core.js');
const sql=require('./sql');
const makeFiles=require('./files');

const ROOT=path.resolve(__dirname,'..');
const STORAGE=path.resolve(process.env.STORAGE_DIR||path.join(ROOT,'storage'));
const UPLOADS=path.join(STORAGE,'uploads');
const files=makeFiles(UPLOADS);
let Q=null;                                    // query interface (sql.js)
const q=()=>{if(!Q)throw new Error('Database not initialised');return Q;};

const now=()=>Date.now();
const J=(s,d)=>{if(s==null)return d;try{return JSON.parse(s);}catch(e){return d;}};
const sha256=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
class HttpError extends Error{constructor(status,msg){super(msg);this.status=status;}}

// ---------- settings (cached in memory; reads stay synchronous) ----------
// Keys starting with "_" are private (password hash, session secret) and never leave the server.
const DEFAULT_SETTINGS={
  appName:'Smart Home Estimator',
  company:{name:'',tagline:'',phone:'',whatsapp:'',email:'',website:'',address:'',logo:''},
  currency:'BDT',
  defaultNotes:'Prices are retail estimates in Bangladeshi Taka (BDT). Items marked "Price on request" are not included in the total. Final quotation may change after a site survey.',
  estimateValidityDays:30,
  showExampleProject:true,
  pdfFooter:'',
  catLabels:{}
};
let SETTINGS={};
async function loadSettings(){const rows=await q().all('SELECT key,value FROM settings');SETTINGS=Object.fromEntries(rows.map(r=>[r.key,J(r.value,null)]));}
const getSetting=(k,d)=>k in SETTINGS&&SETTINGS[k]!==null?SETTINGS[k]:d;
async function setSetting(k,v){
  await q().run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',k,JSON.stringify(v));
  SETTINGS[k]=v;bump();}
function publicSettings(){const s={};for(const k of Object.keys(DEFAULT_SETTINGS))s[k]=getSetting(k,DEFAULT_SETTINGS[k]);
  s.company=Object.assign({},DEFAULT_SETTINGS.company,s.company||{});return s;}

// ---------- catalog (cached until something changes) ----------
let cache={};
function bump(){cache={};}
function productOut(r,catActive){
  const p={id:r.id,group:r.category_id,cat:r.cat,name:r.name,blurb:r.blurb,specs:J(r.specs,[]),power:r.power,unit:J(r.unit,{type:'qty'}),
    img:r.img||null,code:r.code,model:r.model,price:r.price==null?null:Number(r.price),rooms:J(r.rooms,[]),sort:Number(r.sort)};
  const o=J(r.options,null),v=J(r.variants,null);if(o&&o.length&&v&&v.length){p.options=o;p.variants=v;}
  if(!Number(r.active)||!catActive)p.hidden=true;
  return p;}
// Catalog in the shape of data/products.js. admin=true adds inactive categories and the active flag.
async function getCatalog(admin){
  const key=admin?'admin':'public';if(cache[key])return cache[key];
  const cats=await q().all('SELECT * FROM categories ORDER BY sort,label');
  const act=Object.fromEntries(cats.map(c=>[c.id,!!Number(c.active)]));
  const prods=(await q().all('SELECT * FROM products ORDER BY sort,name')).map(r=>{const p=productOut(r,act[r.category_id]!==false);if(admin)p.active=!!Number(r.active);return p;});
  const last=(await q().get('SELECT MAX(updated) AS m FROM products')).m;
  const s=publicSettings();
  const out={updated:last?new Date(Number(last)).toISOString().slice(0,10):'',currency:s.currency||'BDT',
    groups:(admin?cats:cats.filter(c=>Number(c.active))).map(c=>admin?{id:c.id,label:c.label,sort:Number(c.sort),active:!!Number(c.active)}:{id:c.id,label:c.label}),
    products:prods,catLabels:s.catLabels||{}};
  cache[key]=out;return out;}
async function core(){if(!cache.core)cache.core=Core.create(await getCatalog(true),publicSettings());return cache.core;}

// ---------- clients ----------
// Bangladesh numbers: +8801712345678, 008801712345678, 01712345678 and 1712345678 are the same person
function phoneKey(s){let d=String(s||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);if(d.startsWith('880'))d='0'+d.slice(3);
  if(d.length===10&&d[0]==='1')d='0'+d;return d.length>=6?d:'';}
function emailKey(s){s=String(s||'').trim().toLowerCase();return /^\S+@\S+\.\S+$/.test(s)?s:'';}
const CLIENT_FIELDS=[['name','name'],['phone','phone'],['whatsapp','whatsapp'],['email','email'],['address','address'],['contact_time','contactTime']];
const clip=(s,n)=>String(s??'').trim().slice(0,n||200);
function clientKeys(c){return {phone_key:phoneKey(c.phone),wa_key:phoneKey(c.whatsapp),email_key:emailKey(c.email)};}
const cols=o=>Object.keys(o);
const insertSql=(table,o,ret)=>`INSERT INTO ${table}(${cols(o).join(',')}) VALUES(${cols(o).map(()=>'?').join(',')})${ret?' RETURNING '+ret:''}`;
const updateSql=(table,o,where)=>`UPDATE ${table} SET ${cols(o).map(c=>c+'=?').join(',')} WHERE ${where}`;
async function findClient(c,db){
  const k=clientKeys(c);
  for(const ph of [k.phone_key,k.wa_key].filter(Boolean)){const r=await db.get('SELECT * FROM clients WHERE phone_key=? OR wa_key=? ORDER BY id LIMIT 1',ph,ph);if(r)return r;}
  if(k.email_key){const r=await db.get('SELECT * FROM clients WHERE email_key=? ORDER BY id LIMIT 1',k.email_key);if(r)return r;}
  return null;}
// Create or find the client for a project's contact details. Existing client records only get empty fields filled in,
// so edits made in the admin panel are never overwritten by the client's browser.
async function linkClient(pc,currentId,db=q()){
  pc=pc||{};const name=clip(pc.name,120);const k=clientKeys(pc);
  let row=currentId?await db.get('SELECT * FROM clients WHERE id=?',currentId):null;
  if(!row){if(!name||!(k.phone_key||k.wa_key||k.email_key))return currentId||null;row=await findClient(pc,db);}
  const t=now();
  if(!row){
    const v={name,phone:clip(pc.phone,40),whatsapp:clip(pc.whatsapp,40),email:clip(pc.email,120),address:clip(pc.address,200),contact_time:clip(pc.contactTime,120),...k,created:t,updated:t};
    return Number((await db.get(insertSql('clients',v,'id'),...Object.values(v))).id);}
  const upd={};for(const [col,key] of CLIENT_FIELDS){const v=clip(pc[key],col==='address'?200:120);if(!row[col]&&v)upd[col]=v;}
  if(Object.keys(upd).length){const merged=Object.assign({},row,upd);Object.assign(upd,clientKeys(merged),{updated:t});
    await db.run(updateSql('clients',upd,'id=?'),...Object.values(upd),row.id);}
  return Number(row.id);}
const clientRow=id=>q().get('SELECT * FROM clients WHERE id=?',id);
async function updateClient(id,c){
  const cur=await clientRow(id);if(!cur)return null;
  const v={name:clip(c.name??cur.name,120),phone:clip(c.phone??cur.phone,40),whatsapp:clip(c.whatsapp??cur.whatsapp,40),email:clip(c.email??cur.email,120),
    address:clip(c.address??cur.address,200),contact_time:clip(c.contact_time??cur.contact_time,120),notes:String(c.notes??cur.notes).slice(0,5000)};
  Object.assign(v,clientKeys(v));v.updated=now();
  await q().run(updateSql('clients',v,'id=?'),...Object.values(v),id);return clientRow(id);}
async function createClient(c){
  const v={name:clip(c.name,120),phone:clip(c.phone,40),whatsapp:clip(c.whatsapp,40),email:clip(c.email,120),address:clip(c.address,200),contact_time:clip(c.contact_time,120),notes:String(c.notes||'').slice(0,5000)};
  if(!v.name)throw new HttpError(400,'Client name is required.');
  Object.assign(v,clientKeys(v));v.created=v.updated=now();
  const r=await q().get(insertSql('clients',v,'id'),...Object.values(v));return clientRow(Number(r.id));}

// ---------- projects ----------
const PROJECT_ID=/^[A-Za-z0-9_-]{6,48}$/;
// Light shape check + size limits on what a browser sends; prices are recomputed here, never trusted from the client
function cleanProject(p,id){
  if(!p||typeof p!=='object'||!Array.isArray(p.rooms))throw new HttpError(400,'Not a project.');
  if(p.rooms.length>80)throw new HttpError(400,'Too many rooms.');
  let n=0;for(const r of p.rooms){if(!r||!Array.isArray(r.items))throw new HttpError(400,'Bad room.');n+=r.items.length;}
  if(n>1500)throw new HttpError(400,'Too many items.');
  p.id=id;p.name=clip(p.name,120);p.client=Object.assign({name:'',phone:'',whatsapp:'',email:'',address:'',contactTime:''},p.client||{});
  p.apt=Object.assign({building:'',address:'',unit:'',floor:'',size:''},p.apt||{});
  return p;}
async function summarize(p){const c=await core();return {total:Math.round(c.projTotal(p)),count:c.projCount(p)};}
const projectRow=(id,db=q())=>db.get('SELECT * FROM projects WHERE id=?',id);
function projectOut(r,withData){
  const o={id:r.id,client_id:r.client_id==null?null:Number(r.client_id),name:r.name,client_name:r.client_name,client_phone:r.client_phone,status:r.status,
    admin_notes:r.admin_notes,total:Number(r.total),item_count:Number(r.item_count),rev:Number(r.rev),client_deleted:!!Number(r.client_deleted),
    created:Number(r.created),updated:Number(r.updated),admin_updated:r.admin_updated==null?null:Number(r.admin_updated)};
  if(withData)o.data=J(r.data,null);return o;}
// Price rule: budgets with status "new" follow the product list — every catalog line gets today's price, except prices
// the admin typed (it.override). Other statuses keep their prices. Names, photos and details always come from the
// live catalog (estimate-core lineInfo), whatever the status. Returns {lineId: newPrice} for the lines that changed.
function followCatalog(p,c){const changed={};
  p.rooms.forEach(r=>r.items.forEach(it=>{if(it.custom||it.override||!c.PMAP[it.pid])return;const cp=c.catalogPrice(it);
    if(!Object.prototype.hasOwnProperty.call(it,'price')||(it.price??null)!==(cp??null)){it.price=cp;changed[it.id]=cp;}}));
  return changed;}
const anyKeys=o=>Object.keys(o).length>0;
// After a product change (and on start): bring every "new" budget up to the current prices. Bumps rev so the
// client's browser picks up the change; leaves "updated" alone so the budgets list order does not jump.
async function followCatalogAll(){
  const c=await core();let n=0;
  for(const r of await q().all("SELECT id,data,rev FROM projects WHERE status='new'")){
    const p=J(r.data,null);if(!p||!Array.isArray(p.rooms))continue;
    if(!anyKeys(followCatalog(p,c)))continue;
    const rev=Number(r.rev)+1;p.rev=rev;
    const res=await q().run('UPDATE projects SET data=?,total=?,rev=? WHERE id=? AND rev=?',JSON.stringify(p),Math.round(c.projTotal(p)),rev,r.id,Number(r.rev));
    n+=res.changes?1:0;}
  return n;}
// Public save from a client's browser
async function savePublic(id,token,project){
  if(!PROJECT_ID.test(id))throw new HttpError(400,'Bad project id.');
  if(typeof token!=='string'||token.length<16||token.length>200)throw new HttpError(400,'Missing token.');
  const p=cleanProject(project,id);const th=sha256(token);const s0=await core();
  return q().tx(async db=>{
    const row=await projectRow(id,db);
    if(row&&row.token_hash!==th)throw new HttpError(403,'This project belongs to another browser.');
    const rev=row?Number(row.rev)+1:1;p.rev=rev;
    // A "new" budget always uses today's prices, even if this browser loaded the catalog before a price change
    const prices=!row||row.status==='new'?followCatalog(p,s0):{};
    const total=Math.round(s0.projTotal(p)),count=s0.projCount(p);
    const cid=await linkClient(p.client,row&&row.client_id,db);const t=now();
    const v={data:JSON.stringify(p),name:p.name,client_name:clip(p.client.name,120),client_phone:clip(p.client.phone||p.client.whatsapp,40),total,item_count:count,client_id:cid,rev};
    if(row)await db.run(updateSql('projects',Object.assign(v,{client_deleted:0,updated:t}),'id=?'),...Object.values(v),id);
    else{Object.assign(v,{id,token_hash:th,created:t,updated:t});await db.run(insertSql('projects',v),...Object.values(v));}
    return anyKeys(prices)?{rev,total,prices}:{rev,total};});
}
async function listForToken(token){
  if(typeof token!=='string'||token.length<16)return [];
  return (await q().all('SELECT data FROM projects WHERE token_hash=? AND client_deleted=0',sha256(token))).map(r=>J(r.data,null)).filter(Boolean);}
async function deletePublic(id,token){const row=await projectRow(id);if(!row)return;if(row.token_hash!==sha256(token))throw new HttpError(403,'Not your project.');
  await q().run('UPDATE projects SET client_deleted=1,updated=? WHERE id=?',now(),id);}
// Admin save: data and/or status/notes/client link
const STATUSES=['new','contacted','quoted','won','lost'];
async function saveAdmin(id,body){
  const c0=await core();
  return q().tx(async db=>{
    const row=await projectRow(id,db);if(!row)throw new HttpError(404,'Budget not found.');
    const set={};const t=now();let prices={};
    if(body.status!=null&&!STATUSES.includes(body.status))throw new HttpError(400,'Unknown status.');
    const status=body.status??row.status;
    // Setting a budget back to "new" (or editing one that is "new") brings it to today's prices
    let data=body.data?cleanProject(body.data,id):(status==='new'&&row.status!=='new'?J(row.data,null):null);
    if(data&&status==='new')prices=followCatalog(data,c0);
    if(data&&!body.data&&!anyKeys(prices))data=null;
    if(data){const p=data;p.rev=Number(row.rev)+1;if(body.data)p.updated=t;
      Object.assign(set,{data:JSON.stringify(p),name:p.name,client_name:clip(p.client.name,120),client_phone:clip(p.client.phone||p.client.whatsapp,40),
        total:Math.round(c0.projTotal(p)),item_count:c0.projCount(p),rev:p.rev,client_id:await linkClient(p.client,row.client_id,db)});
      if(body.data)Object.assign(set,{admin_updated:t,updated:t});}
    if(body.status!=null)set.status=body.status;
    if(body.admin_notes!=null)set.admin_notes=String(body.admin_notes).slice(0,10000);
    if(body.client_id!==undefined){const cid=body.client_id==null?null:Number(body.client_id);
      if(cid!=null&&!await db.get('SELECT id FROM clients WHERE id=?',cid))throw new HttpError(400,'Client not found.');set.client_id=cid;}
    if(Object.keys(set).length)await db.run(updateSql('projects',set,'id=?'),...Object.values(set),id);
    const out=projectOut(await projectRow(id,db),true);if(anyKeys(prices))out.prices=prices;return out;});
}
// Re-freeze every catalog line at today's catalog price (all=true also replaces admin overrides)
async function reprice(id,all){const row=await projectRow(id);if(!row)throw new HttpError(404,'Budget not found.');
  const p=J(row.data,null);(await core()).reprice(p,!!all);return saveAdmin(id,{data:p});}

async function init(){if(Q)return Q;Q=await sql.open(STORAGE);await loadSettings();return Q;}
// Re-read settings now and then, so a second app instance picks up changes (password, branding)
function startSettingsRefresh(ms){setInterval(()=>loadSettings().then(bump).catch(e=>console.error('Settings refresh failed:',e.message)),ms||60000).unref();}

module.exports={init,q,files,J,now,sha256,STORAGE,UPLOADS,ROOT,HttpError,STATUSES,DEFAULT_SETTINGS,
  getSetting,setSetting,publicSettings,loadSettings,startSettingsRefresh,getCatalog,core,bump,productOut,insertSql,updateSql,
  phoneKey,emailKey,linkClient,updateClient,createClient,clientRow,
  projectRow,projectOut,savePublic,followCatalogAll,listForToken,deletePublic,saveAdmin,reprice,summarize,PROJECT_ID};
