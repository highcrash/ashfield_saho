// Checks the file storage: uploads, reads back and deletes a tiny test file.
//   SPACES_KEY=… SPACES_SECRET=… SPACES_BUCKET=ashfiledsaho SPACES_REGION=sgp1 npm run check-spaces
'use strict';
const path=require('path');
const files=require('./files')(path.resolve(__dirname,'..','storage','uploads'));
console.log('Storage: '+files.kind);
files.selfTest().then(ok=>{console.log(ok?'OK — upload, read and delete work.':'FAILED — the file read back was different.');process.exit(ok?0:1);})
  .catch(e=>{console.error('FAILED — '+e.message);process.exit(1);});
