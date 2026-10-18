import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.resolve('next/package.json'))('sharp');
const line = (x1,y1,x2,y2,w=3)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="black" stroke-width="${w}" fill="none"/>`;
const circle=(cx,cy,r,fill='none',w=3)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="black" stroke-width="${w}"/>`;
const path=(d,fill='none',w=3)=>`<path d="${d}" fill="${fill}" stroke="black" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const frame = body=>`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="960" viewBox="0 0 800 480"><rect width="800" height="480" fill="white"/>${body}</svg>`;
const art=[
['a-place-to-pause','A place to pause',circle(214,124,43,'black')+path('M300 355L370 385L656 403L595 378Z','black',1)+path('M305 250L405 220L475 249L375 280Z','white',4)+path('M305 250L300 145L400 115L405 220','none',5)+path('M300 145L400 115L402 145L302 175Z','black',2)+path('M310 252L300 355M375 280L370 385M470 252L485 355','none',5)+line(164,415,684,415,1)],
['a-small-departure','A small departure',path('M195 280L433 204L379 264L503 299L195 280Z','white',4)+path('M195 280L380 264L347 304Z','black',2)+path('M347 304L379 264L359 332Z','white',3)+path('M141 319Q75 350 136 379Q232 423 238 367Q241 341 211 354Q173 375 281 402','none',2)+circle(591,115,32)],
['after-the-rain','After the rain',path('M230 333Q281 246 332 333T434 333T536 333','none',3)+path('M247 352Q287 328 327 352T407 352T487 352T567 352','none',2)+path('M355 193Q355 142 400 92Q445 142 445 193Q445 254 400 254Q355 254 355 193Z','black',2)+circle(400,310,75)+circle(400,310,105)+line(145,398,655,398,1)],
['the-long-way-home','The long way home',path('M137 375L312 297L312 248L388 213L388 164L463 129L463 80L561 123L561 173L485 208L485 257L410 292L410 341L235 419Z','white',3)+path('M137 375L235 419M312 297L410 341M312 248L410 292M388 213L485 257M388 164L485 208M463 129L561 173M463 80L561 123','none',3)+circle(210,130,32,'black')],
['a-door-to-somewhere','A door to somewhere',path('M305 378V172A95 95 0 0 1 495 172V378Z','black',4)+path('M322 378V174A78 78 0 0 1 478 174V378Z','white',2)+path('M338 378V174Q378 115 430 149V378Z','black',2)+path('M430 149L465 174V378L430 378Z','white',2)+circle(449,273,3,'black',1)+path('M338 378L195 423L353 423L430 378Z','black',1)+line(171,378,630,378,2)],
['in-good-company','In good company',circle(347,200,92)+circle(457,200,92)+Array.from({length:12},(_,i)=>{const y=120+i*14; return line(382,y,422,y,2)}).join('')+path('M214 344Q266 294 318 344T422 344T526 344T630 344','none',3)+line(250,375,570,375,1)],
['a-different-perspective','A different perspective',path('M400 91L556 181L400 271L244 181Z','white',3)+path('M244 181V334L400 424V271Z','black',3)+path('M400 271L556 181V334L400 424Z','white',3)+Array.from({length:10},(_,i)=>line(415+i*13,270-i*7.5,415+i*13,407-i*7.5,1.5)).join('')+circle(632,104,24,'black')],
['somewhere-between','Somewhere between',circle(400,229,126)+Array.from({length:16},(_,i)=>{const y=116+i*15;const dx=Math.sqrt(Math.max(0,126*126-(y-229)*(y-229)));return line(400-dx,y,400+dx,y,2)}).join('')+path('M235 354L400 151L565 354Z','white',4)+path('M400 151L400 354L565 354Z','black',2)+line(165,392,635,392,1)],
];
for(const [id,title,body] of art){const svg=frame(body);writeFileSync(`public/art/${id}.svg`,svg);await sharp(Buffer.from(svg)).png().toFile(`public/art/${id}.png`);}
writeFileSync('lib/artwork.json',JSON.stringify(art.map(([id,title])=>({id,title})),null,2)+'\n');
console.log(`Created ${art.length} original SVG and PNG artworks.`);
