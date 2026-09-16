import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
const base=process.env.TEST_API||'http://localhost:8787';
const teacher=process.env.TEST_TEACHER_KEY||'local-test-key';
async function call(path,{method='GET',token,data,origin}={}){const r=await fetch(base+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`} :{}),...(data?{'Content-Type':'application/json'}:{}),...(origin?{Origin:origin}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json(),headers:r.headers}}
test('class lifecycle, permissions, partial answers, duplicates and statistics',async()=>{
 assert.equal((await call('/teacher/classes')).status,401);
 assert.equal((await call('/teacher/classes',{token:'bad'})).status,401);
 assert.equal((await call('/health',{origin:'https://evil.example'})).status,403);
 assert.equal((await call('/health',{origin:'https://patrickfischerksa.github.io'})).headers.get('access-control-allow-origin'),'https://patrickfischerksa.github.io');
 const room=await call('/teacher/classes',{method:'POST',token:teacher,data:{label:'Automatischer Funktionstest'}});assert.equal(room.status,200);const code=room.data.code;
 try{
 const student={code,id:randomUUID(),alias:'Test-Kürzel',token:randomBytes(32).toString('hex')};
 assert.equal((await call('/attempts',{method:'POST',data:{...student,code:'0000000000'}})).status,404);
 assert.equal((await call('/attempts',{method:'POST',data:student})).status,200);
 assert.equal((await call('/attempts',{method:'POST',data:student})).status,200);
 assert.equal((await call(`/attempts/${student.id}`,{method:'PUT',token:'bad',data:{responses:[0]}})).status,401);
 assert.equal((await call(`/attempts/${student.id}`,{method:'PUT',token:student.token,data:{responses:[99]}})).status,400);
 assert.equal((await call(`/attempts/${student.id}`,{method:'PUT',token:student.token,data:{responses:[0,0]}})).data.saved,2);
 assert.equal((await call(`/attempts/${student.id}`,{method:'PUT',token:student.token,data:{responses:[0,0]}})).data.saved,2);
 assert.equal((await call(`/attempts/${student.id}`,{method:'PUT',token:student.token,data:{responses:[1,0]}})).status,409);
 let view=await call(`/teacher/classes/${code}`,{token:teacher});assert.equal(view.data.attempts.length,1);assert.equal(view.data.attempts[0].score,1);assert.equal(view.data.attempts[0].complete,false);assert.equal(view.data.attempts[0].token_hash,undefined);
 assert.equal((await call(`/teacher/classes/${code}`,{token:student.token})).status,401);
 await call(`/teacher/classes/${code}`,{method:'PATCH',token:teacher,data:{closed:true}});
 assert.equal((await call('/attempts',{method:'POST',data:{...student,id:randomUUID()}})).status,403);
 const responses=[0,0,1,3,0,2,1,3];assert.equal((await call(`/attempts/${student.id}`,{method:'PUT',token:student.token,data:{responses}})).data.saved,8);
 view=await call(`/teacher/classes/${code}`,{token:teacher});assert.equal(view.data.attempts[0].score,7);assert.equal(view.data.attempts[0].complete,true);assert.equal(view.data.attempts[0].answers.length,8);
 }finally{assert.equal((await call(`/teacher/classes/${code}`,{method:'DELETE',token:teacher})).status,200)}
 assert.equal((await call(`/teacher/classes/${code}`,{token:teacher})).status,404);
});
