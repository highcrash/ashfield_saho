// SQLite only: consistent copy of the database to storage/backups/app-YYYY-MM-DD.db (keeps the newest 14).
// With PostgreSQL (DATABASE_URL) DigitalOcean backs the database up daily; use Admin → Settings → Full backup for a JSON copy.
'use strict';
const fs=require('fs'),path=require('path');
const D=require('./db');
(async()=>{
  await D.init();
  if(D.q().kind!=='sqlite'){console.log('PostgreSQL: backups are handled by DigitalOcean (daily, 7 days). For a JSON copy use Admin → Settings → Full backup.');return D.q().close();}
  const dir=path.join(D.STORAGE,'backups');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,`app-${new Date().toISOString().slice(0,10)}.db`);
  if(fs.existsSync(file))fs.unlinkSync(file);
  await D.q().vacuumInto(file);
  fs.readdirSync(dir).filter(f=>/^app-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort().reverse().slice(14).forEach(f=>fs.unlinkSync(path.join(dir,f)));
  console.log('Backup written: '+file);await D.q().close();
})().catch(e=>{console.error(e.message);process.exit(1);});
