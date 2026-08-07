const days = window.SAO_MIGUEL_DAYS || [];
const cfg = window.APP_CONFIG || {};
let sb = null;
let user = null;
let currentView = 'home';
let lastView = 'home';
let deferredInstall = null;
let readerContext = null;

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const sectionData = [
  { id:'preparacao', title:'Início e preparação', subtitle:'Capa, sumário, pedidos, penitências, propósitos e Grupo dos 72', startPage:1, endPage:12, thumbPage:1, kind:'Seção', pagesLabel:'páginas 1–12' },
  { id:'rosario', title:'Como rezar o Santo Rosário', subtitle:'Orações do Rosário e mistérios com citações bíblicas', startPage:13, endPage:26, thumbPage:13, kind:'Oração', pagesLabel:'páginas 13–26' },
  { id:'oracoes', title:'Orações iniciais e abertura', subtitle:'Orações para todos os dias e abertura dos 40 dias', startPage:27, endPage:32, thumbPage:27, kind:'Oração', pagesLabel:'páginas 27–32' },
  { id:'semana1', title:'Primeira semana', subtitle:'Introdução da semana', startPage:41, endPage:42, thumbPage:41, kind:'Semana', pagesLabel:'páginas 41–42' },
  { id:'semana2', title:'Segunda semana', subtitle:'Introdução da semana', startPage:91, endPage:92, thumbPage:91, kind:'Semana', pagesLabel:'páginas 91–92' },
  { id:'semana3', title:'Terceira semana', subtitle:'Introdução da semana', startPage:141, endPage:142, thumbPage:141, kind:'Semana', pagesLabel:'páginas 141–142' },
  { id:'semana4', title:'Quarta semana', subtitle:'Introdução da semana', startPage:191, endPage:192, thumbPage:191, kind:'Semana', pagesLabel:'páginas 191–192' },
  { id:'semana5', title:'Quinta semana', subtitle:'Introdução da semana', startPage:241, endPage:242, thumbPage:241, kind:'Semana', pagesLabel:'páginas 241–242' },
  { id:'semana6', title:'Sexta semana', subtitle:'Introdução da semana', startPage:291, endPage:292, thumbPage:291, kind:'Semana', pagesLabel:'páginas 291–292' },
  { id:'semana7', title:'Sétima semana', subtitle:'Introdução da semana', startPage:329, endPage:330, thumbPage:329, kind:'Semana', pagesLabel:'páginas 329–330' },
  { id:'complementar', title:'Conteúdo complementar', subtitle:'Guadalupe, orações diversas, explicações catequéticas e agradecimentos', startPage:355, endPage:424, thumbPage:355, kind:'Conteúdo', pagesLabel:'páginas 355–424' }
];

function configured(){
  return !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
}
function localKey(k){ return `sm2026:${k}`; }
function pagePath(page){ return `pages/page-${String(page).padStart(3,'0')}.jpg`; }
function setMsg(el,msg,ok=true){ if(!el) return; el.textContent = msg; el.style.color = ok ? '#4f7a46' : '#8d2b2c'; if(msg){ setTimeout(()=>{ if(el.textContent===msg) el.textContent=''; },2800); } }

async function init(){
  if(configured()){
    sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    const { data } = await sb.auth.getSession();
    if(data.session){ user = data.session.user; showApp(); }
    else showLogin(false);
  } else if(cfg.REQUIRE_LOGIN){
    showLogin(false, 'Configure o Supabase em config.js para ativar o acesso.');
  } else {
    showLogin(true);
  }

  wire();
  renderDays();
  renderSections();
  populateJournalDays();
  updateDashboard();
  loadPrep();
  registerSW();
}

function showLogin(personal, msg=''){
  $('#loginScreen').classList.remove('hidden');
  $('#app').classList.add('hidden');
  $('#personalModeBtn').classList.toggle('hidden', !personal);
  $('#signupBtn').classList.toggle('hidden', !(configured() && cfg.ALLOW_SIGNUP));
  $('#loginForm').classList.toggle('hidden', personal && !configured());
  if(msg) $('#loginMsg').textContent = msg;
}
function showApp(){
  $('#loginScreen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  $('#accountLabel').textContent = user ? user.email : 'Dados salvos neste aparelho';
  $('#logoutBtn').classList.toggle('hidden', !user);
  updateDashboard();
  if(user && sb) syncCloudProgress();
}

async function syncCloudProgress(){
  const { data, error } = await sb.from('journal_entries').select('day,reflection,mass_intention,purpose,rosary_note,completed');
  if(error || !data) return;
  for(const row of data){
    const j = {
      reflection: row.reflection || '',
      mass_intention: row.mass_intention || '',
      purpose: row.purpose || '',
      rosary_note: row.rosary_note || '',
      completed: !!row.completed
    };
    localStorage.setItem(localKey(`journal:${row.day}`), JSON.stringify(j));
  }
  renderDays();
  updateDashboard();
}

function wire(){
  $('#personalModeBtn').onclick = ()=>showApp();
  $('#loginForm').onsubmit = async (e)=>{
    e.preventDefault();
    if(!sb) return;
    setMsg($('#loginMsg'), 'Entrando...');
    const { data, error } = await sb.auth.signInWithPassword({ email: $('#email').value, password: $('#password').value });
    if(error) return setMsg($('#loginMsg'), error.message, false);
    user = data.user;
    showApp();
  };
  $('#signupBtn').onclick = async ()=>{
    if(!sb) return;
    const email = $('#email').value.trim();
    const password = $('#password').value;
    if(!email || password.length < 6) return setMsg($('#loginMsg'),'Informe e-mail e uma senha com pelo menos 6 caracteres.', false);
    const { error } = await sb.auth.signUp({ email, password });
    setMsg($('#loginMsg'), error ? error.message : 'Conta criada. Verifique seu e-mail.', !error);
  };
  $('#logoutBtn').onclick = async ()=>{ if(sb) await sb.auth.signOut(); user = null; showLogin(!configured()); };

  $('#menuBtn').onclick = ()=>openDrawer(true);
  $('#scrim').onclick = ()=>openDrawer(false);
  $$('[data-view]').forEach(btn=> btn.onclick = ()=>{ switchView(btn.dataset.view); openDrawer(false); });
  $$('[data-view-jump]').forEach(btn=> btn.onclick = ()=> switchView(btn.dataset.viewJump));
  $$('[data-open-section]').forEach(btn=> btn.onclick = ()=> openSection(btn.dataset.openSection));

  $('#continueBtn').onclick = ()=> openDay(getSuggestedDay());
  $('#openSuggestedDay').onclick = ()=> openDay(getSuggestedDay());
  $('#backFromReader').onclick = ()=> switchView(lastView || 'home');
  $('#toggleFullscreen').onclick = ()=> toggleFullscreen();
  $('#openDayJournal').onclick = ()=>{
    if(readerContext?.type==='day'){
      $('#journalDay').value = String(readerContext.day);
      loadJournal(readerContext.day);
      switchView('journal');
    }
  };
  $('#markDoneReader').onclick = async ()=>{
    if(readerContext?.type !== 'day') return;
    const j = await getJournal(readerContext.day);
    j.completed = true;
    await saveJournalData(readerContext.day, j);
    renderDays();
    updateDashboard();
    setMsg($('#journalMsg'), 'Dia concluído.');
  };
  $('#prevReaderItem').onclick = ()=>{
    if(readerContext?.type==='day' && readerContext.day > 1) openDay(readerContext.day - 1);
  };
  $('#nextReaderItem').onclick = ()=>{
    if(readerContext?.type==='day' && readerContext.day < 40) openDay(readerContext.day + 1);
  };

  $('#journalDay').onchange = ()=> loadJournal(Number($('#journalDay').value));
  $('#saveJournal').onclick = saveJournalUI;
  $('#savePrep').onclick = savePrepUI;

  window.addEventListener('beforeinstallprompt', e=>{
    e.preventDefault();
    deferredInstall = e;
    $('#installBtn').classList.remove('hidden');
  });
  $('#installBtn').onclick = async ()=>{
    if(!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    $('#installBtn').classList.add('hidden');
  };
}

function openDrawer(open){
  $('#drawer').classList.toggle('open', open);
  $('#scrim').classList.toggle('hidden', !open);
}
function switchView(name){
  if(currentView === 'reader' && name !== 'reader') lastView = name;
  currentView = name;
  $$('.view').forEach(v=>v.classList.remove('active'));
  $(`#${name}View`).classList.add('active');
  $$('[data-view]').forEach(btn=> btn.classList.toggle('active', btn.dataset.view === name));
  $$('.bottom-nav button').forEach(btn=> btn.classList.toggle('active', btn.dataset.view === name));
  if(name === 'journal') loadJournal(Number($('#journalDay').value || getSuggestedDay()));
  if(name === 'prep') loadPrep();
  window.scrollTo({top:0, behavior:'smooth'});
}

function renderDays(){
  const grid = $('#daysGrid');
  grid.innerHTML = '';
  const completed = new Set(getLocalCompleted());
  const today = new Date();
  for(const d of days){
    const btn = document.createElement('button');
    btn.className = 'day-card';
    if(completed.has(d.day)) btn.classList.add('done');
    if(isSameDate(today, new Date(`${d.date}T12:00:00`))) btn.classList.add('today');
    const tags = [];
    if(completed.has(d.day)) tags.push('<span class="done-pill">Concluído</span>');
    if(isSameDate(today, new Date(`${d.date}T12:00:00`))) tags.push('<span class="today-pill">Hoje</span>');
    btn.innerHTML = `
      <div class="day-thumb" style="background-image:url('${pagePath(d.startPage)}')"></div>
      <div class="day-topline">
        <strong>${String(d.day).padStart(2,'0')}º dia</strong>
        <span class="date-chip">${d.startPage}–${d.endPage}</span>
      </div>
      <div class="day-meta">
        <small>${d.dateLabel} · ${d.weekday}</small>
        <small>Páginas ${d.startPage}–${d.endPage}</small>
      </div>
      <div>${tags.join(' ')}</div>
    `;
    btn.onclick = ()=> openDay(d.day);
    grid.appendChild(btn);
  }
}

function renderSections(){
  const grid = $('#sectionsGrid');
  grid.innerHTML = '';
  for(const s of sectionData){
    const btn = document.createElement('button');
    btn.className = 'section-card';
    btn.innerHTML = `
      <div class="section-thumb" style="background-image:url('${pagePath(s.thumbPage)}')"></div>
      <div>
        <h3>${s.title}</h3>
        <p>${s.subtitle}</p>
        <div class="meta">
          <span class="badge">${s.pagesLabel}</span>
          <span class="badge">${s.kind}</span>
        </div>
      </div>
    `;
    btn.onclick = ()=> openSection(s.id);
    grid.appendChild(btn);
  }
}

function openSection(id){
  const s = sectionData.find(x => x.id === id);
  if(!s) return;
  openReader({
    type:'section',
    id:s.id,
    title:s.title,
    subtitle:`${s.subtitle} · ${s.pagesLabel}`,
    startPage:s.startPage,
    endPage:s.endPage,
    badge:s.kind,
    day:null
  });
}
function openDay(dayNumber){
  const d = days.find(x => x.day === dayNumber);
  if(!d) return;
  openReader({
    type:'day',
    day:d.day,
    title:`${String(d.day).padStart(2,'0')}º dia`,
    subtitle:`${d.dateLabel} · ${d.weekday} · páginas ${d.startPage}–${d.endPage}`,
    startPage:d.startPage,
    endPage:d.endPage,
    badge:'Dia',
    date:d.date
  });
}

function openReader(ctx){
  lastView = currentView === 'reader' ? (lastView || 'home') : currentView;
  readerContext = ctx;
  $('#readerTitle').textContent = ctx.title;
  $('#readerSubtitle').textContent = ctx.subtitle;
  $('#readerRangeBadge').textContent = `${ctx.endPage - ctx.startPage + 1} página${ctx.endPage - ctx.startPage + 1 > 1 ? 's' : ''}`;
  $('#readerKindBadge').textContent = ctx.badge;
  $('#openDayJournal').classList.toggle('hidden', ctx.type !== 'day');
  $('#markDoneReader').classList.toggle('hidden', ctx.type !== 'day');
  $('#prevReaderItem').classList.toggle('hidden', ctx.type !== 'day');
  $('#nextReaderItem').classList.toggle('hidden', ctx.type !== 'day');
  $('#prevReaderItem').disabled = !(ctx.type === 'day' && ctx.day > 1);
  $('#nextReaderItem').disabled = !(ctx.type === 'day' && ctx.day < 40);
  renderPageGallery(ctx.startPage, ctx.endPage);
  switchView('reader');
}

function renderPageGallery(startPage, endPage){
  const gallery = $('#pageGallery');
  gallery.innerHTML = '';
  for(let p = startPage; p <= endPage; p++){
    const figure = document.createElement('figure');
    figure.className = 'page-figure';
    figure.innerHTML = `
      <img src="${pagePath(p)}" alt="Página ${p} do itinerário" loading="lazy" decoding="async" />
      <figcaption class="page-caption"><span>Página ${p}</span><span>Leitura digital</span></figcaption>
    `;
    gallery.appendChild(figure);
  }
}

function getSuggestedDay(){
  const now = new Date();
  for(const d of days){
    const end = new Date(`${d.date}T23:59:59`);
    if(now <= end) return d.day;
  }
  return 40;
}
function updateDashboard(){
  const now = new Date();
  const first = new Date(`${days[0].date}T00:00:00`);
  const last = new Date(`${days[days.length-1].date}T23:59:59`);
  const completed = getLocalCompleted();
  let current = getSuggestedDay();
  let status = '';

  if(now < first){
    const diff = Math.ceil((first - now) / 86400000);
    status = `A caminhada começa em ${diff} dia${diff === 1 ? '' : 's'}, em 15 de agosto de 2026.`;
    current = 1;
  } else if(now <= last){
    const todayMatch = [...days].reverse().find(d => new Date(`${d.date}T00:00:00`) <= now);
    current = todayMatch?.day || current;
    status = `Hoje, continue sua caminhada pelo ${String(current).padStart(2,'0')}º dia.`;
  } else {
    current = 40;
    status = 'A jornada de 2026 foi concluída. Você pode revisitar todos os dias e suas anotações.';
  }

  $('#journeyStatus').textContent = status;
  $('#todayDay').textContent = current;
  $('#doneCount').textContent = completed.length;
  $('#progressText').textContent = `${completed.length} de 40`;
  $('#progressFill').style.width = `${(completed.length / 40) * 100}%`;

  const sug = days[current - 1];
  if(sug){
    $('#suggestedDayLabel').textContent = `${String(sug.day).padStart(2,'0')}º dia`;
    $('#suggestedDayTitle').textContent = `${String(sug.day).padStart(2,'0')}º dia`;
    $('#suggestedDayMeta').textContent = `${sug.dateLabel} · ${sug.weekday} · páginas ${sug.startPage}–${sug.endPage}`;
    $('#suggestedDayThumb').style.backgroundImage = `url('${pagePath(sug.startPage)}')`;
  }
}

function populateJournalDays(){
  const select = $('#journalDay');
  select.innerHTML = days.map(d => `<option value="${d.day}">Dia ${String(d.day).padStart(2,'0')} – ${d.dateLabel}</option>`).join('');
  select.value = String(getSuggestedDay());
}

function localJournal(day){
  try { return JSON.parse(localStorage.getItem(localKey(`journal:${day}`))) || {}; }
  catch { return {}; }
}
function getLocalCompleted(){
  const out = [];
  for(let i=1;i<=40;i++) if(localJournal(i).completed) out.push(i);
  return out;
}
async function getJournal(day){
  if(user && sb){
    const { data, error } = await sb.from('journal_entries').select('*').eq('user_id', user.id).eq('day', day).maybeSingle();
    if(!error && data) return data;
  }
  return localJournal(day);
}
async function saveJournalData(day, j){
  const payload = {
    reflection: j.reflection || '',
    mass_intention: j.mass_intention || '',
    purpose: j.purpose || '',
    rosary_note: j.rosary_note || '',
    completed: !!j.completed
  };
  localStorage.setItem(localKey(`journal:${day}`), JSON.stringify(payload));
  if(user && sb){
    await sb.from('journal_entries').upsert({ user_id:user.id, day, ...payload }, { onConflict:'user_id,day' });
  }
}
async function loadJournal(day){
  const d = days.find(x => x.day === day) || days[0];
  $('#journalDate').textContent = `${d.dateLabel} · ${d.weekday}`;
  const j = await getJournal(day);
  $('#reflection').value = j.reflection || '';
  $('#massIntention').value = j.mass_intention || '';
  $('#purpose').value = j.purpose || '';
  $('#rosaryNote').value = j.rosary_note || '';
  $('#completed').checked = !!j.completed;
}
async function saveJournalUI(){
  const day = Number($('#journalDay').value);
  const payload = {
    reflection: $('#reflection').value.trim(),
    mass_intention: $('#massIntention').value.trim(),
    purpose: $('#purpose').value.trim(),
    rosary_note: $('#rosaryNote').value.trim(),
    completed: $('#completed').checked
  };
  await saveJournalData(day, payload);
  renderDays();
  updateDashboard();
  setMsg($('#journalMsg'), 'Diário salvo com sucesso.');
}

function localPrep(){
  try { return JSON.parse(localStorage.getItem(localKey('prep'))) || {}; }
  catch { return {}; }
}
async function loadPrep(){
  let prep = localPrep();
  if(user && sb){
    const { data } = await sb.from('preparation_entries').select('*').eq('user_id', user.id).maybeSingle();
    if(data) prep = data;
  }
  $('#prayerRequests').value = prep.prayer_requests || '';
  $('#penances').value = prep.penances || '';
  $('#improvements').value = prep.improvements || '';
  $('#generalPurpose').value = prep.general_purpose || '';
}
async function savePrepUI(){
  const prep = {
    prayer_requests: $('#prayerRequests').value.trim(),
    penances: $('#penances').value.trim(),
    improvements: $('#improvements').value.trim(),
    general_purpose: $('#generalPurpose').value.trim()
  };
  localStorage.setItem(localKey('prep'), JSON.stringify(prep));
  if(user && sb){
    await sb.from('preparation_entries').upsert({ user_id:user.id, ...prep }, { onConflict:'user_id' });
  }
  setMsg($('#prepMsg'), 'Preparação salva com sucesso.');
}

function isSameDate(a,b){
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
async function toggleFullscreen(){
  const el = $('#readerStage');
  if(!document.fullscreenElement){
    if(el.requestFullscreen) await el.requestFullscreen();
  } else {
    if(document.exitFullscreen) await document.exitFullscreen();
  }
}
function registerSW(){
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=> navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
}

document.addEventListener('DOMContentLoaded', init);
