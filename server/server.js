// Smart Home Estimator server — public app + admin panel + JSON API. Node 22.13+, no npm packages.
//   PORT (3000)  ADMIN_PASSWORD (first start only)  SESSION_SECRET (optional)  STORAGE_DIR (../storage)
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),zlib=require('zlib'),url=require('url');
const D=require('./db');
const auth=require('./auth');
const {seedIfEmpty}=require('./seed');

// ---------- tiny router ----------
const routes=[];
function route(method,pattern,handler,opts={}){
  const keys=[];const re=new RegExp('^'+pattern.replace(/[.]/g,'\\.').replace(/:(\w+)/g,(_,k)=>{keys.push(k);return '([^/]+)';})+'$');
  routes.push({method,re,keys,handler,opts});}
function send(res,status,body,headers={}){
  if(res.headersSent)return;
  if(body!=null&&typeof body==='object'&&!Buffer.isBuffer(body)){body=JSON.stringify(body);headers['Content-Type']='application/json; charset=utf-8';}
  res.writeHead(status,Object.assign({'Cache-Control':'no-store'},headers));res.end(body);}
function readBody(req,limit){
  return new Promise((resolve,reject)=>{let size=0;const chunks=[];
    req.on('data',c=>{size+=c.length;if(size>limit){reject(new D.HttpError(413,'Request too large.'));req.destroy();}else chunks.push(c);});
    req.on('end',()=>{if(!chunks.length)return resolve({});try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch(e){reject(new D.HttpError(400,'Invalid JSON.'));}});
    req.on('error',reject);});}
// Simple fixed-window rate limiter per key (IP + bucket)
const hits=new Map();
function limited(key,max,windowMs){const t=Date.now();let h=hits.get(key);if(!h||h.reset<t){h={n:0,reset:t+windowMs};hits.set(key,h);}h.n++;return h.n>max;}
setInterval(()=>{const t=Date.now();for(const [k,h] of hits)if(h.reset<t)hits.delete(k);},60000).unref();
// Behind Caddy/Nginx set TRUST_PROXY=1 so rate limits see the visitor's IP, not the proxy's
const ipOf=req=>(process.env.TRUST_PROXY==='1'&&req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();

// ---------- static files (explicit allow-list: server/ and storage/ are never served) ----------
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json',
  '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon',
  '.webmanifest':'application/manifest+json'};
const PUBLIC_DIRS={assets:D.ROOT,data:D.ROOT,images:D.ROOT,admin:D.ROOT,uploads:D.STORAGE};
const ROOT_FILES=new Set(['index.html','favicon.svg','manifest.webmanifest']);
const gzCache=new Map();
function serveStatic(req,res,pathname){
  let rel;try{rel=decodeURIComponent(pathname).replace(/^\/+/,'');}catch(e){return false;}
  if(rel.includes('\\')||rel.includes('\0'))return false;
  if(rel===''||rel==='index.html')rel='index.html';
  else if(rel==='admin'||rel==='admin/'){if(rel==='admin'){res.writeHead(301,{Location:'/admin/'});return res.end();}rel='admin/index.html';}
  if(rel.split('/').some(s=>s.startsWith('.')))return false;          // no dotfiles, no ../
  const top=rel.split('/')[0];let file;
  if(ROOT_FILES.has(rel))file=path.join(D.ROOT,rel);
  else if(PUBLIC_DIRS[top]&&rel.includes('/')){const dir=path.resolve(PUBLIC_DIRS[top],top);file=path.resolve(PUBLIC_DIRS[top],rel);if(!file.startsWith(dir+path.sep))return false;}
  else return false;
  let st;try{st=fs.statSync(file);}catch(e){return false;}if(!st.isFile())return false;
  const ext=path.extname(file).toLowerCase();const type=MIME[ext];if(!type)return false;
  const etag=`"${st.size.toString(36)}-${st.mtimeMs.toString(36)}"`;
  const cache=top==='uploads'?'public, max-age=31536000, immutable':top==='images'||ext==='.woff2'?'public, max-age=2592000':'no-cache';
  const h={'Content-Type':type,'ETag':etag,'Cache-Control':cache};
  if(req.headers['if-none-match']===etag){res.writeHead(304,h);return res.end(),true;}
  const text=/^(text|application\/(javascript|json|manifest))|svg/.test(type);
  if(text&&/\bgzip\b/.test(req.headers['accept-encoding']||'')){
    let g=gzCache.get(file);if(!g||g.etag!==etag){g={etag,buf:zlib.gzipSync(fs.readFileSync(file))};gzCache.set(file,g);}
    res.writeHead(200,Object.assign(h,{'Content-Encoding':'gzip','Vary':'Accept-Encoding','Content-Length':g.buf.length}));
    return res.end(req.method==='HEAD'?undefined:g.buf),true;}
  res.writeHead(200,Object.assign(h,{'Content-Length':st.size}));
  if(req.method==='HEAD')return res.end(),true;
  fs.createReadStream(file).pipe(res);return true;}

// ---------- request handling ----------
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','SAMEORIGIN');
  const u=url.parse(req.url,true);const pathname=u.pathname||'/';
  try{
    if(pathname.startsWith('/api/')){
      const r=routes.find(x=>x.method===req.method&&x.re.test(pathname));
      if(!r)return send(res,404,{error:'Not found.'});
      const m=r.re.exec(pathname);const params={};r.keys.forEach((k,i)=>params[k]=decodeURIComponent(m[i+1]));
      if(pathname.startsWith('/api/admin/')&&!r.opts.open){
        if(!auth.isAdmin(req))return send(res,401,{error:'Please sign in.'});
        // CSRF: cross-site forms cannot send application/json without a CORS preflight (and the cookie is SameSite=Strict)
        if(req.method!=='GET'&&!/^application\/json/.test(req.headers['content-type']||''))return send(res,415,{error:'Send JSON.'});}
      const body=['POST','PUT','DELETE'].includes(req.method)?await readBody(req,r.opts.limit||1024*1024):{};
      const out=await r.handler(req,res,{params,query:u.query,body,ip:ipOf(req)});
      if(out!==undefined&&!res.headersSent)send(res,200,out);
      return;}
    if((req.method==='GET'||req.method==='HEAD')&&serveStatic(req,res,pathname))return;
    send(res,404,'Not found',{'Content-Type':'text/plain'});
  }catch(e){
    if(e instanceof D.HttpError)return send(res,e.status,{error:e.message});
    console.error(e);send(res,500,{error:'Something went wrong on the server.'});}
});

require('./routes-public')({route,send,limited});
require('./routes-admin')({route,send,limited});

seedIfEmpty();
auth.ensurePassword();
const PORT=+process.env.PORT||3000;
server.listen(PORT,()=>console.log(`  Smart Home Estimator running on http://localhost:${PORT}  (admin: /admin/)  data: ${D.STORAGE}`));
module.exports=server;
