// Uploaded files (product photos, logo): DigitalOcean Spaces when SPACES_* is set, otherwise storage/uploads/.
// Keys look like "uploads/products/name.jpg". The site always serves them from its own /uploads/… path, so
// images stay same-origin (the PDF can embed them) and the Space can stay private.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');

const KEY=process.env.SPACES_KEY,SECRET=process.env.SPACES_SECRET,BUCKET=process.env.SPACES_BUCKET;
const REGION=process.env.SPACES_REGION||'sgp1';
const PREFIX=(process.env.SPACES_PREFIX??'estimator/').replace(/^\/+/,'');
const SPACES=!!(KEY&&SECRET&&BUCKET);
const HOST=`${BUCKET}.${REGION}.digitaloceanspaces.com`;

const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hmac=(k,s)=>crypto.createHmac('sha256',k).update(s).digest();
// AWS Signature Version 4 (Spaces is S3-compatible)
function signed(method,key,body,extra={}){
  const now=new Date();const amz=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const day=amz.slice(0,8);
  const uri='/'+(PREFIX+key).split('/').map(s=>encodeURIComponent(s)).join('/');
  const payload=body?sha(body):sha('');
  const h=Object.assign({host:HOST,'x-amz-content-sha256':payload,'x-amz-date':amz},extra);
  const names=Object.keys(h).map(k=>k.toLowerCase()).sort();
  const lower=Object.fromEntries(Object.entries(h).map(([k,v])=>[k.toLowerCase(),String(v).trim()]));
  const canon=[method,uri,'',names.map(n=>`${n}:${lower[n]}\n`).join(''),names.join(';'),payload].join('\n');
  const scope=`${day}/${REGION}/s3/aws4_request`;
  const toSign=['AWS4-HMAC-SHA256',amz,scope,sha(canon)].join('\n');
  const k=hmac(hmac(hmac(hmac('AWS4'+SECRET,day),REGION),'s3'),'aws4_request');
  const sig=crypto.createHmac('sha256',k).update(toSign).digest('hex');
  delete h.host;h.Authorization=`AWS4-HMAC-SHA256 Credential=${KEY}/${scope}, SignedHeaders=${names.join(';')}, Signature=${sig}`;
  return {url:`https://${HOST}${uri}`,headers:h};}

// Small in-memory cache so popular photos are not fetched from Spaces on every request
const cache=new Map();let cacheBytes=0;const CACHE_MAX=64*1024*1024;
function remember(key,v){if(v.body.length>4*1024*1024)return;cache.set(key,v);cacheBytes+=v.body.length;
  for(const [k,x] of cache){if(cacheBytes<=CACHE_MAX)break;cache.delete(k);cacheBytes-=x.body.length;}}

function localPath(dir,key){const base=path.resolve(dir);const f=path.resolve(base,key.replace(/^uploads\//,''));if(!f.startsWith(base+path.sep))throw new Error('Bad path');return f;}

module.exports=function(uploadsDir){
  return {
    kind:SPACES?`Spaces ${BUCKET} (${REGION})/${PREFIX}`:uploadsDir,
    async put(key,body,type){
      if(!SPACES){const f=localPath(uploadsDir,key);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,body);return;}
      const s=signed('PUT',key,body,{'content-type':type,'x-amz-acl':'private','cache-control':'public, max-age=31536000, immutable'});
      const r=await fetch(s.url,{method:'PUT',headers:s.headers,body});
      if(!r.ok)throw new Error(`Spaces upload failed (${r.status}): ${(await r.text()).slice(0,200)}`);},
    // Returns {body, type} or null when missing
    async get(key){
      if(!SPACES){try{const f=localPath(uploadsDir,key);return {body:fs.readFileSync(f),type:null};}catch(e){return null;}}
      if(cache.has(key))return cache.get(key);
      const s=signed('GET',key,null);const r=await fetch(s.url,{headers:s.headers});
      if(r.status===404)return null;
      if(!r.ok)throw new Error(`Spaces read failed (${r.status})`);
      const v={body:Buffer.from(await r.arrayBuffer()),type:r.headers.get('content-type')};remember(key,v);return v;},
    // Upload, read back and delete a tiny file: used by `npm run check-spaces`
    async selfTest(){const key='uploads/.check-'+Date.now()+'.txt';await this.put(key,Buffer.from('ok'),'text/plain');const g=await this.get(key);
      if(SPACES){const s=signed('DELETE',key,null);await fetch(s.url,{method:'DELETE',headers:s.headers});cache.delete(key);}else fs.unlinkSync(localPath(uploadsDir,key));
      return !!g&&g.body.toString()==='ok';}
  };
};
