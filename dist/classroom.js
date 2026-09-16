'use strict';
const API=window.QUIZ_API;
const storage={get(k){try{return sessionStorage.getItem(k)}catch{return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch{}},remove(k){try{sessionStorage.removeItem(k)}catch{}}};
async function api(path,{method='GET',data,token}={}){const res=await fetch(API+path,{method,headers:{...(data?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(15000)});const json=await res.json();if(!res.ok)throw new Error(json.error||'Verbindung fehlgeschlagen.');return json}
let participation=null;try{participation=JSON.parse(storage.get('volldampf-attempt'))}catch{}
let sending=false;
function remember(){storage.set('volldampf-attempt',JSON.stringify(participation))}
function syncMessage(message){const el=document.getElementById('sync-status');if(el)el.textContent=message}
async function syncAnswers(){
 if(!participation||sending)return;
 sending=true;const current=participation;const snapshot=[...current.responses];syncMessage('Antworten werden gespeichert …');
 try{const result=await api(`/attempts/${current.id}`,{method:'PUT',data:{responses:snapshot},token:current.token});if(participation===current){current.saved=result.saved;remember();syncMessage(`${result.saved} von ${current.responses.length} Antworten gespeichert.`)}}
 catch(e){if(participation===current)syncMessage(`Noch nicht vollständig übertragen: ${e.message} Antworten bleiben in diesem Tab. Bitte «Erneut speichern» wählen.`)}
 finally{sending=false}
 if(participation&&(participation!==current||(current.saved===snapshot.length&&current.responses.length>snapshot.length)))void syncAnswers();
}
function captureAnswer(){if(participation){participation.responses=[...responses];remember();void syncAnswers()}}
function restoreParticipation(){if(!participation)return;responses=[...participation.responses];index=responses.length;document.getElementById('join-box').hidden=true;document.getElementById('class-active').hidden=false;document.getElementById('class-label').textContent=`Kürzel ${participation.alias} · Klasse ${participation.code}`;if(index===8)finish();else render();void syncAnswers()}
function createToken(){return [...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('')}
document.getElementById('join-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;const error=document.getElementById('join-error');error.textContent='';const next={id:crypto.randomUUID(),token:createToken(),code:document.getElementById('class-code').value.trim().toUpperCase(),alias:document.getElementById('alias').value.trim(),responses:[],saved:0};try{await api('/attempts',{method:'POST',data:next});participation=next;remember();restoreParticipation();document.getElementById('question').focus()}catch(e){error.textContent=e.message}finally{button.disabled=false}});
document.getElementById('retry-sync').onclick=()=>void syncAnswers();
document.getElementById('leave-class').onclick=()=>{if(participation.saved<participation.responses.length&&!confirm('Noch nicht alle Antworten sind gespeichert. Trotzdem verlassen?'))return;participation=null;storage.remove('volldampf-attempt');document.getElementById('class-active').hidden=true;document.getElementById('join-box').hidden=false;restart()};
const originalRestart=restart;
restart=function(){if(participation){if(participation.saved<participation.responses.length){syncMessage('Bitte zuerst alle Antworten speichern, bevor du einen neuen Versuch startest.');void syncAnswers();return state()}participation=null;storage.remove('volldampf-attempt');document.getElementById('class-active').hidden=true;document.getElementById('join-box').hidden=false;document.getElementById('join-error').textContent='Für einen weiteren erfassten Versuch bitte erneut der Klasse beitreten.'}return originalRestart()};
window.addEventListener('online',()=>void syncAnswers());
const fromLink=new URLSearchParams(location.search).get('klasse');if(fromLink)document.getElementById('class-code').value=fromLink.toUpperCase();
restoreParticipation();
