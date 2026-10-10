// Public API used by the estimator in clients' browsers
'use strict';
const D=require('./db');

module.exports=function({route,send,limited,publicUrl}){
  // Live settings + catalog as a script, loaded by index.html after config.js/products.js (and replacing them)
  route('GET','/api/public/bootstrap.js',async(req,res)=>{
    const cat=await D.getCatalog(false);
    const catalog=Object.assign({},cat,{products:cat.products.map(({sort,...p})=>p)});
    const js=`window.ESTIMATOR_API=true;\n${publicUrl?`window.ESTIMATOR_PUBLIC_URL=${JSON.stringify(publicUrl)};\n`:''}window.APP_CONFIG=${JSON.stringify(D.publicSettings())};\nwindow.CATALOG=${JSON.stringify(catalog)};\n`;
    send(res,200,js.replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029'),{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-cache'});
  });

  // This browser's projects (identified by its private token), including changes the admin made
  route('GET','/api/public/projects',async(req,res,{query,ip})=>{
    if(limited('pl:'+ip,60,60000))throw new D.HttpError(429,'Too many requests.');
    return {projects:await D.listForToken(String(query.token||''))};
  });

  // Auto-save: called a couple of seconds after each change in the estimator
  route('PUT','/api/public/projects/:id',async(req,res,{params,body,ip})=>{
    if(limited('ps:'+ip,120,60000))throw new D.HttpError(429,'Too many saves. Please wait a minute.');
    return Object.assign({ok:true},await D.savePublic(params.id,body.token,body.project));
  },{limit:512*1024});

  // Client deleted the project in their browser: hide it from them, keep it for the admin
  route('DELETE','/api/public/projects/:id',async(req,res,{params,body,ip})=>{
    if(limited('pd:'+ip,60,60000))throw new D.HttpError(429,'Too many requests.');
    await D.deletePublic(params.id,String(body.token||''));return {ok:true};
  });

  // Health check for App Platform / Docker: also proves the database answers
  route('GET','/api/health',async()=>{await D.q().get('SELECT 1 AS ok');return {ok:true,db:D.q().kind,files:D.files.kind.startsWith('Spaces')?'spaces':'local'};});
};
