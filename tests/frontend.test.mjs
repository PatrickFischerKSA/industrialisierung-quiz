import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const pause=()=>new Promise(r=>setTimeout(r,20));
async function page(file,scripts,stored={}){const dom=new JSDOM(await readFile('dist/'+file,'utf8'),{url:'http://localhost:8765/'+file,runScripts:'outside-only'});dom.window.fetch=(url,options)=>fetch(url,options);dom.window.AbortSignal=AbortSignal;dom.window.confirm=()=>true;for(const [k,v] of Object.entries(stored))dom.window.sessionStorage.setItem(k,v);for(const script of scripts)vm.runInContext(script==='config.js'?"window.QUIZ_API='http://localhost:8787'":await readFile('dist/'+script,'utf8'),dom.getInternalVMContext());return dom}
const studentScripts=['config.js','questions.js','quiz.js','classroom.js'];
test('student joins, saves every answer, resumes after reload and prevents double scoring',async()=>{
 const r=await fetch('http://localhost:8787/teacher/classes',{method:'POST',headers:{Authorization:'Bearer local-test-key','Content-Type':'application/json'},body:JSON.stringify({label:'UI Funktionstest'})});const {code}=await r.json();let dom;
 try{
 dom=await page('index.html',studentScripts);const w=dom.window;w.document.getElementById('class-code').value=code;w.document.getElementById('alias').value='TestUI';w.document.getElementById('join-form').dispatchEvent(new w.SubmitEvent('submit',{cancelable:true,submitter:w.document.querySelector('#join-form button')}));await pause();await pause();
 assert.equal(w.document.getElementById('class-active').hidden,false);
 w.document.querySelector('.answer').click();await pause();assert.match(w.document.getElementById('sync-status').textContent,/1 von 1/);w.document.querySelector('.answer').click();assert.equal(w.document.getElementById('score').textContent,'1 Punkt');
 const stored=w.sessionStorage.getItem('volldampf-attempt');dom.window.close();dom=await page('index.html',studentScripts,{'volldampf-attempt':stored});await pause();assert.match(dom.window.document.getElementById('counter').textContent,/02/);
 // Simulate a lost connection: the chosen answer remains locally queued.
 dom.window.fetch=()=>Promise.reject(new Error('Offline'));dom.window.document.querySelectorAll('.answer')[2].click();await pause();assert.match(dom.window.document.getElementById('sync-status').textContent,/Noch nicht vollständig/);
 dom.window.fetch=(url,opts)=>fetch(url,opts);dom.window.document.getElementById('retry-sync').click();await pause();assert.match(dom.window.document.getElementById('sync-status').textContent,/2 von 2/);
 const result=await fetch('http://localhost:8787/teacher/classes/'+code,{headers:{Authorization:'Bearer local-test-key'}}).then(r=>r.json());assert.equal(result.attempts[0].answers.length,2);assert.equal(result.attempts[0].score,2);
 // The dashboard safely renders arbitrary nicknames as text and reports partial scores.
 dom.window.close();dom=await page('lehrer.html',['config.js','questions.js','teacher.js']);const d=dom.window.document;d.getElementById('teacher-key').value='local-test-key';d.getElementById('login').dispatchEvent(new dom.window.SubmitEvent('submit',{cancelable:true,submitter:d.querySelector('#login button')}));await pause();d.getElementById('class-select').value=code;d.getElementById('class-select').dispatchEvent(new dom.window.Event('change'));await pause();assert.equal(d.getElementById('stat-attempts').textContent,'1');assert.equal(d.getElementById('stat-complete').textContent,'0');assert.equal(d.getElementById('stat-average').textContent,'–');assert.match(d.getElementById('answer-table').textContent,/TestUI/);assert.equal(d.querySelectorAll('#question-analysis article').length,8);
 }finally{dom?.window.close();await fetch('http://localhost:8787/teacher/classes/'+code,{method:'DELETE',headers:{Authorization:'Bearer local-test-key'}})}
});
