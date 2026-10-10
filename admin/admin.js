/* Smart Home Estimator — admin panel (vanilla JS, hash router, no build step).
   Talks to ../api/admin/*. Uses ../assets/js/estimate-core.js for totals and ../assets/js/pdf.js for PDFs. */
(function(){
'use strict';
// ---------- helpers ----------
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const ICONS={
  home:'<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  file:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  box:'<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  out:'<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',arrowL:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
  phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  chat:'<path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12z"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  up:'<path d="m6 15 6-6 6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  upload:'<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'};
const ico=(n,cls='i')=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||''}</svg>`;
const STATUS=[['new','New'],['contacted','Contacted'],['quoted','Quoted'],['won','Won'],['lost','Lost']];
const STATUS_LABEL=Object.fromEntries(STATUS);
const ROOM_LABELS={whole:'Whole home (central)',foyer:'Foyer',living:'Living room',family:'Family living',dining:'Dining',kitchen:'Kitchen',bedroom:'Bedroom',child:"Child's room",guest:'Guest room',bath:'Bathroom',balcony:'Balcony',custom:'Rooms the client named'};
// Retail formula (same as build/weights.py and the Excel "Pricing Assumptions" sheet). Used only by the calculator; USD is never saved.
const RATE=127,FREIGHT=700,MARKUP=1.5;
// Stored paths are relative to the site root; this page lives in /admin/
const src=u=>!u?'':/^(data:|https?:|\/)/.test(u)?u:'../'+u;
const S={authed:false,settings:window.APP_CONFIG||null,catalog:null,core:null};
let V={};             // state of the current view
let routeKey='';

const fmt=n=>((S.settings&&S.settings.currency)||'BDT')+' '+Math.round(n||0).toLocaleString('en-US');
const fmtDate=t=>t?new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—';
const fmtWhen=t=>{if(!t)return '—';const d=new Date(t),diff=Date.now()-t;
  if(diff<60e3)return 'just now';if(diff<3600e3)return Math.floor(diff/60e3)+' min ago';
  if(diff<86400e3&&d.getDate()===new Date().getDate())return 'today '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});return fmtDate(t);};
const stPill=s=>`<span class="st st-${esc(s)}">${esc(STATUS_LABEL[s]||s)}</span>`;
const waLink=n=>{const d=String(n||'').replace(/\D/g,'');if(!d)return '';return 'https://wa.me/'+(d.startsWith('0')?'88'+d:d);};

async function api(method,path,body){
  const opt={method,headers:{}};
  if(method!=='GET'){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body||{});}
  const r=await fetch('../api/admin/'+path,opt);
  const d=await r.json().catch(()=>({}));
  if(r.status===401&&path!=='login'){S.authed=false;renderLogin('Your session ended. Please sign in again.');throw new Error('Please sign in.');}
  if(!r.ok)throw new Error(d.error||('Request failed ('+r.status+')'));
  return d;}
function makeCore(){
  const cat=Object.assign({},S.catalog,{products:S.catalog.products.map(p=>Object.assign({},p,{img:p.img?src(p.img):null}))});
  S.core=window.EstimateCore.create(cat,S.settings);}
function pdfSettings(){const s=clone(S.settings);s.company.logo=s.company.logo?src(s.company.logo):'';return s;}
async function loadBase(){const [s,c]=await Promise.all([api('GET','settings'),api('GET','catalog')]);S.settings=s;S.catalog=c;makeCore();}
function setCatalog(c){S.catalog=c;makeCore();}
const prod=id=>S.catalog.products.find(p=>p.id===id);
const groupLabel=id=>(S.catalog.groups.find(g=>g.id===id)||{label:id}).label;

// ---------- toast / modal / download ----------
let toastT;
function toast(msg,err){clearTimeout(toastT);$('#toastHost').innerHTML=`<div class="toast" role="status"${err?' style="background:var(--danger);color:#fff"':''}><span>${esc(msg)}</span></div>`;
  toastT=setTimeout(()=>{$('#toastHost').innerHTML='';},err?6000:2600);}
function modal(html,width){$('#layer').innerHTML=`<div class="scrim" data-act="closemodal" style="z-index:49"></div><div class="modal" role="dialog" aria-modal="true"><div class="modal-card" style="width:min(${width||460}px,100%)">${html}</div></div>`;
  document.body.style.overflow='hidden';setTimeout(()=>{const i=$('#layer input,#layer textarea');if(i)i.focus();},30);}
function closeModal(){$('#layer').innerHTML='';document.body.style.overflow='';V.confirm=null;}
function confirmBox(title,text,yes,fn){V.confirm=fn;
  modal(`<h3>${esc(title)}</h3><p class="muted">${esc(text)}</p><div class="row-end"><button class="btn ghost" data-act="closemodal">Cancel</button><button class="btn danger-fill" data-act="confirmyes">${esc(yes)}</button></div>`,420);}
function dl(filename,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);}
async function run(btn,fn){if(btn)btn.disabled=true;try{return await fn();}catch(e){if(e.message!=='Please sign in.')toast(e.message,true);}finally{if(btn)btn.disabled=false;}}
// Resize in the browser before upload so the server needs no image library
function resizeImage(file,o){return new Promise((res,rej)=>{
  if(!/^image\/(jpeg|png|webp)$/.test(file.type))return rej(new Error('Choose a JPG, PNG or WebP image.'));
  const im=new Image();im.onload=()=>{const c=document.createElement('canvas');const g=c.getContext('2d');const w=im.naturalWidth,h=im.naturalHeight;
    if(o.square){const S2=o.size;c.width=c.height=S2;g.fillStyle='#EEF1F3';g.fillRect(0,0,S2,S2);
      if(o.fit==='contain'){const k=Math.min(S2*.86/w,S2*.86/h);g.drawImage(im,(S2-w*k)/2,(S2-h*k)/2,w*k,h*k);}
      else{const k=Math.max(S2/w,S2/h);g.drawImage(im,(S2-w*k)/2,(S2-h*k)/2,w*k,h*k);}}
    else{const k=Math.min(1,o.maxW/w,o.maxH/h);c.width=Math.round(w*k);c.height=Math.round(h*k);if(o.type==='image/jpeg'){g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);}g.drawImage(im,0,0,c.width,c.height);}
    URL.revokeObjectURL(im.src);res(c.toDataURL(o.type||'image/jpeg',.86));};
  im.onerror=()=>rej(new Error('That image could not be read.'));im.src=URL.createObjectURL(file);});}

// ---------- shell ----------
const NAV=[['dashboard','Dashboard','home'],['budgets','Budgets','file'],['clients','Clients','users'],['products','Products','box'],['categories','Categories','tag'],['settings','Settings','gear']];
function brandMark(){const co=(S.settings&&S.settings.company)||{};
  return co.logo?`<img class="brand-logo" src="${esc(src(co.logo))}" alt="">`:'<span class="brand-mark"><i></i></span>';}
function renderShell(){
  const s=S.settings||{};
  $('#app').innerHTML=`<div class="adm"><aside class="side">
    <div class="side-brand">${brandMark()}<div><b>${esc((s.company&&s.company.name)||s.appName||'Smart Home Estimator')}</b><span>Admin</span></div></div>
    <nav class="nav" aria-label="Admin">${NAV.map(([k,l,i])=>`<a href="#/${k}" data-nav="${k}" title="${l}">${ico(i)}<span>${l}</span></a>`).join('')}</nav>
    <div class="side-foot"><a href="../" target="_blank" rel="noopener" title="View website">${ico('ext')}<span>View website</span></a><button data-act="logout" title="Sign out">${ico('out')}<span>Sign out</span></button></div>
  </aside><main class="amain" id="main"></main></div>`;
  document.title='Admin · '+(s.appName||'Smart Home Estimator');}
function setNav(k){$$('[data-nav]').forEach(a=>a.classList.toggle('on',a.dataset.nav===k));}
function renderLogin(msg){
  const s=S.settings||{};
  $('#app').innerHTML=`<div class="login"><form class="panel login-card" id="loginForm" novalidate>
    <div class="brand-row">${brandMark()}<div><b>${esc(s.appName||'Smart Home Estimator')}</b><span class="muted" style="font-size:13px">Admin sign-in</span></div></div>
    <div class="field"><label for="pw">Password</label><input class="input" id="pw" type="password" autocomplete="current-password"></div>
    ${msg?`<span class="err-msg">${esc(msg)}</span>`:''}
    <button class="btn primary" type="submit">Sign in</button></form></div>`;
  setTimeout(()=>{const i=$('#pw');if(i)i.focus();},30);}

// ---------- router ----------
async function router(){
  if(!S.authed)return renderLogin();
  if(!$('#main'))renderShell();
  const h=location.hash.replace(/^#\/?/,'')||'dashboard';
  const [path,qs]=h.split('?');const parts=path.split('/').map(decodeURIComponent);const q=new URLSearchParams(qs||'');
  setNav(parts[0]);closeModal();
  const key=parts.slice(0,2).join('/');const main=$('#main');
  if(key!==routeKey){main.innerHTML='<p class="muted" style="padding:20px 0">Loading…</p>';window.scrollTo(0,0);}
  routeKey=key;V={};
  try{switch(parts[0]){
    case 'dashboard':await vDashboard();break;
    case 'budgets':parts[1]?await vBudget(parts[1]):await vBudgets(q);break;
    case 'clients':parts[1]?await vClient(parts[1]):await vClients(q);break;
    case 'products':parts[1]?vProduct(parts[1],q):vProducts(q);break;
    case 'categories':vCategories();break;
    case 'settings':vSettings();break;
    default:location.hash='#/dashboard';}}
  catch(e){if(e.message!=='Please sign in.')main.innerHTML=`<div class="panel card-pad"><h3>Could not load this page</h3><p class="muted">${esc(e.message)}</p></div>`;}
}
window.addEventListener('hashchange',router);

// ---------- dashboard ----------
async function vDashboard(){
  const d=await api('GET','summary');const by=Object.fromEntries(d.byStatus.map(r=>[r.status,r]));
  const val=k=>by[k]?by[k].value:0,cnt=k=>by[k]?by[k].n:0;
  const co=S.settings.company||{};
  $('#main').innerHTML=`<div class="sec-head"><div><h2>Dashboard</h2><p>Budgets clients are building on the website, saved automatically.</p></div>
    <div class="btns"><a class="btn" href="../" target="_blank" rel="noopener">${ico('ext')} Open estimator</a></div></div>
    ${d.defaultPassword?`<div class="note-box" style="margin-bottom:18px;background:var(--danger-soft)">${ico('gear')}<span>You are using the default admin password. <a href="#/settings">Change it in Settings</a> before the site goes live.</span></div>`:''}
    ${!co.name?`<div class="note-box" style="margin-bottom:18px">${ico('gear')}<span>Add your company name, logo and contact details in <a href="#/settings">Settings</a>. They appear on the website and on every PDF.</span></div>`:''}
    <div class="kpis">
      <div class="panel kpi"><small>New budgets this week</small><b class="num">${d.newThisWeek}</b></div>
      <div class="panel kpi"><small>All budgets</small><b class="num">${d.projects}</b></div>
      <div class="panel kpi"><small>Clients</small><b class="num">${d.clients}</b></div>
      <div class="panel kpi"><small>Open pipeline</small><b class="num">${fmt(val('new')+val('contacted')+val('quoted'))}</b></div>
      <div class="panel kpi"><small>Won</small><b class="num">${fmt(val('won'))}</b></div></div>
    <div class="pipe">${STATUS.map(([k,l])=>`<a class="panel" href="#/budgets?status=${k}">${stPill(k)}<b class="num">${cnt(k)}</b><span class="v num">${fmt(val(k))}</span></a>`).join('')}</div>
    <div class="sec-head" style="margin-bottom:10px"><div><h2 style="font-size:19px">Latest activity</h2></div><a class="btn sm" href="#/budgets">All budgets</a></div>
    <div class="panel list-panel">${budgetTable(d.latest)}</div>`;}

// ---------- budgets ----------
function budgetTable(list,opts={}){
  if(!list.length)return `<div class="empty-row">${opts.empty||'No budgets yet. They appear here as soon as a client starts one on the website.'}</div>`;
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Updated</th><th>Project</th>${opts.noClient?'':'<th>Client</th>'}<th class="r">Items</th><th class="r">Total</th><th>Status</th></tr></thead><tbody>
    ${list.map(p=>`<tr class="click" data-href="#/budgets/${encodeURIComponent(p.id)}"><td class="nowrap">${fmtWhen(p.updated)}</td>
      <td><b>${esc(p.name||'Untitled project')}</b><span class="sub mono">${esc(S.core.estNo(p))}</span>${p.client_deleted?'<span class="tag off">Deleted by client</span>':''}</td>
      ${opts.noClient?'':`<td>${esc(p.client_name||'—')}<span class="sub">${esc(p.client_phone||'')}</span></td>`}
      <td class="r num">${p.item_count}</td><td class="r num nowrap"><b>${fmt(p.total)}</b></td><td>${stPill(p.status)}</td></tr>`).join('')}</tbody></table></div>`;}
async function vBudgets(q){
  V.f={status:q.get('status')||'',q:q.get('q')||'',deleted:q.get('deleted')==='1'};
  $('#main').innerHTML=`<div class="sec-head"><div><h2>Budgets</h2><p>Every estimate started on the website. Click one to see it, edit it or download the PDF.</p></div>
    <div class="btns"><a class="btn" href="../api/admin/export/projects.csv">${ico('download')} Export CSV</a></div></div>
    <div class="toolbar"><div class="tabs" id="bTabs"></div><span class="grow"></span>
      <div class="search">${ico('search')}<input class="input" id="bSearch" placeholder="Search project, client, phone" value="${esc(V.f.q)}" autocomplete="off"></div>
      <label class="chk"><input type="checkbox" id="bDeleted" ${V.f.deleted?'checked':''}> Show deleted by client</label></div>
    <div class="panel list-panel" id="listBody"><p class="muted" style="padding:16px">Loading…</p></div>`;
  await loadBudgets();}
async function loadBudgets(){
  const f=V.f;const d=await api('GET','projects?'+new URLSearchParams({status:f.status,q:f.q,deleted:f.deleted?'1':''}));
  $('#bTabs').innerHTML=[['','All']].concat(STATUS).map(([k,l])=>`<button class="tabbtn ${f.status===k?'on':''}" data-act="bstatus" data-s="${k}">${l}</button>`).join('');
  $('#listBody').innerHTML=budgetTable(d.projects,{empty:f.q||f.status?'No budgets match.':undefined});
  const qs=new URLSearchParams();if(f.status)qs.set('status',f.status);if(f.q)qs.set('q',f.q);if(f.deleted)qs.set('deleted','1');
  history.replaceState(null,'','#/budgets'+(qs.toString()?'?'+qs:''));}

async function vBudget(id){V.b=await api('GET','projects/'+encodeURIComponent(id));renderBudget();}
function renderBudget(){
  const {project:pr,client}=V.b;const p=pr.data;const C=S.core;
  const total=C.projTotal(p),changed=C.changedCount(p),req=C.onRequestCount(p);
  const c=p.client||{},a=p.apt||{};
  const rooms=p.rooms.filter(r=>r.items.length);
  const lines=rooms.map(r=>`<tr class="room"><td colspan="4">${esc(r.name)}</td><td class="r num">${fmt(C.roomTotal(r))}</td></tr>`+r.items.map(it=>{const l=C.lineInfo(it);
    if(!l)return `<tr><td></td><td colspan="4" class="muted">Product ${esc(it.pid)} no longer exists</td></tr>`;
    const flags=[l.hidden?'<span class="flag">Product archived</span>':'',l.override?`<span class="flag info">Manual price${l.catalogPrice?' · list '+fmt(l.catalogPrice):''}</span>`:'',
      !l.override&&l.priceChanged?`<span class="flag">List price now ${l.catalogPrice?fmt(l.catalogPrice):'on request'}</span>`:''].join('');
    return `<tr><td style="width:52px">${l.img?`<img class="thumb-sm" src="${esc(l.img)}" alt="">`:`<div class="thumb-sm ph">${ico(l.custom?'tag':'box')}</div>`}</td>
      <td class="pcol"><b>${esc(l.name)}</b>${l.custom?' <span class="tag custom">Custom</span>':''}${l.opt?`<span class="sub">${esc(l.opt)}</span>`:''}<span class="sub">${esc(C.catLabel(l.cat))}${l.code?' · <span class="mono">'+esc(l.code)+'</span>':''}</span></td>
      <td class="num nowrap">${esc(l.qtyText)}</td><td class="r num nowrap">${l.onRequest?'On request':fmt(l.price)}${flags}</td><td class="r num nowrap"><b>${l.onRequest?'—':fmt(l.amount)}</b></td></tr>`;}).join('')).join('');
  const kv=rows=>{rows=rows.filter(r=>r[1]);return rows.length?`<dl class="kv">${rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`:'';};
  const quick=[c.phone&&`<a class="btn sm" href="tel:${esc(c.phone.replace(/\s/g,''))}">${ico('phone')} Call</a>`,(c.whatsapp||c.phone)&&`<a class="btn sm" href="${esc(waLink(c.whatsapp||c.phone))}" target="_blank" rel="noopener">${ico('chat')} WhatsApp</a>`,
    c.email&&`<a class="btn sm" href="mailto:${esc(c.email)}">${ico('mail')} Email</a>`].filter(Boolean).join('');
  $('#main').innerHTML=`<a class="back" href="#/budgets">${ico('arrowL')} All budgets</a>
    <div class="sec-head"><div><h2>${esc(p.name||'Untitled project')}</h2><p><span class="mono">${esc(C.estNo(pr))}</span> · started ${fmtDate(pr.created)} · updated ${fmtWhen(pr.updated)}${pr.admin_updated?' · last edited by admin '+fmtWhen(pr.admin_updated):''}</p>
      ${pr.client_deleted?'<span class="tag off" style="margin-top:6px">The client deleted this budget from their browser</span>':''}</div>
      <div class="btns"><a class="btn primary" href="../?edit=${encodeURIComponent(pr.id)}">${ico('edit')} Edit in estimator</a>
        <button class="btn" data-act="bpdf" ${C.projCount(p)?'':'disabled'}>${ico('download')} PDF</button>
        <button class="btn" data-act="breprice">${ico('refresh')} Update prices</button>
        <button class="btn ghost danger" data-act="bdelete" aria-label="Delete budget">${ico('trash')}</button></div></div>
    ${changed?`<div class="note-box" style="margin-bottom:16px">${ico('refresh')}<span>${changed} item${changed>1?'s have':' has'} a different list price now than when ${changed>1?'they were':'it was'} added. The budget keeps the old price until you click <b>Update prices</b>.</span></div>`:''}
    <div class="grid2"><div class="stack">
      <div class="panel grand" style="padding:20px"><div class="eyebrow">Estimated budget</div><div class="big num">${fmt(total)}</div>
        <div class="stats"><div><b class="num">${rooms.length}</b>rooms with products</div><div><b class="num">${C.projCount(p)}</b>line items</div>${req?`<div><b class="num">${req}</b>on request</div>`:''}</div></div>
      <div class="panel card-pad"><h3>Items</h3>${rooms.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Product</th><th>Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr></thead><tbody>${lines}
        <tr class="tot-row"><td></td><td colspan="3">Total</td><td class="r num">${fmt(total)}</td></tr></tbody></table></div>`:'<p class="muted">No products added yet.</p>'}</div>
      ${(p.notes||'').trim()?`<div class="panel card-pad"><h3>Notes on the estimate</h3><p class="muted" style="white-space:pre-wrap">${esc(p.notes)}</p></div>`:''}
    </div><div class="stack">
      <div class="panel card-pad"><h3>Follow-up</h3>
        <div class="field"><label for="bStatus">Status</label><select class="input" id="bStatus">${STATUS.map(([k,l])=>`<option value="${k}" ${pr.status===k?'selected':''}>${l}</option>`).join('')}</select></div>
        <div class="field" style="margin-top:12px"><label for="bNotes">Internal notes</label><textarea class="input" id="bNotes" placeholder="Calls, site survey date, discounts discussed… (not shown to the client)">${esc(pr.admin_notes)}</textarea></div>
        <div class="row-end" style="margin-top:10px"><button class="btn primary sm" data-act="bnotes">Save notes</button></div></div>
      <div class="panel card-pad"><h3>Client</h3>${kv([['Name',esc(c.name)],['Phone',esc(c.phone)],['WhatsApp',esc(c.whatsapp)],['Email',esc(c.email)],['Area',esc(c.address)],['Best time',esc(c.contactTime)]])||'<p class="muted">No contact details yet.</p>'}
        ${quick?`<div class="quick">${quick}</div>`:''}
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">${client?`<a class="btn sm" href="#/clients/${client.id}">${ico('user')} Client record: ${esc(client.name)}</a>`:
          `<p class="muted" style="font-size:13px;margin-bottom:8px">Not saved as a client yet${c.name?'':' (no name given)'}. Clients are saved automatically once a name and a phone, WhatsApp or email are entered.</p>
          <button class="btn sm" data-act="bmkclient" ${c.name?'':'disabled'}>${ico('plus')} Save as client</button>`}</div></div>
      <div class="panel card-pad"><h3>Apartment</h3>${kv([['Building',esc(a.building)],['Flat',esc(a.unit)],['Floor',esc(a.floor)],['Size',a.size?esc(a.size)+' sq ft':''],['Address',esc(a.address)]])||'<p class="muted">—</p>'}</div>
    </div></div>`;}

// ---------- clients ----------
async function vClients(q){
  V.q=q.get('q')||'';
  $('#main').innerHTML=`<div class="sec-head"><div><h2>Clients</h2><p>Saved automatically from budgets (matched by phone, WhatsApp or email), or added by you.</p></div>
    <div class="btns"><a class="btn" href="../api/admin/export/clients.csv">${ico('download')} Export CSV</a><button class="btn primary" data-act="newclient">${ico('plus')} Add client</button></div></div>
    <div class="toolbar"><div class="search">${ico('search')}<input class="input" id="cSearch" placeholder="Search name, phone, email, area" value="${esc(V.q)}" autocomplete="off"></div></div>
    <div class="panel list-panel" id="listBody"><p class="muted" style="padding:16px">Loading…</p></div>`;
  await loadClients();}
async function loadClients(){
  const d=await api('GET','clients?'+new URLSearchParams({q:V.q}));
  $('#listBody').innerHTML=d.clients.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Phone / WhatsApp</th><th>Email</th><th>Area</th><th class="r">Budgets</th><th class="r">Value</th><th>Last activity</th></tr></thead><tbody>
    ${d.clients.map(c=>`<tr class="click" data-href="#/clients/${c.id}"><td><b>${esc(c.name)}</b></td><td class="nowrap">${esc(c.phone||'—')}${c.whatsapp&&c.whatsapp!==c.phone?`<span class="sub">WA ${esc(c.whatsapp)}</span>`:''}</td>
      <td>${esc(c.email||'—')}</td><td>${esc(c.address||'—')}</td><td class="r num">${c.projects}</td><td class="r num nowrap">${fmt(c.value)}</td><td class="nowrap">${fmtWhen(c.last||c.updated)}</td></tr>`).join('')}</tbody></table></div>`
    :`<div class="empty-row">${V.q?'No clients match.':'No clients yet.'}</div>`;
  history.replaceState(null,'','#/clients'+(V.q?'?q='+encodeURIComponent(V.q):''));}
const CLIENT_FIELDS=[['name','Name',1],['phone','Phone'],['whatsapp','WhatsApp'],['email','Email'],['address','Address / area'],['contact_time','Best time to contact']];
function clientFields(c){return `<div class="fgrid">${CLIENT_FIELDS.map(([k,l,req])=>`<div class="field"><label for="cf-${k}">${l}${req?' <span class="req">*</span>':''}</label><input class="input" id="cf-${k}" value="${esc(c[k])}" ${k==='email'?'type="email"':k==='phone'||k==='whatsapp'?'type="tel"':''}></div>`).join('')}</div>
  <div class="field" style="margin-top:14px"><label for="cf-notes">Internal notes</label><textarea class="input" id="cf-notes">${esc(c.notes)}</textarea></div>`;}
const readClient=()=>Object.fromEntries(CLIENT_FIELDS.map(([k])=>[k,$('#cf-'+k).value]).concat([['notes',$('#cf-notes').value]]));
async function vClient(id){
  const d=await api('GET','clients/'+encodeURIComponent(id));V.c=d;const c=d.client;
  const quick=[c.phone&&`<a class="btn sm" href="tel:${esc(c.phone.replace(/\s/g,''))}">${ico('phone')} Call</a>`,(c.whatsapp||c.phone)&&`<a class="btn sm" href="${esc(waLink(c.whatsapp||c.phone))}" target="_blank" rel="noopener">${ico('chat')} WhatsApp</a>`,c.email&&`<a class="btn sm" href="mailto:${esc(c.email)}">${ico('mail')} Email</a>`].filter(Boolean).join('');
  const value=d.projects.reduce((s,p)=>s+p.total,0);
  $('#main').innerHTML=`<a class="back" href="#/clients">${ico('arrowL')} All clients</a>
    <div class="sec-head"><div><h2>${esc(c.name)}</h2><p>Client since ${fmtDate(c.created)} · ${d.projects.length} budget${d.projects.length===1?'':'s'} · ${fmt(value)}</p></div><div class="btns">${quick}<button class="btn ghost danger" data-act="cdelete" aria-label="Delete client">${ico('trash')}</button></div></div>
    <div class="grid2"><div class="stack"><div class="panel card-pad"><h3>Budgets</h3>${budgetTable(d.projects,{noClient:1,empty:'No budgets linked to this client.'})}</div></div>
    <div class="stack"><div class="panel card-pad"><h3>Contact details</h3>${clientFields(c)}<div class="row-end" style="margin-top:14px"><button class="btn primary" data-act="csave">Save client</button></div></div></div></div>`;}

// ---------- products ----------
function vProducts(q){
  V.pf={group:q.get('group')||'all',q:q.get('q')||'',archived:q.get('archived')==='1'};
  $('#main').innerHTML=`<div class="sec-head"><div><h2>Products</h2><p>Prices are retail BDT, shown to clients. Changing a price does not change budgets clients already made.</p></div>
    <div class="btns"><a class="btn" href="#/categories">${ico('tag')} Categories</a><a class="btn primary" href="#/products/new">${ico('plus')} Add product</a></div></div>
    <div class="toolbar"><div class="tabs" id="pTabs" style="max-width:100%"></div></div>
    <div class="toolbar"><div class="search">${ico('search')}<input class="input" id="pSearch" placeholder="Search name, code, model" value="${esc(V.pf.q)}" autocomplete="off"></div>
      <label class="chk"><input type="checkbox" id="pArchived" ${V.pf.archived?'checked':''}> Show archived</label></div>
    <div class="panel list-panel" id="listBody"></div>`;
  renderProductList();}
function renderProductList(){
  const f=V.pf,C=S.core;const ql=f.q.trim().toLowerCase();
  const all=S.catalog.products.filter(p=>f.archived||p.active);
  $('#pTabs').innerHTML=[{id:'all',label:'All'}].concat(S.catalog.groups).map(g=>{const n=g.id==='all'?all.length:all.filter(p=>p.group===g.id).length;
    return `<button class="tabbtn ${f.group===g.id?'on':''}" data-act="pgroup" data-g="${esc(g.id)}">${esc(g.label)}${g.active===false?' (hidden)':''}<small>${n}</small></button>`;}).join('');
  const list=all.filter(p=>(f.group==='all'||p.group===f.group)&&(!ql||[p.name,p.cat,C.catLabel(p.cat),p.code,p.model,p.id,...(p.variants||[]).map(v=>v.code)].join(' ').toLowerCase().includes(ql)));
  $('#listBody').innerHTML=list.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Product</th><th>Code / model</th><th>Sold by</th><th class="r">Retail price</th><th>Status</th></tr></thead><tbody>
    ${list.map(p=>{const catOff=(S.catalog.groups.find(g=>g.id===p.group)||{}).active===false;
      return `<tr class="click" data-href="#/products/${encodeURIComponent(p.id)}"><td style="width:54px">${p.img?`<img class="thumb-sm" src="${esc(src(p.img))}" alt="" loading="lazy">`:`<div class="thumb-sm ph">${ico('box')}</div>`}</td>
      <td><b>${esc(p.name)}</b><span class="sub">${esc(groupLabel(p.group))} · ${esc(C.catLabel(p.cat))}</span></td>
      <td><span class="mono">${esc(p.code||'—')}</span><span class="sub">${esc(p.model||'')}${p.variants?' · '+p.variants.length+' options':''}</span></td>
      <td class="nowrap">${p.unit.type==='length'?(p.unit.step===1?'Metre':p.unit.step+' m roll'):'Piece'}</td>
      <td class="r num nowrap"><b>${esc(C.priceLabel(p))}</b></td>
      <td>${!p.active?'<span class="tag off">Archived</span>':catOff?'<span class="tag warn">Category hidden</span>':'<span class="tag custom">Active</span>'}</td></tr>`;}).join('')}</tbody></table></div>`
    :'<div class="empty-row">No products match.</div>';
  const qs=new URLSearchParams();if(f.group!=='all')qs.set('group',f.group);if(f.q)qs.set('q',f.q);if(f.archived)qs.set('archived','1');
  history.replaceState(null,'','#/products'+(qs.toString()?'?'+qs:''));}

function blankProduct(){return {id:null,group:(S.catalog.groups.find(g=>g.active!==false)||S.catalog.groups[0]||{}).id,cat:'',name:'',blurb:'',specs:['','',''],power:'',unit:{type:'qty'},img:null,code:'',model:'',price:null,options:[],variants:[],rooms:[],active:true,sort:''};}
function vProduct(id,q){
  let f;
  if(id==='new'){const from=q.get('from')&&prod(q.get('from'));f=from?Object.assign(clone(from),{id:null,name:from.name+' (copy)',active:true,sort:''}):blankProduct();}
  else{const p=prod(id);if(!p)throw new Error('Product not found.');f=clone(p);}
  delete f.hidden;f.options=f.options||[];f.variants=f.variants||[];f.rooms=f.rooms||[];f.specs=f.specs||[];while(f.specs.length<3)f.specs.push('');
  V.form=f;V.fit='cover';renderProductForm();}
function cartesian(opts){return opts.reduce((acc,o)=>acc.flatMap(a=>o.choices.map(c=>a.concat([c]))),[[]]);}
function rebuildVariants(){const f=V.form;
  if(!f.options.length){f.variants=[];return;}
  const old=Object.fromEntries(f.variants.map(v=>[v.opt.join('\u0001'),v]));
  f.variants=cartesian(f.options).map(opt=>old[opt.join('\u0001')]||{opt,code:f.code,model:f.model,price:f.price});}
function readProductForm(){
  const f=V.form;const g=id=>{const el=document.getElementById(id);return el?el.value:'';};
  f.name=g('pf-name');f.group=g('pf-group');f.cat=g('pf-cat');f.blurb=g('pf-blurb');f.power=g('pf-power');f.code=g('pf-code');f.model=g('pf-model');
  f.specs=$$('[data-spec]').map(i=>i.value);
  if(f.unit.type==='length')f.unit.step=Math.max(1,Math.round(+g('pf-step')||1));
  if($('#pf-price'))f.price=g('pf-price')===''?null:+g('pf-price');
  f.options=$$('[data-opt]').map(row=>({label:row.querySelector('[data-ol]').value.trim(),choices:[...new Set(row.querySelector('[data-oc]').value.split(',').map(s=>s.trim()).filter(Boolean))]}));
  $$('[data-var]').forEach(row=>{const v=f.variants[+row.dataset.var];if(!v)return;v.code=row.querySelector('[data-vc]').value;v.model=row.querySelector('[data-vm]').value;const pr=row.querySelector('[data-vp]').value;v.price=pr===''?null:+pr;});
  f.rooms=$$('[data-room]:checked').map(i=>i.dataset.room);
  f.active=$('#pf-active')?$('#pf-active').checked:true;f.sort=g('pf-sort');}
function renderProductForm(){
  const f=V.form,C=S.core;const isNew=!f.id;
  const cats=[...new Set(S.catalog.products.map(p=>p.cat).filter(Boolean))].sort();
  const optRows=f.options.map((o,i)=>`<div class="opt-row" data-opt="${i}"><div class="field"><label>Option name</label><input class="input" data-ol value="${esc(o.label)}" placeholder="e.g. Finish"></div>
    <div class="field"><label>Choices (comma separated)</label><input class="input" data-oc value="${esc(o.choices.join(', '))}" placeholder="e.g. Black, White, Gold"></div>
    <button class="icon-btn" data-act="optdel" data-i="${i}" aria-label="Remove option">${ico('x')}</button></div>`).join('');
  const varRows=f.variants.map((v,i)=>`<tr data-var="${i}"><td><b style="font-size:13.5px">${esc(v.opt.join(' · '))}</b></td><td><input data-vc value="${esc(v.code)}" placeholder="Code"></td><td><input data-vm value="${esc(v.model)}" placeholder="Model"></td><td><input data-vp type="number" min="0" step="1" value="${v.price??''}" placeholder="On request"></td></tr>`).join('');
  $('#main').innerHTML=`<a class="back" href="#/products">${ico('arrowL')} Products</a>
    <div class="sec-head"><div><h2>${isNew?'New product':esc(f.name)}</h2><p>${isNew?'The product ID is created when you save.':`ID <span class="mono">${esc(f.id)}</span> · permanent, saved budgets refer to it`}</p></div>
      ${isNew?'':`<div class="btns"><a class="btn" href="#/products/new?from=${encodeURIComponent(f.id)}">${ico('copy')} Duplicate</a><button class="btn ${f.active?'danger':''}" data-act="parchive">${f.active?'Archive':'Restore'}</button></div>`}</div>
    <div class="grid2"><div class="stack"><form class="panel form" id="pform" novalidate>
      <div class="fgroup"><h3>${ico('box')} Product</h3><div class="fgrid">
        <div class="field" style="grid-column:1/-1"><label for="pf-name">Product name <span class="req">*</span></label><input class="input" id="pf-name" value="${esc(f.name)}" maxlength="160"></div>
        <div class="field"><label for="pf-group">Category <span class="req">*</span></label><select class="input" id="pf-group">${S.catalog.groups.map(g=>`<option value="${esc(g.id)}" ${g.id===f.group?'selected':''}>${esc(g.label)}${g.active===false?' (hidden)':''}</option>`).join('')}</select></div>
        <div class="field"><label for="pf-cat">Type label</label><input class="input" id="pf-cat" list="pf-cats" value="${esc(f.cat)}" placeholder="e.g. Smart Switch"><datalist id="pf-cats">${cats.map(c=>`<option value="${esc(c)}">${esc(C.catLabel(c))}</option>`).join('')}</datalist><span class="hint">Shown above the name on cards and in the PDF.</span></div>
        <div class="field" style="grid-column:1/-1"><label for="pf-blurb">Description</label><textarea class="input" id="pf-blurb" maxlength="500" placeholder="One or two sentences for clients">${esc(f.blurb)}</textarea></div></div></div>
      <div class="fgroup"><h3>${ico('tag')} Highlights</h3><div class="specs">${f.specs.map((s,i)=>`<input class="input" data-spec="${i}" value="${esc(s)}" maxlength="80" placeholder="e.g. Works with Alexa">`).join('')}</div>
        ${f.specs.length<6?`<button class="btn ghost sm" data-act="specadd" style="margin-top:8px">${ico('plus')} Add highlight</button>`:''}
        <div class="field" style="margin-top:14px"><label for="pf-power">Power / adapter</label><input class="input" id="pf-power" value="${esc(f.power)}" maxlength="120" placeholder="e.g. AC 100–240 V"></div></div>
      <div class="fgroup"><h3>${ico('file')} Codes</h3><div class="fgrid">
        <div class="field"><label for="pf-code">Order code</label><input class="input mono" id="pf-code" value="${esc(f.code)}" placeholder="e.g. 10.00530"><span class="hint">Kept as text, so 10.00530 keeps its zero.</span></div>
        <div class="field"><label for="pf-model">Model</label><input class="input" id="pf-model" value="${esc(f.model)}"></div></div></div>
      <div class="fgroup"><h3>${ico('box')} Sold by</h3>
        <div class="unit-toggle"><button class="${f.unit.type!=='length'?'on':''}" data-act="punit" data-u="qty">Piece</button><button class="${f.unit.type==='length'?'on':''}" data-act="punit" data-u="length">Length</button></div>
        ${f.unit.type==='length'?`<div class="field" style="margin-top:12px;max-width:260px"><label for="pf-step">Sold in rolls of (metres)</label><input class="input" id="pf-step" type="number" min="1" step="1" value="${f.unit.step||1}"><span class="hint">Client enters metres; billed in whole rolls. 1 = priced per metre.</span></div>`:''}</div>
      <div class="fgroup"><h3>${ico('tag')} Retail price (BDT)</h3>
        ${f.options.length?'<p class="muted" style="font-size:13.5px">This product has options, so each combination has its own price below.</p>':
        `<div class="field" style="max-width:260px"><label for="pf-price">Price per ${f.unit.type==='length'?(f.unit.step>1?f.unit.step+' m roll':'metre'):'piece'}</label><input class="input num" id="pf-price" type="number" min="0" step="1" value="${f.price??''}" placeholder="Empty = Price on request"></div>
        <details class="calc"><summary>Retail price calculator</summary><p class="muted" style="font-size:12.5px;margin-top:6px">((Distributor USD × ${RATE}) + (net weight kg × ${FREIGHT})) × ${MARKUP}, rounded. The USD price is not saved and never shown to clients.</p>
          <div class="fgrid"><div class="field"><label for="calc-usd">Distributor USD</label><input class="input" id="calc-usd" type="number" min="0" step="0.01"></div><div class="field"><label for="calc-kg">Net weight kg</label><input class="input" id="calc-kg" type="number" min="0" step="0.01"></div>
          <div class="field"><label>Retail BDT</label><div style="display:flex;gap:8px;align-items:center"><b class="num" id="calc-out" style="font-family:var(--f-display);font-size:17px">—</b><button class="btn sm" data-act="calcuse">Use</button></div></div></div></details>`}</div>
      <div class="fgroup"><h3>${ico('gear')} Options</h3><p class="muted" style="font-size:13.5px;margin-bottom:12px">For products sold in several versions (finish, number of gangs…). Leave empty for a single version.</p>
        ${optRows}<button class="btn sm" data-act="optadd">${ico('plus')} Add option</button>
        ${f.variants.length?`<div class="tbl-wrap" style="margin-top:14px"><table class="tbl var-tbl"><thead><tr><th>Combination</th><th>Code</th><th>Model</th><th>Price (BDT)</th></tr></thead><tbody>${varRows}</tbody></table></div>`:''}</div>
    </form></div>
    <div class="stack">
      <div class="panel card-pad img-box"><h3>Photo</h3><div class="img-prev">${f.img?`<img src="${esc(src(f.img))}" alt="">`:'No photo'}</div>
        <div class="field"><label for="pf-fit">When uploading</label><select class="input" id="pf-fit"><option value="cover" ${V.fit==='cover'?'selected':''}>Crop to fill a square</option><option value="contain" ${V.fit==='contain'?'selected':''}>Show the whole image</option></select></div>
        <div class="btns"><label class="btn sm" for="pf-file" style="cursor:pointer">${ico('upload')} ${f.img?'Replace photo':'Upload photo'}</label><input type="file" id="pf-file" accept="image/jpeg,image/png,image/webp" hidden>${f.img?`<button class="btn ghost sm" data-act="imgdel">Remove</button>`:''}</div></div>
      <div class="panel card-pad"><h3>Suggest in rooms</h3><p class="muted" style="font-size:13px;margin-bottom:10px">Shown as quick-add buttons for these room types.</p>
        <div class="rooms-chk">${Object.entries(ROOM_LABELS).map(([k,l])=>`<label class="chk"><input type="checkbox" data-room="${k}" ${f.rooms.includes(k)?'checked':''}> ${l}</label>`).join('')}</div></div>
      <div class="panel card-pad"><h3>Visibility</h3><label class="chk"><input type="checkbox" id="pf-active" ${f.active?'checked':''}> Show on the website</label>
        <div class="field" style="margin-top:12px;max-width:160px"><label for="pf-sort">Sort order</label><input class="input" id="pf-sort" type="number" step="1" value="${esc(f.sort)}" placeholder="Auto"><span class="hint">Lower comes first.</span></div></div>
    </div></div>
    <div class="panel save-bar"><span class="muted" style="font-size:13px">${isNew?'New products appear on the website as soon as you save.':'Changes appear on the website immediately.'}</span><div class="btns"><a class="btn ghost" href="#/products">Cancel</a><button class="btn primary" data-act="psave">${isNew?'Add product':'Save changes'}</button></div></div>`;}

// ---------- categories ----------
function vCategories(){
  const C=S.core;const prods=S.catalog.products;const gs=S.catalog.groups;
  const catCounts={};prods.forEach(p=>{catCounts[p.cat]=(catCounts[p.cat]||0)+1;});
  const labels=S.settings.catLabels||{};
  $('#main').innerHTML=`<div class="sec-head"><div><h2>Categories</h2><p>Categories are the tabs in the product picker. Hide one to take all its products off the website.</p></div></div>
    <div class="grid2"><div class="stack"><div class="panel card-pad">
      ${gs.map((g,i)=>{const n=prods.filter(p=>p.group===g.id).length,na=prods.filter(p=>p.group===g.id&&p.active).length;
        return `<div class="cat-row"><div class="updown"><button data-act="catmove" data-id="${esc(g.id)}" data-d="-1" ${i?'':'disabled'} aria-label="Move up">${ico('up')}</button><button data-act="catmove" data-id="${esc(g.id)}" data-d="1" ${i<gs.length-1?'':'disabled'} aria-label="Move down">${ico('down')}</button></div>
          <div><input class="input" data-catlabel="${esc(g.id)}" value="${esc(g.label)}" maxlength="60" aria-label="Category name"><span class="hint mono" style="font-size:11.5px">${esc(g.id)}</span></div>
          <a class="muted nowrap" style="font-size:13px" href="#/products?group=${encodeURIComponent(g.id)}">${na} of ${n} products</a>
          <label class="chk"><input type="checkbox" data-catactive="${esc(g.id)}" ${g.active!==false?'checked':''}> Shown</label></div>`;}).join('')}
      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap"><input class="input" id="newCat" placeholder="New category name, e.g. Audio & Video" maxlength="60" style="flex:1;min-width:200px"><button class="btn primary" data-act="catadd">${ico('plus')} Add category</button></div>
    </div></div>
    <div class="stack"><div class="panel card-pad"><h3>Type labels</h3><p class="muted" style="font-size:13px;margin-bottom:12px">Rename how a product type is shown to clients without editing each product.</p>
      ${Object.keys(catCounts).sort().map(c=>`<div class="field" style="margin-bottom:10px"><label style="font-weight:500;color:var(--muted);font-size:12.5px">${esc(c)} · ${catCounts[c]}</label><input class="input" data-typelabel="${esc(c)}" value="${esc(labels[c]||'')}" placeholder="${esc(c)}"></div>`).join('')}
      <div class="row-end"><button class="btn primary sm" data-act="typesave">Save labels</button></div></div></div></div>`;}

// ---------- settings ----------
function vSettings(){
  const s=S.settings,c=s.company;
  const fld=(id,label,val,o={})=>`<div class="field" ${o.wide?'style="grid-column:1/-1"':''}><label for="${id}">${label}</label><input class="input" id="${id}" value="${esc(val)}" ${o.type?`type="${o.type}"`:''} ${o.ph?`placeholder="${esc(o.ph)}"`:''}>${o.hint?`<span class="hint">${o.hint}</span>`:''}</div>`;
  $('#main').innerHTML=`<div class="sec-head"><div><h2>Settings</h2><p>Your company details appear on the website and on every PDF estimate.</p></div></div>
    <div class="grid2"><div class="stack"><form class="panel form" id="sform" novalidate>
      <div class="fgroup"><h3>${ico('home')} Website</h3><div class="fgrid">
        ${fld('s-app','Website name',s.appName,{hint:'Shown in the top bar and browser tab.'})}
        <div class="field"><label>&nbsp;</label><label class="chk"><input type="checkbox" id="s-example" ${s.showExampleProject?'checked':''}> Show the example project to new visitors</label></div></div></div>
      <div class="fgroup"><h3>${ico('user')} Company</h3><div class="fgrid">
        ${fld('s-name','Company name',c.name,{ph:'e.g. Ashfield Smart Solution'})}${fld('s-tag','Tagline',c.tagline,{ph:'Smart home design & installation'})}
        ${fld('s-phone','Phone',c.phone,{type:'tel',ph:'+880 1XXX-XXXXXX'})}${fld('s-wa','WhatsApp number',c.whatsapp,{type:'tel',ph:'8801XXXXXXXXX',hint:'With country code, digits only.'})}
        ${fld('s-email','Email',c.email,{type:'email'})}${fld('s-web','Website',c.website,{ph:'www.yourcompany.com'})}
        ${fld('s-addr','Address',c.address,{wide:1,ph:'House, road, area, Dhaka'})}</div></div>
      <div class="fgroup"><h3>${ico('file')} Estimate PDF</h3><div class="fgrid">
        ${fld('s-cur','Currency',s.currency)}${fld('s-valid','Valid for (days)',s.estimateValidityDays,{type:'number',hint:'0 hides the line.'})}
        ${fld('s-foot','PDF footer',s.pdfFooter,{wide:1,ph:'Empty = company name · phone · email · website'})}
        <div class="field" style="grid-column:1/-1"><label for="s-notes">Default notes</label><textarea class="input" id="s-notes">${esc(s.defaultNotes)}</textarea><span class="hint">Printed at the end of new estimates. Clients can edit their own copy.</span></div></div></div>
    </form>
    <div class="panel save-bar" style="position:static;margin-top:0"><span class="muted" style="font-size:13px">Saved settings apply to the website straight away.</span><button class="btn primary" data-act="ssave">Save settings</button></div></div>
    <div class="stack">
      <div class="panel card-pad"><h3>Logo</h3><div class="logo-prev" id="logoPrev">${c.logo?`<img src="${esc(src(c.logo))}" alt="">`:'No logo'}</div>
        <p class="muted" style="font-size:12.5px;margin:10px 0">PNG or JPG, wide or square, on a light background. Used in the top bar and the PDF header.</p>
        <div class="btns"><label class="btn sm" for="s-logo" style="cursor:pointer">${ico('upload')} Upload logo</label><input type="file" id="s-logo" accept="image/png,image/jpeg,image/webp" hidden>${c.logo?'<button class="btn ghost sm" data-act="logodel">Remove</button>':''}</div></div>
      <div class="panel card-pad"><h3>Admin password</h3>
        <div class="field"><label for="pw-cur">Current password</label><input class="input" id="pw-cur" type="password" autocomplete="current-password"></div>
        <div class="field" style="margin-top:10px"><label for="pw-new">New password</label><input class="input" id="pw-new" type="password" autocomplete="new-password"><span class="hint">At least 8 characters. Other signed-in devices are signed out.</span></div>
        <div class="row-end" style="margin-top:12px"><button class="btn sm" data-act="pwsave">Change password</button></div></div>
      <div class="panel card-pad"><h3>Your data</h3><p class="muted" style="font-size:13px;margin-bottom:12px">Download a copy regularly. The backup holds settings, products, clients and budgets.</p>
        <div class="btns"><a class="btn sm" href="../api/admin/backup">${ico('download')} Full backup (JSON)</a><a class="btn sm" href="../api/admin/export/clients.csv">Clients CSV</a><a class="btn sm" href="../api/admin/export/projects.csv">Budgets CSV</a></div></div>
    </div></div>`;}
async function saveSettings(patch){S.settings=await api('PUT','settings',patch);makeCore();
  const b=$('.side-brand');if(b)b.innerHTML=`${brandMark()}<div><b>${esc(S.settings.company.name||S.settings.appName)}</b><span>Admin</span></div>`;}

// ---------- events ----------
const ACT={
  logout:async()=>{await fetch('../api/admin/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});S.authed=false;renderLogin();},
  closemodal:closeModal,
  confirmyes:async b=>{const fn=V.confirm;closeModal();if(fn)await run(b,fn);},
  bstatus:b=>{V.f.status=b.dataset.s;run(null,loadBudgets);},
  bpdf:b=>run(b,async()=>{toast('Preparing PDF…');const p=V.b.project.data;dl(window.EstimatorPDF.fileName(p),await window.EstimatorPDF.make(p,S.core,pdfSettings()));}),
  breprice:()=>{const n=S.core.changedCount(V.b.project.data);
    confirmBox('Update prices to today\'s list?',n?`${n} line${n>1?'s':''} will change to the current catalog price. Lines with a manual price stay as they are.`:'All lines already use current list prices. Lines with a manual price stay as they are.','Update prices',
      async()=>{const d=await api('POST','projects/'+encodeURIComponent(V.b.project.id)+'/reprice',{});V.b.project=d.project;renderBudget();toast('Prices updated');});},
  bdelete:()=>confirmBox('Delete this budget?','It is removed for good, from the admin panel and from the client\'s browser the next time they open the site.','Delete budget',
    async()=>{await api('DELETE','projects/'+encodeURIComponent(V.b.project.id));toast('Budget deleted');location.hash='#/budgets';}),
  bnotes:b=>run(b,async()=>{const d=await api('PUT','projects/'+encodeURIComponent(V.b.project.id),{admin_notes:$('#bNotes').value});V.b.project.admin_notes=d.project.admin_notes;toast('Notes saved');}),
  bmkclient:b=>run(b,async()=>{const c=V.b.project.data.client||{};
    const d=await api('POST','clients',{name:c.name,phone:c.phone,whatsapp:c.whatsapp,email:c.email,address:c.address,contact_time:c.contactTime});
    await api('PUT','projects/'+encodeURIComponent(V.b.project.id),{client_id:d.client.id});toast('Saved as client');await vBudget(V.b.project.id);}),
  newclient:()=>{modal(`<div style="display:flex;justify-content:space-between;align-items:center"><h3>Add client</h3><button class="icon-btn" data-act="closemodal" aria-label="Close">${ico('x')}</button></div>${clientFields({})}
    <div class="row-end"><button class="btn ghost" data-act="closemodal">Cancel</button><button class="btn primary" data-act="cadd">Add client</button></div>`,620);},
  cadd:b=>run(b,async()=>{const d=await api('POST','clients',readClient());closeModal();toast('Client added');location.hash='#/clients/'+d.client.id;}),
  csave:b=>run(b,async()=>{const d=await api('PUT','clients/'+V.c.client.id,readClient());V.c.client=d.client;toast('Client saved');$('.sec-head h2').textContent=d.client.name;}),
  cdelete:()=>confirmBox('Delete this client?','Their budgets are kept but no longer linked to a client record.','Delete client',
    async()=>{await api('DELETE','clients/'+V.c.client.id);toast('Client deleted');location.hash='#/clients';}),
  pgroup:b=>{V.pf.group=b.dataset.g;renderProductList();},
  specadd:()=>{readProductForm();if(V.form.specs.length<6)V.form.specs.push('');renderProductForm();const l=$$('[data-spec]').pop();if(l)l.focus();},
  punit:b=>{readProductForm();V.form.unit=b.dataset.u==='length'?{type:'length',step:V.form.unit.step||1}:{type:'qty'};renderProductForm();},
  optadd:()=>{readProductForm();V.form.options.push({label:'',choices:[]});renderProductForm();const l=$$('[data-ol]').pop();if(l)l.focus();},
  optdel:b=>{readProductForm();V.form.options.splice(+b.dataset.i,1);V.form.options=V.form.options.filter(o=>o.label||o.choices.length);rebuildVariants();renderProductForm();},
  imgdel:()=>{readProductForm();V.form.img=null;renderProductForm();},
  calcuse:()=>{const v=$('#calc-out').dataset.v;if(v){$('#pf-price').value=v;toast('Price set to '+fmt(+v)+'. Save to apply.');}},
  parchive:b=>run(b,async()=>{const f=V.form;setCatalog(await api('PUT','products/'+encodeURIComponent(f.id)+'/active',{active:!f.active}));f.active=!f.active;renderProductForm();toast(f.active?'Product restored':'Product archived. Existing budgets still show it.');}),
  psave:b=>run(b,async()=>{readProductForm();const f=V.form;
    f.options=f.options.filter(o=>o.label||o.choices.length);rebuildVariants();
    if(!f.name.trim()){toast('Enter a product name.',true);$('#pf-name').focus();return;}
    if(f.options.some(o=>!o.label||!o.choices.length)){toast('Each option needs a name and at least one choice.',true);return;}
    const body=Object.assign({},f,{specs:f.specs.map(s=>s.trim()).filter(Boolean),price:f.options.length?null:f.price,sort:f.sort===''?undefined:+f.sort});
    const d=f.id?await api('PUT','products/'+encodeURIComponent(f.id),body):await api('POST','products',body);
    setCatalog(d.catalog);toast(f.id?'Product saved':'Product added');
    if(!f.id)location.hash='#/products/'+encodeURIComponent(d.id);else{V.form=Object.assign(clone(prod(d.id)),{});vProduct(d.id,new URLSearchParams());}}),
  catmove:b=>run(b,async()=>{const ids=S.catalog.groups.map(g=>g.id);const i=ids.indexOf(b.dataset.id),j=i+(+b.dataset.d);if(j<0||j>=ids.length)return;
    [ids[i],ids[j]]=[ids[j],ids[i]];setCatalog(await api('POST','categories/reorder',{ids}));vCategories();}),
  catadd:b=>run(b,async()=>{const i=$('#newCat');const label=i.value.trim();if(!label){i.focus();return;}setCatalog(await api('POST','categories',{label}));vCategories();toast('Category added');}),
  typesave:b=>run(b,async()=>{const m={};$$('[data-typelabel]').forEach(i=>{if(i.value.trim())m[i.dataset.typelabel]=i.value.trim();});await saveSettings({catLabels:m});
    setCatalog(await api('GET','catalog'));toast('Labels saved');}),
  ssave:b=>run(b,async()=>{const g=id=>$('#'+id).value;
    await saveSettings({appName:g('s-app'),showExampleProject:$('#s-example').checked,currency:g('s-cur'),estimateValidityDays:+g('s-valid')||0,pdfFooter:g('s-foot'),defaultNotes:g('s-notes'),
      company:{name:g('s-name'),tagline:g('s-tag'),phone:g('s-phone'),whatsapp:g('s-wa'),email:g('s-email'),website:g('s-web'),address:g('s-addr'),logo:S.settings.company.logo}});
    toast('Settings saved');}),
  logodel:b=>run(b,async()=>{await saveSettings({company:Object.assign({},S.settings.company,{logo:''})});vSettings();toast('Logo removed');}),
  pwsave:b=>run(b,async()=>{await api('POST','password',{current:$('#pw-cur').value,next:$('#pw-new').value});$('#pw-cur').value=$('#pw-new').value='';toast('Password changed');})
};
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');
  if(b){e.preventDefault();const fn=ACT[b.dataset.act];if(fn)fn(b,e);return;}
  const row=e.target.closest('tr[data-href]');if(row&&!e.target.closest('a,button,input,select')){location.hash=row.dataset.href;}
});
// Identify the focused field so it can be focused again after a re-render
function focusKey(){const a=document.activeElement;if(!a||a===document.body)return null;if(a.id)return '#'+CSS.escape(a.id);
  const row=a.closest('[data-opt],[data-var]');const attr=['data-ol','data-oc','data-vc','data-vm','data-vp','data-spec'].find(x=>a.hasAttribute(x));
  if(!attr)return null;if(attr==='data-spec')return `[data-spec="${a.dataset.spec}"]`;
  return row?(row.hasAttribute('data-opt')?`[data-opt="${row.dataset.opt}"] [${attr}]`:`[data-var="${row.dataset.var}"] [${attr}]`):null;}
function restoreFocus(key){if(!key)return;const el=document.querySelector(key);if(el)el.focus();}
let searchT;
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='bSearch'){clearTimeout(searchT);searchT=setTimeout(()=>{V.f.q=t.value.trim();run(null,loadBudgets);},300);}
  else if(t.id==='cSearch'){clearTimeout(searchT);searchT=setTimeout(()=>{V.q=t.value.trim();run(null,loadClients);},300);}
  else if(t.id==='pSearch'){V.pf.q=t.value;renderProductList();}
  else if(t.id==='calc-usd'||t.id==='calc-kg'){const usd=+$('#calc-usd').value||0,kg=+$('#calc-kg').value||0;const o=$('#calc-out');
    // ROUND_HALF_UP like the Python build (toFixed first removes float noise such as 1234.4999999)
    const v=usd?Math.round(Number(((usd*RATE+kg*FREIGHT)*MARKUP).toFixed(6))):0;o.textContent=v?fmt(v):'—';o.dataset.v=v||'';}
});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='bDeleted'){V.f.deleted=t.checked;run(null,loadBudgets);}
  else if(t.id==='pArchived'){V.pf.archived=t.checked;renderProductList();}
  else if(t.id==='bStatus'){run(null,async()=>{const d=await api('PUT','projects/'+encodeURIComponent(V.b.project.id),{status:t.value});V.b.project.status=d.project.status;toast('Status: '+STATUS_LABEL[t.value]);});}
  // Choices changed → rebuild the combination table. Wait for focus to move first, then put it back after the re-render.
  else if(t.matches('[data-oc]')){setTimeout(()=>{const key=focusKey();readProductForm();rebuildVariants();renderProductForm();restoreFocus(key);},0);}
  else if(t.matches('[data-ol]')){readProductForm();}
  else if(t.id==='pf-fit'){V.fit=t.value;}
  else if(t.id==='pf-file'&&t.files[0]){const file=t.files[0];run(null,async()=>{readProductForm();toast('Uploading photo…');
    const dataUrl=await resizeImage(file,{square:true,size:600,fit:V.fit,type:'image/jpeg'});
    const d=await api('POST','upload',{kind:'product',name:V.form.name||'product',dataUrl});V.form.img=d.url;renderProductForm();toast('Photo uploaded. Save to apply.');});}
  else if(t.id==='s-logo'&&t.files[0]){const file=t.files[0];run(null,async()=>{toast('Uploading logo…');
    const dataUrl=await resizeImage(file,{maxW:900,maxH:360,type:file.type==='image/jpeg'?'image/jpeg':'image/png'});
    const d=await api('POST','upload',{kind:'logo',name:'logo',dataUrl});await saveSettings({company:Object.assign({},S.settings.company,{logo:d.url})});
    $('#logoPrev').innerHTML=`<img src="${esc(src(d.url))}" alt="">`;toast('Logo saved');});}
  else if(t.dataset.catlabel){run(null,async()=>{if(!t.value.trim()){t.value=(S.catalog.groups.find(g=>g.id===t.dataset.catlabel)||{}).label;return;}
    setCatalog(await api('PUT','categories/'+encodeURIComponent(t.dataset.catlabel),{label:t.value}));toast('Category renamed');});}
  else if(t.dataset.catactive){run(null,async()=>{setCatalog(await api('PUT','categories/'+encodeURIComponent(t.dataset.catactive),{active:t.checked}));
    toast(t.checked?'Category shown on the website':'Category hidden from the website');});}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&$('#layer').innerHTML)closeModal();
  if(e.key==='Enter'&&e.target.id==='newCat'){e.preventDefault();ACT.catadd($('[data-act="catadd"]'));}
});
document.addEventListener('submit',async e=>{
  e.preventDefault();
  if(e.target.id!=='loginForm')return;
  const btn=e.target.querySelector('button[type=submit]');btn.disabled=true;
  try{await api('POST','login',{password:$('#pw').value});S.authed=true;await loadBase();
    const next=new URLSearchParams(location.search).get('next');
    if(next&&/^\/(?!\/)/.test(next)){location.href=next;return;}
    renderShell();router();}
  catch(e2){renderLogin(e2.message);}
});

// ---------- boot ----------
(async function boot(){
  try{const r=await fetch('../api/admin/me');const d=await r.json();S.authed=!!d.admin;}catch(e){S.authed=false;}
  if(!S.authed){if(!window.ESTIMATOR_API){$('#app').innerHTML='<p style="padding:40px">The admin panel needs the estimator server (see README). It does not work on a plain static host.</p>';return;}return renderLogin();}
  try{await loadBase();}catch(e){return;}
  const next=new URLSearchParams(location.search).get('next');if(next&&/^\/(?!\/)/.test(next)){location.href=next;return;}
  renderShell();router();
})();
})();
