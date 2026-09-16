const origins = new Set(['https://patrickfischerksa.github.io', 'http://localhost:8765', 'http://localhost:8787']);
const key = [0,2,1,3,0,2,1,3];
const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const fail = (status,message) => {throw Object.assign(new Error(message),{status})};
async function body(request){
 const reader=request.body?.getReader();if(!reader)fail(400,'Leere Anfrage.');let size=0;const chunks=[];
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();fail(413,'Anfrage zu gross.')}chunks.push(value)}
 const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length}
 try{return JSON.parse(new TextDecoder().decode(all))}catch{fail(400,'Ungültige Anfrage.')}
}
const bearer = r => r.headers.get('Authorization')?.replace(/^Bearer /,'') || '';
async function teacher(request,env){
 if(!env.TEACHER_KEY)fail(503,'Lehrerzugang ist noch nicht eingerichtet.');
 const actual=new TextEncoder().encode(await hash(bearer(request)));const expected=new TextEncoder().encode(await hash(env.TEACHER_KEY));
 if(!crypto.subtle.timingSafeEqual(actual,expected))fail(401,'Der Lehrerschlüssel stimmt nicht.');
}
async function route(request,env){
 const u=new URL(request.url),p=u.pathname,m=request.method;
 if(p==='/health'&&m==='GET')return {ok:true};
 if(p.startsWith('/teacher/'))await teacher(request,env);
 if(p==='/teacher/classes'&&m==='GET')return {classes:(await env.DB.prepare('SELECT c.*, COUNT(a.id) AS participants FROM classes c LEFT JOIN attempts a ON a.class_code=c.code GROUP BY c.code ORDER BY c.created_at DESC').all()).results};
 if(p==='/teacher/classes'&&m==='POST'){
  const data=await body(request);if(typeof data.label!=='string'||!data.label.trim()||data.label.length>80)fail(400,'Bitte eine Klassenbezeichnung mit höchstens 80 Zeichen eingeben.');
  const code=crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase();
  await env.DB.prepare('INSERT INTO classes (code,label) VALUES (?,?)').bind(code,data.label.trim()).run();return {code,label:data.label.trim()};
 }
 let match=p.match(/^\/teacher\/classes\/([A-F0-9]{10})$/);
 if(match){const code=match[1];const room=await env.DB.prepare('SELECT * FROM classes WHERE code=?').bind(code).first();if(!room)fail(404,'Klasse nicht gefunden.');
  if(m==='PATCH'){const data=await body(request);if(typeof data.closed!=='boolean')fail(400,'Ungültiger Status.');await env.DB.prepare('UPDATE classes SET closed=? WHERE code=?').bind(data.closed?1:0,code).run();return {ok:true}}
  if(m==='DELETE'){await env.DB.prepare('DELETE FROM classes WHERE code=?').bind(code).run();return {ok:true}}
  if(m==='GET'){
   const attempts=(await env.DB.prepare('SELECT id,alias,created_at,updated_at FROM attempts WHERE class_code=? ORDER BY created_at').bind(code).all()).results;
   const answers=(await env.DB.prepare('SELECT a.attempt_id,a.question,a.choice,a.answered_at FROM answers a JOIN attempts t ON t.id=a.attempt_id WHERE t.class_code=? ORDER BY a.question').bind(code).all()).results;
   return {room,attempts:attempts.map(t=>{const rows=answers.filter(a=>a.attempt_id===t.id);return {...t,answers:rows,score:rows.filter(a=>a.choice===key[a.question]).length,complete:rows.length===8}})};
  }
 }
 if(p==='/attempts'&&m==='POST'){
  const data=await body(request);
  if(typeof data.code!=='string'||!/^[A-F0-9]{10}$/.test(data.code)||typeof data.alias!=='string'||!data.alias.trim()||data.alias.length>24||typeof data.token!=='string'||!/^[a-f0-9]{64}$/.test(data.token)||typeof data.id!=='string'||!/^[a-f0-9-]{36}$/.test(data.id))fail(400,'Bitte Klassencode und ein Kürzel (maximal 24 Zeichen) eingeben.');
  const room=await env.DB.prepare('SELECT * FROM classes WHERE code=?').bind(data.code).first();if(!room)fail(404,'Klassencode nicht gefunden.');
  const tokenHash=await hash(data.token);const existing=await env.DB.prepare('SELECT * FROM attempts WHERE id=?').bind(data.id).first();
  if(existing){if(existing.token_hash!==tokenHash||existing.class_code!==data.code)fail(409,'Teilnahme konnte nicht wiederhergestellt werden.');return {id:existing.id,label:room.label}}
  if(room.closed)fail(403,'Neue Teilnahmen für diese Klasse sind gesperrt.');
  const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM attempts WHERE class_code=?').bind(data.code).first();if(count.n>=1000)fail(409,'Diese Klasse hat die maximale Zahl an Versuchen erreicht.');
  await env.DB.prepare('INSERT INTO attempts (id,class_code,alias,token_hash) VALUES (?,?,?,?)').bind(data.id,data.code,data.alias.trim(),tokenHash).run();return {id:data.id,label:room.label};
 }
 match=p.match(/^\/attempts\/([a-f0-9-]{36})$/);
 if(match&&m==='PUT'){
  const id=match[1];const attempt=await env.DB.prepare('SELECT token_hash FROM attempts WHERE id=?').bind(id).first();if(!attempt||attempt.token_hash!==await hash(bearer(request)))fail(401,'Teilnahme nicht gefunden oder Zugang ungültig.');
  const data=await body(request);if(!Array.isArray(data.responses)||data.responses.length>8||data.responses.some(x=>!Number.isInteger(x)||x<0||x>3))fail(400,'Ungültige Antworten.');
  const prior=(await env.DB.prepare('SELECT question,choice FROM answers WHERE attempt_id=? ORDER BY question').bind(id).all()).results;
  if(prior.some(x=>data.responses[x.question]!==x.choice))fail(409,'Bereits gespeicherte Antworten können nicht verändert werden.');
  const statements=data.responses.map((choice,i)=>env.DB.prepare('INSERT INTO answers (attempt_id,question,choice) VALUES (?,?,?) ON CONFLICT(attempt_id,question) DO NOTHING').bind(id,i,choice));
  statements.push(env.DB.prepare("UPDATE attempts SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(id));await env.DB.batch(statements);
  const saved=(await env.DB.prepare('SELECT question,choice FROM answers WHERE attempt_id=? ORDER BY question').bind(id).all()).results;
  if(saved.some(x=>data.responses[x.question]!==x.choice))fail(409,'Dieser Versuch wurde bereits anders beantwortet.');return {saved:saved.length};
 }
 fail(404,'Nicht gefunden.');
}
export default {async fetch(request,env){
 const origin=request.headers.get('Origin');const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 if(origin&&origins.has(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Max-Age':'600'});
 if(origin&&!origins.has(origin))return new Response(JSON.stringify({error:'Nicht erlaubter Ursprung.'}),{status:403,headers});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 try{
  if(env.LIMITER){const result=await env.LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});if(!result.success)fail(429,'Zu viele Anfragen. Bitte kurz warten.');}
  return new Response(JSON.stringify(await route(request,env)),{headers});
 }catch(error){if(!error.status)console.error(JSON.stringify({event:'request_failed',message:error.message}));return new Response(JSON.stringify({error:error.status?error.message:'Speichern momentan nicht möglich. Bitte erneut versuchen.'}),{status:error.status||500,headers});}
}};
