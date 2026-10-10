// Public API used by the estimator in clients' browsers
'use strict';
const D=require('./db');

module.exports=function({route,send,limited}){
  // Live settings + catalog as a script, loaded by index.html after config.js/products.js (and replacing them)
  route('GET','/api/public/bootstrap.js',(req,res)=>{
    const cat=D.getCatalog(false);
    const catalog=Object.assign({},cat,{products:cat.products.map(({sort,...p})=>p)});
    const js=`window.ESTIMATOR_API=true;\nwindow.APP_CONFIG=${JSON.stringify(D.publicSettings())};\nwindow.CATALOG=${JSON.stringify(catalog)};\n`;
    send(res,200,js.replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029'),{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-cache'});
  });

  // This browser's projects (identified by its private token), including changes the admin made
  route('GET','/api/public/projects',(req,res,{query,ip})=>{
    if(limited('pl:'+ip,60,60000))throw new D.HttpError(429,'Too many requests.');
    return {projects:D.listForToken(String(query.token||''))};
  });

  // Auto-save: called a couple of seconds after each change in the estimator
  route('PUT','/api/public/projects/:id',(req,res,{params,body,ip})=>{
    if(limited('ps:'+ip,120,60000))throw new D.HttpError(429,'Too many saves. Please wait a minute.');
    return Object.assign({ok:true},D.savePublic(params.id,body.token,body.project));
  },{limit:512*1024});

  // Client deleted the project in their browser: hide it from them, keep it for the admin
  route('DELETE','/api/public/projects/:id',(req,res,{params,body,ip})=>{
    if(limited('pd:'+ip,60,60000))throw new D.HttpError(429,'Too many requests.');
    D.deletePublic(params.id,String(body.token||''));return {ok:true};
  });
};
