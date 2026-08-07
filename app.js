const days=window.SAO_MIGUEL_DAYS;const cfg=window.APP_CONFIG||{};let sb=null,user=null,currentView='home',lastView='home',readerDay=null,deferredInstall=null;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const sectionData=[
 {id:'preparacao',icon:'🙏',title:'Início e preparação',sub:'Capa, sumário, pedidos, penitências, propósitos e Grupo dos 72',file:'book/01-inicio-e-preparacao.pdf',pages:'páginas 1-12'},
 {id:'rosario',icon:'📿',title:'Como rezar o Santo Rosário',sub:'Orações do Rosário e mistérios com citações bíblicas',file:'book/02-rosario.pdf',pages:'páginas 13-26'},
 {id:'oracoes',icon:'✝',title:'Orações iniciais e abertura',sub:'Orações para todos os dias e abertura dos 40 dias',file:'book/03-oracoes-iniciais-e-abertura.pdf',pages:'páginas 27-32'},
 {id:'semana1',icon:'Ⅰ',title:'Primeira semana',sub:'Introdução da semana',file:'book/semana-1.pdf',pages:'páginas 41-42'},
 {id:'semana2',icon:'Ⅱ',title:'Segunda semana',sub:'Introdução da semana',file:'book/semana-2.pdf',pages:'páginas 91-92'},
 {id:'semana3',icon:'Ⅲ',title:'Terceira semana',sub:'Introdução da semana',file:'book/semana-3.pdf',pages:'páginas 141-142'},
 {id:'semana4',icon:'Ⅳ',title:'Quarta semana',sub:'Introdução da semana',file:'book/semana-4.pdf',pages:'páginas 191-192'},
 {id:'semana5',icon:'Ⅴ',title:'Quinta semana',sub:'Introdução da semana',file:'book/semana-5.pdf',pages:'páginas 241-242'},
 {id:'semana6',icon:'Ⅵ',title:'Sexta semana',sub:'Introdução da semana',file:'book/semana-6.pdf',pages:'páginas 291-292'},
 {id:'semana7',icon:'Ⅶ',title:'Sétima semana',sub:'Introdução da semana',file:'book/semana-7.pdf',pages:'páginas 329-330'},
 {id:'complementar',icon:'☩',title:'Conteúdo complementar',sub:'Guadalupe, orações diversas, explicações catequéticas e agradecimentos',file:'book/04-conteudo-complementar.pdf',pages:'páginas 355-424'}
];
function configured(){return !!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&window.supabase)}
function localKey(k){return 'sm2026:'+k}
function setMsg(el,msg,ok=true){el.textContent=msg;el.style.color=ok?'#507047':'#9d2929';setTimeout(()=>{if(el.textContent===msg)el.textContent=''},2600)}
async function init(){
 if(configured()){sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);const {data}=await sb.auth.getSession();if(data.session){user=data.session.user;showApp()}else showLogin(false)}
 else if(cfg.REQUIRE_LOGIN){showLogin(false,'Configure o Supabase em config.js para ativar o acesso.')} else showLogin(true);
 renderDays();renderSections();populateJournalDays();wire();updateDashboard();registerSW();
}
function showLogin(personal,msg=''){ $('#loginScreen').classList.remove('hidden');$('#app').classList.add('hidden');$('#personalModeBtn').classList.toggle('hidden',!personal);$('#signupBtn').classList.toggle('hidden',!(configured()&&cfg.ALLOW_SIGNUP));$('#loginForm').classList.toggle('hidden',personal&&!configured());if(msg)$('#loginMsg').textContent=msg }
function showApp(){ $('#loginScreen').classList.add('hidden');$('#app').classList.remove('hidden');$('#accountLabel').textContent=user?user.email:'Dados salvos neste aparelho';$('#logoutBtn').classList.toggle('hidden',!user);updateDashboard();if(user&&sb)syncCloudProgress() }
async function syncCloudProgress(){const {data,error}=await sb.from('journal_entries').select('day,completed');if(error||!data)return;for(const r of data){const j=localJournal(r.day);j.completed=!!r.completed;localStorage.setItem(localKey('journal:'+r.day),JSON.stringify(j))}renderDays();updateDashboard()}
function wire(){
 $('#personalModeBtn').onclick=()=>showApp();
 $('#loginForm').onsubmit=async e=>{e.preventDefault();if(!sb)return;setMsg($('#loginMsg'),'Entrando...');const {data,error}=await sb.auth.signInWithPassword({email:$('#email').value,password:$('#password').value});if(error)return setMsg($('#loginMsg'),error.message,false);user=data.user;showApp()};
 $('#signupBtn').onclick=async()=>{if(!sb)return;const email=$('#email').value,p=$('#password').value;if(!email||p.length<6)return setMsg($('#loginMsg'),'Informe e-mail e uma senha com pelo menos 6 caracteres.',false);const {error}=await sb.auth.signUp({email,password:p});setMsg($('#loginMsg'),error?error.message:'Conta criada. Verifique seu e-mail.',!error)};
 $('#logoutBtn').onclick=async()=>{if(sb)await sb.auth.signOut();user=null;showLogin(!configured())};
 $('#menuBtn').onclick=()=>openDrawer(true);$('#scrim').onclick=()=>openDrawer(false);
 $$('[data-view]').forEach(b=>b.onclick=()=>{switchView(b.dataset.view);openDrawer(false)});$$('[data-view-jump]').forEach(b=>b.onclick=()=>switchView(b.dataset.viewJump));
 $$('[data-open-section]').forEach(b=>b.onclick=()=>openSection(b.dataset.openSection));
 $('#continueBtn').onclick=()=>openDay(getSuggestedDay());
 $('#backFromReader').onclick=()=>switchView(lastView||'journey');
 $('#openDayJournal').onclick=()=>{if(readerDay){$('#journalDay').value=readerDay;loadJournal(readerDay);switchView('journal')}};
 $('#markDoneReader').onclick=async()=>{if(!readerDay)return;let j=await getJournal(readerDay);j.completed=true;await saveJournalData(readerDay,j);updateDashboard();renderDays();setMsg($('#journalMsg'),'Dia concluído.')} ;
 $('#journalDay').onchange=()=>loadJournal(Number($('#journalDay').value));$('#saveJournal').onclick=saveJournalUI;$('#savePrep').onclick=savePrepUI;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('#installBtn').classList.remove('hidden')});$('#installBtn').onclick=async()=>{if(deferredInstall){deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('#installBtn').classList.add('hidden')}};
}
function openDrawer(v){$('#drawer').classList.toggle('open',v);$('#scrim').classList.toggle('hidden',!v)}
function switchView(name){if(currentView==='reader'&&name!=='reader')lastView=name;currentView=name;$$('.view').forEach(v=>v.classList.remove('active'));$(`#${name}View`).classList.add('active');$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='journal')loadJournal(Number($('#journalDay').value||1));if(name==='prep')loadPrep();window.scrollTo({top:0,behavior:'smooth'})}
function renderDays(){const grid=$('#daysGrid');if(!grid)return;grid.innerHTML='';const completed=getLocalCompleted();const today=new Date();days.forEach(d=>{const b=document.createElement('button');b.className='day-card';if(completed.includes(d.day))b.classList.add('done');if(isSameDate(today,new Date(d.date+'T12:00:00')))b.classList.add('today');b.innerHTML=`<span class="num">${String(d.day).padStart(2,'0')}º</span><small>${d.dateLabel}<br>${d.weekday}</small>`;b.onclick=()=>openDay(d.day);grid.appendChild(b)})}
function renderSections(){const g=$('#sectionsGrid');g.innerHTML='';sectionData.forEach(s=>{const b=document.createElement('button');b.className='section-btn';b.innerHTML=`<span class="sec-icon">${s.icon}</span><span><b>${s.title}</b><small>${s.sub} · ${s.pages}</small></span><em>›</em>`;b.onclick=()=>openSection(s.id);g.appendChild(b)})}
function openSection(id){const s=sectionData.find(x=>x.id===id);if(!s)return;lastView=currentView==='reader'?'book':currentView;readerDay=null;$('#readerTitle').textContent=s.title;$('#readerSubtitle').textContent=s.pages;$('#pdfFrame').src=s.file+'#view=FitH';$('#openPdfBtn').href=s.file;$('#readerJournalShortcut').classList.add('hidden');switchView('reader')}
function openDay(n){const d=days[n-1];if(!d)return;lastView=currentView==='reader'?'journey':currentView;readerDay=n;$('#readerTitle').textContent=`${String(n).padStart(2,'0')}º dia` ;$('#readerSubtitle').textContent=`${d.dateLabel} · ${d.weekday} · páginas ${d.startPage}-${d.endPage}`;$('#pdfFrame').src=d.file+'#view=FitH';$('#openPdfBtn').href=d.file;$('#readerJournalShortcut').classList.remove('hidden');switchView('reader')}
function getSuggestedDay(){const now=new Date();for(const d of days){const dt=new Date(d.date+'T23:59:59');if(now<=dt)return d.day}return 40}
function isSameDate(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function updateDashboard(){const now=new Date(),first=new Date(days[0].date+'T00:00:00'),last=new Date(days[39].date+'T23:59:59');let status='';let current='—';if(now<first){const diff=Math.ceil((first-now)/86400000);status=`A caminhada começa em ${diff} dia${diff===1?'':'s'}, em 15 de agosto.`}else if(now<=last){const match=[...days].reverse().find(d=>new Date(d.date+'T00:00:00')<=now);current=match?.day||1;status=`Hoje, continue sua caminhada pelo ${String(current).padStart(2,'0')}º dia.`}else{current=40;status='A jornada de 2026 foi concluída. Você pode revisitar qualquer dia e suas anotações.'}$('#journeyStatus').textContent=status;$('#todayDay').textContent=current;const done=getLocalCompleted();$('#doneCount').textContent=done.length;$('#progressText').textContent=`${done.length} de 40`;$('#progressFill').style.width=`${done.length/40*100}%`}
function populateJournalDays(){const s=$('#journalDay');s.innerHTML=days.map(d=>`<option value="${d.day}">Dia ${String(d.day).padStart(2,'0')}</option>`).join('');s.value=getSuggestedDay()}
function localJournal(day){try{return JSON.parse(localStorage.getItem(localKey('journal:'+day)))||{}}catch{return{}}}
function getLocalCompleted(){const out=[];for(let i=1;i<=40;i++){if(localJournal(i).completed)out.push(i)}return out}
async function getJournal(day){if(user&&sb){const {data,error}=await sb.from('journal_entries').select('*').eq('user_id',user.id).eq('day',day).maybeSingle();if(!error&&data)return data}return localJournal(day)}
async function saveJournalData(day,j){j={reflection:j.reflection||'',mass_intention:j.mass_intention||'',purpose:j.purpose||'',rosary_note:j.rosary_note||'',completed:!!j.completed};localStorage.setItem(localKey('journal:'+day),JSON.stringify(j));if(user&&sb){await sb.from('journal_entries').upsert({user_id:user.id,day,...j,updated_at:new Date().toISOString()},{onConflict:'user_id,day'})}}
async function loadJournal(day){const d=days[day-1];$('#journalDate').textContent=d?`${d.dateLabel} · ${d.weekday}`:'';const j=await getJournal(day);$('#reflection').value=j.reflection||'';$('#massIntention').value=j.mass_intention||'';$('#purpose').value=j.purpose||'';$('#rosaryNote').value=j.rosary_note||'';$('#completed').checked=!!j.completed}
async function saveJournalUI(){const day=Number($('#journalDay').value);await saveJournalData(day,{reflection:$('#reflection').value,mass_intention:$('#massIntention').value,purpose:$('#purpose').value,rosary_note:$('#rosaryNote').value,completed:$('#completed').checked});setMsg($('#journalMsg'),'Diário salvo.');renderDays();updateDashboard()}
function localPrep(){try{return JSON.parse(localStorage.getItem(localKey('prep')))||{}}catch{return{}}}
async function getPrep(){if(user&&sb){const {data,error}=await sb.from('preparation').select('*').eq('user_id',user.id).maybeSingle();if(!error&&data)return data}return localPrep()}
async function loadPrep(){const p=await getPrep();$('#prayerRequests').value=p.prayer_requests||'';$('#penances').value=p.penances||'';$('#improvements').value=p.improvements||'';$('#generalPurpose').value=p.general_purpose||''}
async function savePrepUI(){const p={prayer_requests:$('#prayerRequests').value,penances:$('#penances').value,improvements:$('#improvements').value,general_purpose:$('#generalPurpose').value};localStorage.setItem(localKey('prep'),JSON.stringify(p));if(user&&sb)await sb.from('preparation').upsert({user_id:user.id,...p,updated_at:new Date().toISOString()});setMsg($('#prepMsg'),'Preparação salva.')}
function registerSW(){if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{})}
init();