/* Smart Home Estimator — PDF estimate (jsPDF + AutoTable). Shared by the app and the admin panel.
   EstimatorPDF.make(project, core, cfg) → Promise<Blob>; core = EstimateCore.create(...), cfg = site settings */
(function(){
'use strict';
const dataUrlCache={};
function toDataURL(src){if(!src)return Promise.resolve(null);if(src in dataUrlCache)return Promise.resolve(dataUrlCache[src]);
  return new Promise(res=>{const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');
    g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0);const d=c.toDataURL('image/jpeg',.85);dataUrlCache[src]={url:d,w:c.width,h:c.height};res(dataUrlCache[src]);}catch(e){res(null);}};
    im.onerror=()=>res(null);im.src=src;});}
function safeName(s){return (s||'Smart Home').replace(/[\\/:*?"<>|]+/g,'').trim().slice(0,60)||'Smart Home';}

async function make(p,core,cfg){
  if(!window.jspdf)throw new Error('The PDF tool could not load. Check that assets/vendor is uploaded.');
  const CO=(cfg&&cfg.company)||{};const {fmt,lineInfo,roomTotal,projTotal,projCount,onRequestCount,catLabel,estNo}=core;
  const cl=p.client||{},apt=p.apt||{};
  const paths=new Set();p.rooms.forEach(r=>r.items.forEach(it=>{const l=lineInfo(it);if(l&&l.img)paths.add(l.img);}));
  const imgs={};await Promise.all([...paths].map(async s=>{const d=await toDataURL(s);if(d)imgs[s]=d.url;}));
  const logo=CO.logo?await toDataURL(CO.logo):null;
  const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const W=210,M=14;const INK=[15,27,26],TEAL=[11,143,122],MUTE=[92,107,104],LINE=[217,225,223],SOFT=[238,242,241];
  const total=projTotal(p);const date=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  // header band
  doc.setFillColor(...INK);doc.rect(0,0,W,46,'F');
  doc.setFillColor(...TEAL);doc.rect(M,14,3,18,'F');
  let lx=0;if(logo){const h=14,w=Math.min(34,h*logo.w/logo.h);doc.setFillColor(255,255,255);doc.roundedRect(M+7,11,w+4,h+4,2,2,'F');doc.addImage(logo.url,'JPEG',M+9,13,w,h);lx=w+8;}
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(doc.splitTextToSize(CO.name?CO.name.toUpperCase():'SMART HOME BUDGET ESTIMATE',100-lx)[0],M+7+lx,17.5,{charSpace:.6});
  doc.setFontSize(20);doc.text(doc.splitTextToSize(p.name||'Untitled project',110-lx)[0],M+7+lx,27);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(190,205,201);
  doc.text(`${CO.name?(CO.tagline||'Smart home budget estimate')+'   ·   ':''}${estNo(p)}   ·   ${date}`,M+7+lx,33.5);
  doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(190,205,201);doc.text('ESTIMATED TOTAL',W-M,19,{align:'right'});
  doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(255,255,255);doc.text(fmt(total),W-M,28,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(190,205,201);doc.text(`${projCount(p)} items · ${p.rooms.filter(r=>r.items.length).length} rooms`,W-M,34,{align:'right'});
  // info blocks
  let y=56;doc.setTextColor(...MUTE);doc.setFontSize(7.5);doc.setFont('helvetica','bold');
  doc.text('CLIENT',M,y);doc.text('APARTMENT',M+64,y);doc.text(CO.name?'PREPARED BY':'PREPARED',M+128,y);
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(...INK);
  const col=(lines,x)=>{let yy=y+5;lines.filter(Boolean).forEach(l=>{doc.splitTextToSize(l,58).forEach(s=>{doc.text(s,x,yy);yy+=4.6;});});return yy;};
  const y1=col([cl.name,cl.phone,cl.whatsapp&&cl.whatsapp!==cl.phone?'WhatsApp '+cl.whatsapp:'',cl.email,cl.address],M);
  const y2=col([apt.building,[apt.unit&&'Flat '+apt.unit,apt.floor&&'Floor '+apt.floor].filter(Boolean).join(', '),apt.size&&apt.size+' sq ft',apt.address],M+64);
  const valid=+cfg.estimateValidityDays?`Valid for ${cfg.estimateValidityDays} days`:'';
  const wa=CO.whatsapp?'WhatsApp +'+String(CO.whatsapp).replace(/\D/g,''):'';
  const y3=col(CO.name?[CO.name,CO.phone,wa,CO.email,CO.website,CO.address,date,valid]:[date,'Prices in '+(cfg.currency||'BDT'),valid],M+128);
  y=Math.max(y1,y2,y3)+4;doc.setDrawColor(...LINE);doc.line(M,y,W-M,y);y+=8;
  // summary by room
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(...INK);doc.text('Summary by room',M,y);y+=3;
  const rooms=p.rooms.filter(r=>r.items.length);
  doc.autoTable({startY:y,margin:{left:M,right:M},theme:'plain',head:[['Room','Items','Subtotal','Share']],
    body:rooms.map(r=>[r.name,String(r.items.length),fmt(roomTotal(r)),total?(roomTotal(r)/total*100).toFixed(1)+'%':'—']),
    foot:[['Total',String(projCount(p)),fmt(total),'100%']],
    styles:{font:'helvetica',fontSize:9.5,cellPadding:{top:2.4,bottom:2.4,left:2,right:2},textColor:INK,lineColor:LINE},
    headStyles:{fontSize:7.5,textColor:MUTE,fontStyle:'bold'},footStyles:{fontStyle:'bold',textColor:INK},
    columnStyles:{1:{halign:'center',cellWidth:20},2:{halign:'right',cellWidth:42},3:{halign:'right',cellWidth:22}},
    didParseCell:d=>{if(d.section==='head'&&(d.column.index===2||d.column.index===3))d.cell.styles.halign='right';if(d.section==='head'&&d.column.index===1)d.cell.styles.halign='center';},
    didDrawCell:d=>{if(d.section==='body'||d.section==='head'){doc.setDrawColor(...LINE);doc.setLineWidth(.2);doc.line(d.cell.x,d.cell.y+d.cell.height,d.cell.x+d.cell.width,d.cell.y+d.cell.height);}
      if(d.section==='foot'){doc.setDrawColor(...INK);doc.setLineWidth(.5);doc.line(d.cell.x,d.cell.y,d.cell.x+d.cell.width,d.cell.y);}}});
  y=doc.lastAutoTable.finalY+12;
  // per-room detail
  rooms.forEach(r=>{
    if(y>250){doc.addPage();y=20;}
    doc.setFillColor(...SOFT);doc.rect(M,y-5,W-2*M,9,'F');doc.setFillColor(...TEAL);doc.rect(M,y-5,1.6,9,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(...INK);doc.text(r.name,M+5,y+1.2);
    doc.text(fmt(roomTotal(r)),W-M-3,y+1.2,{align:'right'});y+=6;
    const rows=r.items.map(it=>{const l=lineInfo(it);if(!l)return null;const im=l.img?(imgs[l.img]||null):null;
      const nameLines=[l.name+(l.custom?'  (Custom)':''),l.opt,[catLabel(l.cat),l.code&&('Code '+l.code)].filter(Boolean).join('  ·  ')].filter(Boolean).join('\n');
      return {img:im,cells:['',nameLines,l.qtyText.replace('→','=').replace('×','x'),l.onRequest?'—':fmt(l.price),l.onRequest?'On request':fmt(l.amount)]};}).filter(Boolean);
    const imgByRow=new Map(rows.map(x=>[x.cells,x]));
    doc.autoTable({startY:y,margin:{left:M,right:M,top:18},theme:'plain',head:[['','Product','Qty','Unit price','Amount']],body:rows.map(x=>x.cells),rowPageBreak:'avoid',
      styles:{font:'helvetica',fontSize:9,cellPadding:{top:2.6,bottom:2.6,left:2,right:2},textColor:INK,valign:'middle',minCellHeight:15},
      headStyles:{fontSize:7.5,textColor:MUTE,fontStyle:'bold',minCellHeight:7},
      columnStyles:{0:{cellWidth:15},2:{cellWidth:28,halign:'center'},3:{cellWidth:28,halign:'right'},4:{cellWidth:30,halign:'right',fontStyle:'bold'}},
      didParseCell:d=>{if(d.section==='head'){if(d.column.index>=3)d.cell.styles.halign='right';if(d.column.index===2)d.cell.styles.halign='center';}
        if(d.section==='body'&&d.column.index===1){d.cell.styles.fontSize=9;}},
      didDrawCell:d=>{if(d.section==='body'){doc.setDrawColor(...LINE);doc.setLineWidth(.2);doc.line(d.cell.x,d.cell.y+d.cell.height,d.cell.x+d.cell.width,d.cell.y+d.cell.height);
          if(d.column.index===0){const rr=imgByRow.get(d.row.raw);const im=rr?rr.img:null;const s=11.5;const x=d.cell.x+1.2,yy=d.cell.y+(d.cell.height-s)/2;
            if(im){try{doc.addImage(im,'JPEG',x,yy,s,s);}catch(e){}}else{doc.setFillColor(...SOFT);doc.roundedRect(x,yy,s,s,1.5,1.5,'F');doc.setTextColor(...MUTE);doc.setFontSize(6);doc.text('ITEM',x+s/2,yy+s/2+1,{align:'center'});doc.setTextColor(...INK);}}}}});
    y=doc.lastAutoTable.finalY+12;});
  // notes
  const notes=(p.notes||'').trim();
  if(notes){if(y>255){doc.addPage();y=20;}doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...INK);doc.text('Notes',M,y);y+=5;
    doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(...MUTE);doc.splitTextToSize(notes,W-2*M).forEach(l=>{if(y>282){doc.addPage();y=20;}doc.text(l,M,y);y+=4.4;});}
  const req=onRequestCount(p);if(req){y+=2;doc.setFontSize(9);doc.setTextColor(...MUTE);doc.text(`${req} item${req>1?'s are':' is'} priced on request and not included in the total.`,M,y);}
  // footer
  const foot=(cfg.pdfFooter||'').trim()||[CO.name,CO.phone,CO.email,CO.website].filter(Boolean).join('  ·  ')||`${p.name||'Smart home estimate'}  ·  ${estNo(p)}`;
  const n=doc.getNumberOfPages();for(let i=1;i<=n;i++){doc.setPage(i);doc.setFontSize(7.5);doc.setTextColor(...MUTE);doc.setFont('helvetica','normal');
    doc.text(doc.splitTextToSize(foot,W-2*M-30)[0],M,290);doc.text(`Page ${i} of ${n}`,W-M,290,{align:'right'});}
  return doc.output('blob');
}
window.EstimatorPDF={make,toDataURL,safeName,fileName:p=>`${safeName(p.name)} - Smart Home Estimate.pdf`};
})();
