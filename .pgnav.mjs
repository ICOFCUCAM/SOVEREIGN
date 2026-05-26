import { chromium } from 'playwright-core';
const URL=process.argv[2], Y=parseInt(process.argv[3]||'900',10), OUT=process.argv[4];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--disable-gpu','--ignore-certificate-errors']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1.5,ignoreHTTPSErrors:true});
const CORS={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
const PROD=[
 {id:'civicos',slug:'civicos',name:'CIVICOS',category:'Sovereign Operating Infrastructure',accent:'#6366F1',tagline:'Whole-of-government coordination.',sort_order:2,is_featured:true,capabilities:['Situation room','Ministry mesh'],metrics:[{label:'Ministries',value:'11'}],tiers:[{tier:'Core',price:'$8M',label:'Sovereign OS',scope:'Full governance',timeline:'90 days'},{tier:'Prime',price:'$1B+',label:'Civilization',scope:'Dedicated cloud',timeline:'12 months'}]},
 {id:'g1',slug:'veritas-os',name:'Veritas OS',category:'Government runtime',accent:'#6366F1',tagline:'Whole-of-government execution.',sort_order:1,metrics:[{label:'Institutions',value:'11'}],tiers:[{tier:'Core',price:'$8M'}]},
 {id:'f1',slug:'veritas-banking',name:'Veritas Banking',category:'fintech',accent:'#10B981',tagline:'Sovereign settlement rails.',sort_order:3,metrics:[{label:'TPS',value:'1.2M'}]},
 {id:'m1',slug:'flyttgo',name:'FlyttGo',category:'logistics',accent:'#F59E0B',tagline:'Planetary logistics.',sort_order:5,metrics:[{label:'Routes',value:'214'}]},
 {id:'i1',slug:'govmesh',name:'GovMesh.AI',category:'ai',accent:'#7C4DFF',tagline:'Cognitive intelligence.',sort_order:4,metrics:[{label:'Models',value:'1.2K'}]},
 {id:'e1',slug:'elecpro',name:'ElecPro',category:'Electoral systems',accent:'#22D3EE',tagline:'Verifiable elections.',sort_order:6,metrics:[{label:'Ballots',value:'92M'}]},
 {id:'ed1',slug:'civicos-education',name:'CIVICOS Education',category:'education',accent:'#22D3EE',tagline:'Learning & credentials.',sort_order:7,metrics:[{label:'Learners',value:'40M'}]},
];
await p.route('**/rest/v1/**',r=>{const u=r.request().url();if(r.request().method()==='OPTIONS')return r.fulfill({status:204,headers:CORS,body:''});let body='[]';if(u.includes('/ecosystem_products'))body=u.includes('slug')?JSON.stringify(PROD[0]):JSON.stringify(PROD);r.fulfill({status:200,headers:{...CORS,'content-type':'application/json'},body});});
await p.route('**/functions/v1/**',r=>r.fulfill({status:200,headers:{...CORS,'content-type':'application/json'},body:'{}'}));
await p.goto(URL,{waitUntil:'load'});await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});await p.waitForTimeout(2200);
await p.evaluate(y=>window.scrollTo(0,y),Y);await p.waitForTimeout(900);
await p.screenshot({path:OUT});await b.close();console.log('ok',URL,Y);
