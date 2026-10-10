// Admin API (all routes need the admin session cookie except login/logout/me)
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const D=require('./db');
const auth=require('./auth');
const {db,HttpError}=D;

const clip=(s,n)=>String(s??'').trim().slice(0,n);
const int=(v,min,max,def)=>{const n=Math.round(Number(v));return Number.isFinite(n)?Math.min(max,Math.max(min,n)):def;};
const slug=s=>String(s||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24)||'item';
const ROOMS=['whole','foyer','living','family','dining','kitchen','bedroom','child','guest','bath','balcony','custom'];
const IMG_PATH=/^(images\/products|uploads\/products)\/[\w.-]+\.(jpg|jpeg|png|webp)$/;
const LOGO_PATH=/^(images|uploads\/brand)\/[\w.-]+\.(jpg|jpeg|png|webp|svg)$/;

// ---------- validation ----------
function cleanPrice(v){if(v===''||v==null)return null;const n=Number(v);if(!Number.isFinite(n)||n<0||n>1e9)throw new HttpError(400,'Price must be a positive number in BDT, or empty for "Price on request".');return Math.round(n);}
function cleanProduct(b){
  const name=clip(b.name,160);if(!name)throw new HttpError(400,'Product name is required.');
  const category_id=String(b.group||'');if(!db.prepare('SELECT 1 FROM categories WHERE id=?').get(category_id))throw new HttpError(400,'Choose a category.');
  const unit=b.unit&&b.unit.type==='length'?{type:'length',step:int(b.unit.step,1,1000,1)}:{type:'qty'};
  const specs=(Array.isArray(b.specs)?b.specs:[]).map(s=>clip(s,80)).filter(Boolean).slice(0,6);
  const rooms=(Array.isArray(b.rooms)?b.rooms:[]).filter(r=>ROOMS.includes(r));
  const img=b.img?String(b.img):null;if(img&&!IMG_PATH.test(img))throw new HttpError(400,'Upload the image again.');
  let options=null,variants=null;
  const opts=(Array.isArray(b.options)?b.options:[]).map(o=>({label:clip(o&&o.label,40),choices:[...new Set((Array.isArray(o&&o.choices)?o.choices:[]).map(c=>clip(c,60)).filter(Boolean))]})).filter(o=>o.label&&o.choices.length);
  if(opts.length){
    const vs=(Array.isArray(b.variants)?b.variants:[]).map(v=>{const opt=(Array.isArray(v.opt)?v.opt:[]).map(c=>clip(c,60));
      if(opt.length!==opts.length||opt.some((c,i)=>!opts[i].choices.includes(c)))return null;
      const out={opt,code:clip(v.code,40),model:clip(v.model,80),price:cleanPrice(v.price)};
      if(v.cat)out.cat=clip(v.cat,80);if(v.power)out.power=clip(v.power,120);return out;}).filter(Boolean);
    if(!vs.length)throw new HttpError(400,'Add at least one option combination with its price.');
    options=opts;variants=vs;}
  return {category_id,cat:clip(b.cat,80),name,blurb:clip(b.blurb,500),specs:JSON.stringify(specs),power:clip(b.power,120),unit:JSON.stringify(unit),img,
    code:clip(b.code,40),model:clip(b.model,80),price:variants?(variants.map(v=>v.price).filter(p=>p!=null).sort((a,c)=>a-c)[0]??null):cleanPrice(b.price),
    options:options?JSON.stringify(options):null,variants:variants?JSON.stringify(variants):null,rooms:JSON.stringify(rooms),
    active:b.active===false?0:1,sort:int(b.sort,-1e6,1e6,0),updated:Date.now()};
}
function cleanSettings(b){
  const out={};const c=b.company||{};
  if(b.appName!=null)out.appName=clip(b.appName,60)||'Smart Home Estimator';
  if(b.company){const logo=clip(c.logo,200);if(logo&&!LOGO_PATH.test(logo))throw new HttpError(400,'Upload the logo again.');
    out.company={name:clip(c.name,100),tagline:clip(c.tagline,120),phone:clip(c.phone,40),whatsapp:String(c.whatsapp||'').replace(/\D/g,'').slice(0,16),
      email:clip(c.email,120),website:clip(c.website,120),address:clip(c.address,240),logo};}
  if(b.currency!=null)out.currency=clip(b.currency,8)||'BDT';
  if(b.defaultNotes!=null)out.defaultNotes=String(b.defaultNotes).slice(0,3000);
  if(b.estimateValidityDays!=null)out.estimateValidityDays=int(b.estimateValidityDays,0,365,30);
  if(b.showExampleProject!=null)out.showExampleProject=!!b.showExampleProject;
  if(b.pdfFooter!=null)out.pdfFooter=clip(b.pdfFooter,200);
  if(b.catLabels&&typeof b.catLabels==='object'){const m={};for(const [k,v] of Object.entries(b.catLabels)){const kk=clip(k,80),vv=clip(v,80);if(kk&&vv&&kk!==vv)m[kk]=vv;}out.catLabels=m;}
  return out;}

// ---------- CSV ----------
function csvCell(v){let s=String(v??'');if(/^[=@]/.test(s)||/^[+-][^\d\s]/.test(s))s="'"+s;return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
const csv=rows=>'﻿'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');
const day=t=>t?new Date(Number(t)).toISOString().slice(0,10):'';

module.exports=function({route,send,limited}){
  // ---------- session ----------
  route('GET','/api/admin/me',req=>({admin:auth.isAdmin(req)}),{open:true});
  route('POST','/api/admin/login',(req,res,{body,ip})=>{
    if(limited('login:'+ip,10,15*60000))throw new HttpError(429,'Too many attempts. Try again in 15 minutes.');
    if(!auth.login(req,res,body.password))throw new HttpError(401,'Wrong password.');return {ok:true};},{open:true});
  route('POST','/api/admin/logout',(req,res)=>{auth.logout(req,res);return {ok:true};},{open:true});
  route('POST','/api/admin/password',(req,res,{body})=>{const err=auth.changePassword(body.current,body.next);if(err)throw new HttpError(400,err);
    auth.login(req,res,body.next);return {ok:true};});

  // ---------- dashboard ----------
  route('GET','/api/admin/summary',()=>{
    const week=Date.now()-7*864e5;
    return {
      defaultPassword:auth.isDefaultPassword(),
      byStatus:db.prepare('SELECT status,COUNT(*) n,COALESCE(SUM(total),0) value FROM projects GROUP BY status').all(),
      newThisWeek:db.prepare('SELECT COUNT(*) n FROM projects WHERE created>?').get(week).n,
      projects:db.prepare('SELECT COUNT(*) n FROM projects').get().n,
      clients:db.prepare('SELECT COUNT(*) n FROM clients').get().n,
      products:db.prepare('SELECT COUNT(*) n FROM products WHERE active=1').get().n,
      latest:db.prepare('SELECT * FROM projects ORDER BY updated DESC LIMIT 10').all().map(r=>D.projectOut(r))};});

  // ---------- settings ----------
  route('GET','/api/admin/settings',()=>D.publicSettings());
  route('PUT','/api/admin/settings',(req,res,{body})=>{const s=cleanSettings(body);
    if(s.company){s.company=Object.assign({},D.publicSettings().company,s.company);}
    for(const [k,v] of Object.entries(s))D.setSetting(k,v);return D.publicSettings();});

  // ---------- catalog ----------
  route('GET','/api/admin/catalog',()=>D.getCatalog(true));
  route('POST','/api/admin/categories',(req,res,{body})=>{
    const label=clip(body.label,60);if(!label)throw new HttpError(400,'Category name is required.');
    let id=slug(label),i=2;while(db.prepare('SELECT 1 FROM categories WHERE id=?').get(id))id=slug(label)+'-'+(i++);
    const sort=db.prepare('SELECT COALESCE(MAX(sort),0)+10 s FROM categories').get().s;
    db.prepare('INSERT INTO categories(id,label,sort,active) VALUES(?,?,?,1)').run(id,label,sort);D.bump();return D.getCatalog(true);});
  route('PUT','/api/admin/categories/:id',(req,res,{params,body})=>{
    const c=db.prepare('SELECT * FROM categories WHERE id=?').get(params.id);if(!c)throw new HttpError(404,'Category not found.');
    const label=body.label!=null?clip(body.label,60):c.label;if(!label)throw new HttpError(400,'Category name is required.');
    db.prepare('UPDATE categories SET label=?,active=?,sort=? WHERE id=?').run(label,body.active==null?c.active:(body.active?1:0),body.sort==null?c.sort:int(body.sort,-1e6,1e6,0),params.id);
    D.bump();return D.getCatalog(true);});
  route('POST','/api/admin/categories/reorder',(req,res,{body})=>{
    const ids=Array.isArray(body.ids)?body.ids:[];D.tx(()=>ids.forEach((id,i)=>db.prepare('UPDATE categories SET sort=? WHERE id=?').run((i+1)*10,String(id))));
    D.bump();return D.getCatalog(true);});
  route('POST','/api/admin/products',(req,res,{body})=>{
    const p=cleanProduct(body);let id;do{id='x-'+slug(p.name).slice(0,20)+'-'+crypto.randomBytes(2).toString('hex');}while(db.prepare('SELECT 1 FROM products WHERE id=?').get(id));
    if(!body.sort)p.sort=db.prepare('SELECT COALESCE(MAX(sort),0)+10 s FROM products WHERE category_id=?').get(p.category_id).s;
    const cols=Object.keys(p);db.prepare(`INSERT INTO products(id,${cols.join(',')}) VALUES(?,${cols.map(()=>'?').join(',')})`).run(id,...Object.values(p));
    D.bump();return {id,catalog:D.getCatalog(true)};});
  // Product ids never change: saved budgets refer to them
  route('PUT','/api/admin/products/:id',(req,res,{params,body})=>{
    if(!db.prepare('SELECT 1 FROM products WHERE id=?').get(params.id))throw new HttpError(404,'Product not found.');
    const p=cleanProduct(body);db.prepare(`UPDATE products SET ${Object.keys(p).map(k=>k+'=?').join(',')} WHERE id=?`).run(...Object.values(p),params.id);
    D.bump();return {id:params.id,catalog:D.getCatalog(true)};});
  route('PUT','/api/admin/products/:id/active',(req,res,{params,body})=>{
    const r=db.prepare('UPDATE products SET active=?,updated=? WHERE id=?').run(body.active?1:0,Date.now(),params.id);
    if(!r.changes)throw new HttpError(404,'Product not found.');D.bump();return D.getCatalog(true);});

  // Images arrive as data URLs, already resized in the browser (no image library needed here)
  route('POST','/api/admin/upload',(req,res,{body})=>{
    const m=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.dataUrl||''));
    if(!m)throw new HttpError(400,'Upload a JPG, PNG or WebP image.');
    const buf=Buffer.from(m[2],'base64');if(buf.length>5*1024*1024)throw new HttpError(413,'Image is larger than 5 MB.');
    const magic={jpeg:b=>b[0]===0xFF&&b[1]===0xD8,png:b=>b.slice(0,4).toString('hex')==='89504e47',webp:b=>b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP'};
    if(!magic[m[1]](buf))throw new HttpError(400,'That file is not a valid image.');
    const dir=body.kind==='logo'?'brand':'products';const ext=m[1]==='jpeg'?'jpg':m[1];
    const name=`${slug(body.name||dir)}-${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(D.UPLOADS,dir,name),buf);return {url:`uploads/${dir}/${name}`};},{limit:8*1024*1024});

  // ---------- budgets (projects) ----------
  route('GET','/api/admin/projects',(req,res,{query})=>{
    const w=[],a=[];
    if(query.status&&D.STATUSES.includes(query.status)){w.push('status=?');a.push(query.status);}
    if(query.client){w.push('client_id=?');a.push(Number(query.client));}
    if(query.deleted!=='1'&&!query.client){w.push('client_deleted=0');}
    if(query.q){const q='%'+String(query.q).trim().toLowerCase()+'%';w.push('(lower(name) LIKE ? OR lower(client_name) LIKE ? OR client_phone LIKE ? OR lower(id) LIKE ?)');a.push(q,q,q,q);}
    return {projects:db.prepare(`SELECT * FROM projects ${w.length?'WHERE '+w.join(' AND '):''} ORDER BY updated DESC LIMIT 1000`).all(...a).map(r=>D.projectOut(r))};});
  route('GET','/api/admin/projects/:id',(req,res,{params})=>{
    const r=D.projectRow(params.id);if(!r)throw new HttpError(404,'Budget not found.');
    const client=r.client_id?db.prepare('SELECT * FROM clients WHERE id=?').get(r.client_id):null;
    return {project:D.projectOut(r,true),client};});
  route('PUT','/api/admin/projects/:id',(req,res,{params,body})=>{const p=D.saveAdmin(params.id,body);return {ok:true,rev:p.rev,project:p};},{limit:1024*1024});
  route('POST','/api/admin/projects/:id/reprice',(req,res,{params,body})=>({project:D.reprice(params.id,!!body.all)}));
  route('DELETE','/api/admin/projects/:id',(req,res,{params})=>{db.prepare('DELETE FROM projects WHERE id=?').run(params.id);return {ok:true};});

  // ---------- clients ----------
  const CLIENT_LIST=`SELECT c.*,COUNT(p.id) projects,COALESCE(SUM(p.total),0) value,MAX(p.updated) last FROM clients c LEFT JOIN projects p ON p.client_id=c.id`;
  route('GET','/api/admin/clients',(req,res,{query})=>{
    const w=[],a=[];if(query.q){const q='%'+String(query.q).trim().toLowerCase()+'%';w.push('(lower(c.name) LIKE ? OR c.phone LIKE ? OR c.whatsapp LIKE ? OR lower(c.email) LIKE ? OR lower(c.address) LIKE ?)');a.push(q,q,q,q,q);}
    return {clients:db.prepare(`${CLIENT_LIST} ${w.length?'WHERE '+w.join(' AND '):''} GROUP BY c.id ORDER BY COALESCE(MAX(p.updated),c.updated) DESC LIMIT 2000`).all(...a)};});
  route('GET','/api/admin/clients/:id',(req,res,{params})=>{
    const c=db.prepare('SELECT * FROM clients WHERE id=?').get(Number(params.id));if(!c)throw new HttpError(404,'Client not found.');
    return {client:c,projects:db.prepare('SELECT * FROM projects WHERE client_id=? ORDER BY updated DESC').all(c.id).map(r=>D.projectOut(r))};});
  route('POST','/api/admin/clients',(req,res,{body})=>({client:D.createClient(body)}));
  route('PUT','/api/admin/clients/:id',(req,res,{params,body})=>{const c=D.updateClient(Number(params.id),body);if(!c)throw new HttpError(404,'Client not found.');return {client:c};});
  route('DELETE','/api/admin/clients/:id',(req,res,{params})=>{db.prepare('DELETE FROM clients WHERE id=?').run(Number(params.id));return {ok:true};});

  // ---------- exports ----------
  route('GET','/api/admin/export/clients.csv',(req,res)=>{
    const rows=db.prepare(`${CLIENT_LIST} GROUP BY c.id ORDER BY c.id`).all();
    send(res,200,csv([['Client ID','Name','Phone','WhatsApp','Email','Address / area','Best time to contact','Budgets','Total value (BDT)','Last budget','Notes','Added'],
      ...rows.map(c=>[c.id,c.name,c.phone,c.whatsapp,c.email,c.address,c.contact_time,c.projects,c.value,day(c.last),c.notes,day(c.created)])]),
      {'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="clients.csv"'});});
  route('GET','/api/admin/export/projects.csv',(req,res)=>{
    const rows=db.prepare('SELECT * FROM projects ORDER BY created').all();
    send(res,200,csv([['Budget ID','Created','Updated','Status','Project','Client','Phone','WhatsApp','Email','Building','Flat','Size (sq ft)','Items','Total (BDT)','Client ID','Deleted by client','Admin notes'],
      ...rows.map(r=>{const p=D.J(r.data,{});const c=p.client||{},a=p.apt||{};
        return [r.id,day(r.created),day(r.updated),r.status,r.name,c.name,c.phone,c.whatsapp,c.email,a.building,a.unit,a.size,r.item_count,r.total,r.client_id??'',r.client_deleted?'yes':'',r.admin_notes];})]),
      {'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="budgets.csv"'});});
  route('GET','/api/admin/backup',(req,res)=>{
    const settings=Object.fromEntries(db.prepare("SELECT key,value FROM settings WHERE key NOT LIKE '\\_%' ESCAPE '\\'").all().map(r=>[r.key,D.J(r.value,null)]));
    const out={app:'smart-home-estimator',kind:'backup',created:new Date().toISOString(),settings,
      categories:db.prepare('SELECT * FROM categories').all(),products:db.prepare('SELECT * FROM products').all(),
      clients:db.prepare('SELECT * FROM clients').all(),projects:db.prepare('SELECT * FROM projects').all().map(({token_hash,...r})=>r)};
    send(res,200,JSON.stringify(out),{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="estimator-backup-${new Date().toISOString().slice(0,10)}.json"`});});
};
