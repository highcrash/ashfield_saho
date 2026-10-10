// Admin sign-in: one password (scrypt hash in settings) and a signed, HttpOnly session cookie.
'use strict';
const crypto=require('crypto');
const {getSetting,setSetting}=require('./db');

const COOKIE='she_admin';
const DAYS=7;

function hash(pw){const salt=crypto.randomBytes(16);const h=crypto.scryptSync(String(pw),salt,64);return 'scrypt$'+salt.toString('hex')+'$'+h.toString('hex');}
function verify(pw,stored){
  if(!stored||!stored.startsWith('scrypt$'))return false;const [,s,h]=stored.split('$');
  const got=crypto.scryptSync(String(pw),Buffer.from(s,'hex'),64);const want=Buffer.from(h,'hex');
  return got.length===want.length&&crypto.timingSafeEqual(got,want);}

// First start: take the password from ADMIN_PASSWORD, or use the default (the dashboard warns until it is changed).
const DEFAULT_PASSWORD='admin12345';
function setPassword(pw,isDefault){setSetting('_adminHash',hash(pw));setSetting('_defaultPassword',!!isDefault);setSetting('_sessionEpoch',epoch()+1);}
function ensurePassword(){
  if(getSetting('_adminHash',null)){if(getSetting('_defaultPassword',false))console.log(`  Admin password is still the default (${DEFAULT_PASSWORD}). Change it in Admin → Settings.`);return;}
  const pw=process.env.ADMIN_PASSWORD;
  setPassword(pw||DEFAULT_PASSWORD,!pw);
  console.log(pw?'  Admin password set from ADMIN_PASSWORD.':`\n  Admin password: ${DEFAULT_PASSWORD}  (default — change it in Admin → Settings)\n`);
}
const isDefaultPassword=()=>!!getSetting('_defaultPassword',false);
function secret(){
  if(process.env.SESSION_SECRET)return process.env.SESSION_SECRET;
  let s=getSetting('_sessionSecret',null);if(!s){s=crypto.randomBytes(32).toString('hex');setSetting('_sessionSecret',s);}return s;}
// Changing the password bumps the epoch, which signs out every open session
const epoch=()=>getSetting('_sessionEpoch',1);
const sign=v=>crypto.createHmac('sha256',secret()).update(v).digest('base64url');

function parseCookies(req){const out={};(req.headers.cookie||'').split(';').forEach(p=>{const i=p.indexOf('=');if(i>0)out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim());});return out;}
function isHttps(req){return req.headers['x-forwarded-proto']==='https'||!!req.socket.encrypted||process.env.COOKIE_SECURE==='1';}
function cookie(req,value,maxAge){
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${isHttps(req)?'; Secure':''}`;}

function login(req,res,password){
  if(!verify(password||'',getSetting('_adminHash',null)))return false;
  const exp=Date.now()+DAYS*864e5;const payload=`${exp}.${epoch()}.${crypto.randomBytes(8).toString('hex')}`;
  res.setHeader('Set-Cookie',cookie(req,payload+'.'+sign(payload),DAYS*86400));return true;}
function logout(req,res){res.setHeader('Set-Cookie',cookie(req,'',0));}
function isAdmin(req){
  const v=parseCookies(req)[COOKIE];if(!v)return false;
  const i=v.lastIndexOf('.');if(i<0)return false;const payload=v.slice(0,i),sig=v.slice(i+1);
  const want=sign(payload);if(sig.length!==want.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(want)))return false;
  const [exp,ep]=payload.split('.');return Number(exp)>Date.now()&&Number(ep)===Number(epoch());}
function changePassword(current,next){
  if(!verify(current||'',getSetting('_adminHash',null)))return 'The current password is wrong.';
  if(!next||String(next).length<8)return 'Use at least 8 characters for the new password.';
  if(next===DEFAULT_PASSWORD)return 'Choose a password other than the default.';
  setPassword(next,false);return null;}

module.exports={ensurePassword,login,logout,isAdmin,changePassword,setPassword,isDefaultPassword,DEFAULT_PASSWORD};
