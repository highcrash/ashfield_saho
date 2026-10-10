// Database: SQLite through Node's built-in node:sqlite (Node 22.13+). One file: storage/app.db
'use strict';
const {DatabaseSync}=require('node:sqlite');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const Core=require('../assets/js/estimate-core.js');

const ROOT=path.resolve(__dirname,'..');
const STORAGE=path.resolve(process.env.STORAGE_DIR||path.join(ROOT,'storage'));
const UPLOADS=path.join(STORAGE,'uploads');
for(const d of ['products','brand'])fs.mkdirSync(path.join(UPLOADS,d),{recursive:true});

const db=new DatabaseSync(path.join(STORAGE,'app.db'));
db.exec(`
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS categories(
  id TEXT PRIMARY KEY, label TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS products(
  id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES categories(id),
  cat TEXT NOT NULL DEFAULT '', name TEXT NOT NULL, blurb TEXT NOT NULL DEFAULT '', specs TEXT NOT NULL DEFAULT '[]',
  power TEXT NOT NULL DEFAULT '', unit TEXT NOT NULL DEFAULT '{"type":"qty"}', img TEXT,
  code TEXT NOT NULL DEFAULT '', model TEXT NOT NULL DEFAULT '', price INTEGER,
  options TEXT, variants TEXT, rooms TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0, updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS clients(
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
  contact_time TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
  phone_key TEXT NOT NULL DEFAULT '', wa_key TEXT NOT NULL DEFAULT '', email_key TEXT NOT NULL DEFAULT '',
  created INTEGER NOT NULL, updated INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS clients_phone ON clients(phone_key);
CREATE INDEX IF NOT EXISTS clients_wa ON clients(wa_key);
CREATE INDEX IF NOT EXISTS clients_email ON clients(email_key);
CREATE TABLE IF NOT EXISTS projects(
  id TEXT PRIMARY KEY, client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL, token_hash TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '', client_name TEXT NOT NULL DEFAULT '', client_phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new', admin_notes TEXT NOT NULL DEFAULT '', data TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0, item_count INTEGER NOT NULL DEFAULT 0, rev INTEGER NOT NULL DEFAULT 1,
  client_deleted INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, updated INTEGER NOT NULL, admin_updated INTEGER);
CREATE INDEX IF NOT EXISTS projects_token ON projects(token_hash);
CREATE INDEX IF NOT EXISTS projects_client ON projects(client_id);
`);

const now=()=>Date.now();
const J=(s,d)=>{if(s==null)return d;try{return JSON.parse(s);}catch(e){return d;}};
function tx(fn){db.exec('BEGIN');try{const r=fn();db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}
const sha256=s=>crypto.createHash('sha256').update(String(s)).digest('hex');

// ---------- settings ----------
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
function getSetting(k,d){const r=db.prepare('SELECT value FROM settings WHERE key=?').get(k);return r?J(r.value,d):d;}
function setSetting(k,v){db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k,JSON.stringify(v));bump();}
function publicSettings(){const s={};for(const k of Object.keys(DEFAULT_SETTINGS))s[k]=getSetting(k,DEFAULT_SETTINGS[k]);
  s.company=Object.assign({},DEFAULT_SETTINGS.company,s.company||{});return s;}

// ---------- catalog ----------
let catalogVersion=0,cache={};
function bump(){catalogVersion++;cache={};}
function productOut(r,catActive){
  const p={id:r.id,group:r.category_id,cat:r.cat,name:r.name,blurb:r.blurb,specs:J(r.specs,[]),power:r.power,unit:J(r.unit,{type:'qty'}),
    img:r.img||null,code:r.code,model:r.model,price:r.price==null?null:Number(r.price),rooms:J(r.rooms,[]),sort:Number(r.sort)};
  const o=J(r.options,null),v=J(r.variants,null);if(o&&o.length&&v&&v.length){p.options=o;p.variants=v;}
  if(!r.active||!catActive)p.hidden=true;
  return p;}
// Catalog in the shape of data/products.js. admin=true adds inactive categories and the active flag.
function getCatalog(admin){
  const key=admin?'admin':'public';if(cache[key])return cache[key];
  const cats=db.prepare('SELECT * FROM categories ORDER BY sort,label').all();
  const act=Object.fromEntries(cats.map(c=>[c.id,!!c.active]));
  const prods=db.prepare('SELECT * FROM products ORDER BY sort,name').all().map(r=>{const p=productOut(r,act[r.category_id]!==false);if(admin)p.active=!!r.active;return p;});
  const last=db.prepare('SELECT MAX(updated) m FROM products').get().m;
  const s=publicSettings();
  const out={updated:last?new Date(Number(last)).toISOString().slice(0,10):'',currency:s.currency||'BDT',
    groups:(admin?cats:cats.filter(c=>c.active)).map(c=>admin?{id:c.id,label:c.label,sort:Number(c.sort),active:!!c.active}:{id:c.id,label:c.label}),
    products:prods,catLabels:s.catLabels||{}};
  cache[key]=out;return out;}
function core(){if(!cache.core)cache.core=Core.create(getCatalog(true),publicSettings());return cache.core;}

// ---------- clients ----------
// Bangladesh numbers: +8801712345678, 008801712345678, 01712345678 and 1712345678 are the same person
function phoneKey(s){let d=String(s||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);if(d.startsWith('880'))d='0'+d.slice(3);
  if(d.length===10&&d[0]==='1')d='0'+d;return d.length>=6?d:'';}
function emailKey(s){s=String(s||'').trim().toLowerCase();return /^\S+@\S+\.\S+$/.test(s)?s:'';}
const CLIENT_FIELDS=[['name','name'],['phone','phone'],['whatsapp','whatsapp'],['email','email'],['address','address'],['contact_time','contactTime']];
const clip=(s,n)=>String(s??'').trim().slice(0,n||200);
function clientKeys(c){return {phone_key:phoneKey(c.phone),wa_key:phoneKey(c.whatsapp),email_key:emailKey(c.email)};}
function findClient(c){
  const k=clientKeys(c);const phones=[k.phone_key,k.wa_key].filter(Boolean);
  for(const ph of phones){const r=db.prepare('SELECT * FROM clients WHERE phone_key=? OR wa_key=? ORDER BY id LIMIT 1').get(ph,ph);if(r)return r;}
  if(k.email_key){const r=db.prepare('SELECT * FROM clients WHERE email_key=? ORDER BY id LIMIT 1').get(k.email_key);if(r)return r;}
  return null;}
// Create or find the client for a project's contact details. Existing client records only get empty fields filled in,
// so edits made in the admin panel are never overwritten by the client's browser.
function linkClient(pc,currentId){
  pc=pc||{};const name=clip(pc.name,120);
  const k=clientKeys(pc);
  let row=currentId?db.prepare('SELECT * FROM clients WHERE id=?').get(currentId):null;
  if(!row){if(!name||!(k.phone_key||k.wa_key||k.email_key))return currentId||null;row=findClient(pc);}
  const t=now();
  if(!row){
    const r=db.prepare(`INSERT INTO clients(name,phone,whatsapp,email,address,contact_time,phone_key,wa_key,email_key,created,updated)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(name,clip(pc.phone,40),clip(pc.whatsapp,40),clip(pc.email,120),clip(pc.address,200),clip(pc.contactTime,120),k.phone_key,k.wa_key,k.email_key,t,t);
    return Number(r.lastInsertRowid);}
  const upd={};for(const [col,key] of CLIENT_FIELDS){const v=clip(pc[key],col==='address'?200:120);if(!row[col]&&v)upd[col]=v;}
  if(Object.keys(upd).length){const merged=Object.assign({},row,upd);Object.assign(upd,clientKeys({phone:merged.phone,whatsapp:merged.whatsapp,email:merged.email}));upd.updated=t;
    db.prepare(`UPDATE clients SET ${Object.keys(upd).map(c=>c+'=?').join(',')} WHERE id=?`).run(...Object.values(upd),row.id);}
  return Number(row.id);}
function updateClient(id,c){
  const cur=db.prepare('SELECT * FROM clients WHERE id=?').get(id);if(!cur)return null;
  const v={name:clip(c.name??cur.name,120),phone:clip(c.phone??cur.phone,40),whatsapp:clip(c.whatsapp??cur.whatsapp,40),email:clip(c.email??cur.email,120),
    address:clip(c.address??cur.address,200),contact_time:clip(c.contact_time??cur.contact_time,120),notes:String(c.notes??cur.notes).slice(0,5000)};
  Object.assign(v,clientKeys(v));v.updated=now();
  db.prepare(`UPDATE clients SET ${Object.keys(v).map(k=>k+'=?').join(',')} WHERE id=?`).run(...Object.values(v),id);
  return db.prepare('SELECT * FROM clients WHERE id=?').get(id);}
function createClient(c){
  const v={name:clip(c.name,120),phone:clip(c.phone,40),whatsapp:clip(c.whatsapp,40),email:clip(c.email,120),address:clip(c.address,200),contact_time:clip(c.contact_time,120),notes:String(c.notes||'').slice(0,5000)};
  if(!v.name)throw new HttpError(400,'Client name is required.');
  Object.assign(v,clientKeys(v));v.created=v.updated=now();
  const r=db.prepare(`INSERT INTO clients(${Object.keys(v).join(',')}) VALUES(${Object.keys(v).map(()=>'?').join(',')})`).run(...Object.values(v));
  return db.prepare('SELECT * FROM clients WHERE id=?').get(Number(r.lastInsertRowid));}

// ---------- projects ----------
class HttpError extends Error{constructor(status,msg){super(msg);this.status=status;}}
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
function summarize(p){const c=core();return {total:Math.round(c.projTotal(p)),count:c.projCount(p)};}
function projectRow(id){return db.prepare('SELECT * FROM projects WHERE id=?').get(id);}
function projectOut(r,withData){
  const o={id:r.id,client_id:r.client_id==null?null:Number(r.client_id),name:r.name,client_name:r.client_name,client_phone:r.client_phone,status:r.status,
    admin_notes:r.admin_notes,total:Number(r.total),item_count:Number(r.item_count),rev:Number(r.rev),client_deleted:!!r.client_deleted,
    created:Number(r.created),updated:Number(r.updated),admin_updated:r.admin_updated==null?null:Number(r.admin_updated)};
  if(withData)o.data=J(r.data,null);return o;}
// Public save from a client's browser
function savePublic(id,token,project){
  if(!PROJECT_ID.test(id))throw new HttpError(400,'Bad project id.');
  if(typeof token!=='string'||token.length<16||token.length>200)throw new HttpError(400,'Missing token.');
  const p=cleanProject(project,id);const th=sha256(token);
  return tx(()=>{
    const row=projectRow(id);
    if(row&&row.token_hash!==th)throw new HttpError(403,'This project belongs to another browser.');
    const rev=row?Number(row.rev)+1:1;p.rev=rev;
    const s=summarize(p);const cid=linkClient(p.client,row&&row.client_id);const t=now();
    if(row)db.prepare(`UPDATE projects SET data=?,name=?,client_name=?,client_phone=?,total=?,item_count=?,client_id=?,rev=?,client_deleted=0,updated=? WHERE id=?`)
      .run(JSON.stringify(p),p.name,clip(p.client.name,120),clip(p.client.phone||p.client.whatsapp,40),s.total,s.count,cid,rev,t,id);
    else db.prepare(`INSERT INTO projects(id,client_id,token_hash,name,client_name,client_phone,data,total,item_count,rev,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id,cid,th,p.name,clip(p.client.name,120),clip(p.client.phone||p.client.whatsapp,40),JSON.stringify(p),s.total,s.count,rev,t,t);
    return {rev,total:s.total};});
}
function listForToken(token){
  if(typeof token!=='string'||token.length<16)return [];
  return db.prepare('SELECT data FROM projects WHERE token_hash=? AND client_deleted=0').all(sha256(token)).map(r=>J(r.data,null)).filter(Boolean);}
function deletePublic(id,token){const row=projectRow(id);if(!row)return;if(row.token_hash!==sha256(token))throw new HttpError(403,'Not your project.');
  db.prepare('UPDATE projects SET client_deleted=1,updated=? WHERE id=?').run(now(),id);}
// Admin save: data and/or status/notes
const STATUSES=['new','contacted','quoted','won','lost'];
function saveAdmin(id,body){
  return tx(()=>{
    const row=projectRow(id);if(!row)throw new HttpError(404,'Budget not found.');
    const set={};const t=now();
    if(body.data){const p=cleanProject(body.data,id);p.rev=Number(row.rev)+1;p.updated=t;const s=summarize(p);
      Object.assign(set,{data:JSON.stringify(p),name:p.name,client_name:clip(p.client.name,120),client_phone:clip(p.client.phone||p.client.whatsapp,40),
        total:s.total,item_count:s.count,rev:p.rev,client_id:linkClient(p.client,row.client_id),admin_updated:t,updated:t});}
    if(body.status!=null){if(!STATUSES.includes(body.status))throw new HttpError(400,'Unknown status.');set.status=body.status;}
    if(body.admin_notes!=null)set.admin_notes=String(body.admin_notes).slice(0,10000);
    if(body.client_id!==undefined){const cid=body.client_id==null?null:Number(body.client_id);
      if(cid!=null&&!db.prepare('SELECT id FROM clients WHERE id=?').get(cid))throw new HttpError(400,'Client not found.');set.client_id=cid;}
    if(Object.keys(set).length)db.prepare(`UPDATE projects SET ${Object.keys(set).map(k=>k+'=?').join(',')} WHERE id=?`).run(...Object.values(set),id);
    return projectOut(projectRow(id),true);});
}
// Re-freeze every catalog line at today's catalog price (all=true also replaces admin overrides)
function reprice(id,all){const row=projectRow(id);if(!row)throw new HttpError(404,'Budget not found.');
  const p=J(row.data,null);core().reprice(p,!!all);return saveAdmin(id,{data:p});}

module.exports={db,tx,J,now,sha256,STORAGE,UPLOADS,ROOT,HttpError,STATUSES,DEFAULT_SETTINGS,
  getSetting,setSetting,publicSettings,getCatalog,core,bump,productOut,
  phoneKey,emailKey,linkClient,updateClient,createClient,
  projectRow,projectOut,savePublic,listForToken,deletePublic,saveAdmin,reprice,summarize,PROJECT_ID};
