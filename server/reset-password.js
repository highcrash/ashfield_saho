// Reset the admin password and sign out every device.
//   npm run reset-password                 → back to the default (admin12345)
//   npm run reset-password -- "new-pass"   → set a specific password
'use strict';
const {setPassword,DEFAULT_PASSWORD}=require('./auth');
const pw=process.argv[2];
if(pw&&pw.length<8){console.error('Use at least 8 characters.');process.exit(1);}
setPassword(pw||DEFAULT_PASSWORD,!pw);
console.log(pw?'Admin password changed.':`Admin password reset to the default: ${DEFAULT_PASSWORD}  (change it in Admin → Settings)`);
