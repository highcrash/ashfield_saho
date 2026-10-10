// Consistent copy of the database to storage/backups/app-YYYY-MM-DD.db (keeps the newest 14).
//   node server/backup.js      — in Docker: docker compose -f deploy/docker-compose.yml exec app node server/backup.js
'use strict';
const fs=require('fs'),path=require('path');
const {db,STORAGE}=require('./db');
const dir=path.join(STORAGE,'backups');fs.mkdirSync(dir,{recursive:true});
const file=path.join(dir,`app-${new Date().toISOString().slice(0,10)}.db`);
if(fs.existsSync(file))fs.unlinkSync(file);
db.exec(`VACUUM INTO '${file.replace(/'/g,"''")}'`);
const old=fs.readdirSync(dir).filter(f=>/^app-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort().reverse().slice(14);
old.forEach(f=>fs.unlinkSync(path.join(dir,f)));
console.log('Backup written: '+file);
