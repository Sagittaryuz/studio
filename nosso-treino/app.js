const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const SEQUENCE = ['A', 'C', 'B', 'D'];
const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const WORKOUTS = {
  A: {
    title: 'Posteriores + glúteos',
    focus: 'Cadeia posterior e estabilidade do quadril',
    exercises: [
      ['Elevação pélvica', 4, '8–12', 90], ['Terra romeno', 3, '8–10', 90],
      ['Mesa flexora', 3, '10–12', 75], ['Afundo búlgaro', 3, '10/cada', 75],
      ['Coice no cabo', 3, '12–15', 60], ['Cadeira abdutora', 3, '15–20', 45]
    ]
  },
  B: {
    title: 'Anteriores + panturrilha',
    focus: 'Quadríceps, controle unilateral e panturrilhas',
    exercises: [
      ['Agachamento hack/Smith', 4, '8–12', 90], ['Leg press 45°', 3, '10–12', 90],
      ['Cadeira extensora', 3, '12–15', 60], ['Passada reversa', 3, '10/cada', 75],
      ['Panturrilha em pé', 4, '10–15', 60], ['Panturrilha sentada', 3, '12–20', 45]
    ]
  },
  C: {
    title: 'Peito + tríceps + ombro',
    focus: 'Empurrar com estabilidade escapular',
    exercises: [
      ['Supino reto', 4, '8–12', 90], ['Supino inclinado', 3, '8–12', 75],
      ['Crucifixo máquina/cabo', 3, '12–15', 60], ['Desenvolvimento máquina', 3, '8–12', 75],
      ['Elevação lateral', 3, '12–20', 45], ['Tríceps na corda', 3, '10–15', 60]
    ]
  },
  D: {
    title: 'Costas + bíceps + ombro posterior',
    focus: 'Puxar e estabilizar as escápulas',
    exercises: [
      ['Puxada alta', 4, '8–12', 90], ['Remada baixa', 3, '8–12', 75],
      ['Remada apoiada', 3, '10–12', 75], ['Face pull', 3, '12–15', 60],
      ['Rosca direta', 3, '10–12', 60], ['Rosca martelo', 3, '10–12', 60]
    ]
  }
};

const state = {
  authMode: 'login', user: null, data: null, route: 'home',
  location: 'unknown', distance: null, timer: null, modal: null,
  installPrompt: null, accountName: null, accountEmail: null, authProvider: 'local'
};

const defaultData = () => ({
  version: 2,
  next: 0,
  gym: { lat: null, lng: null, radius: 180 },
  sessions: [],
  active: null,
  settings: { rest: 0 }
});

function dataKey(user) { return `nt_${user}`; }
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}
function getUsers() {
  try { return JSON.parse(localStorage.getItem('nt_users') || '{}'); }
  catch { return {}; }
}
function loadData(user) {
  try {
    const saved = JSON.parse(localStorage.getItem(dataKey(user)) || '{}');
    return {
      ...defaultData(), ...saved,
      gym: { ...defaultData().gym, ...(saved.gym || {}) },
      settings: { ...defaultData().settings, ...(saved.settings || saved.set || {}) }
    };
  } catch { return defaultData(); }
}
function saveData() { localStorage.setItem(dataKey(state.user), JSON.stringify(state.data)); }

async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function handleAuth(event) {
  event.preventDefault();
  const user = $('#user').value.trim().toLowerCase();
  const pass = $('#pass').value;
  const message = $('#msg');
  const validUser = /^[a-z0-9._-]{3,30}$/.test(user);

  if (!validUser) {
    message.textContent = 'Use 3 a 30 letras, números, ponto, traço ou sublinhado.';
    return;
  }

  const users = getUsers();
  const passwordHash = await hash(pass);
  if (state.authMode === 'create') {
    if (users[user]) { message.textContent = 'Este usuário já existe neste aparelho.'; return; }
    users[user] = passwordHash;
    localStorage.setItem('nt_users', JSON.stringify(users));
    localStorage.setItem('nt_session', user);
    login(user);
    return;
  }

  if (users[user] !== passwordHash) {
    message.textContent = 'Usuário ou senha incorretos.';
    return;
  }
  localStorage.setItem('nt_session', user);
  login(user);
}

function login(user, { name = user, email = null, provider = 'local' } = {}) {
  state.user = user;
  state.accountName = name;
  state.accountEmail = email;
  state.authProvider = provider;
  state.data = loadData(user);
  $('#auth').classList.add('hidden');
  $('#shell').classList.remove('hidden');
  $('#profile').textContent = name[0].toUpperCase();
  render();
  if (state.data.gym.lat !== null) checkLocation(false);
}

function loginWithGoogle(user) {
  if (!user?.uid) return;
  login(`google_${user.uid}`, {
    name: user.displayName || user.email?.split('@')[0] || 'Atleta',
    email: user.email || null,
    provider: 'google'
  });
}

async function logout() {
  localStorage.removeItem('nt_session');
  await window.ntGoogleSignOut?.();
  location.reload();
}

async function handleGoogleLogin() {
  const button = $('#google-login');
  const message = $('#msg');
  if (!window.ntGoogleSignIn) {
    message.textContent = 'O acesso pelo Google ainda está carregando. Tente novamente.';
    return;
  }

  button.disabled = true;
  button.lastChild.textContent = ' Conectando…';
  message.textContent = '';
  try {
    const user = await window.ntGoogleSignIn();
    loginWithGoogle(user);
  } catch (error) {
    message.dataset.authError = error?.code || 'auth/unknown';
    if (error?.code !== 'auth/popup-closed-by-user') {
      message.textContent = error?.code === 'auth/unauthorized-domain'
        ? 'Este endereço ainda precisa ser autorizado no Firebase.'
        : 'Não foi possível entrar com o Google. Tente novamente.';
    }
  } finally {
    button.disabled = false;
    button.lastChild.textContent = ' Continuar com Google';
  }
}

function navigate(route) {
  state.route = route;
  $$('.dock button').forEach((button) => {
    const active = button.dataset.route === route;
    button.classList.toggle('active', active);
    active ? button.setAttribute('aria-current', 'page') : button.removeAttribute('aria-current');
  });
  render();
  scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  $('#main').focus({ preventScroll: true });
}

function currentWorkoutId() { return SEQUENCE[state.data.next % SEQUENCE.length]; }
function activeWorkoutId() { return state.data.active?.id || currentWorkoutId(); }
function adjustedRest(seconds) { return Math.max(15, seconds + (state.data.settings.rest || 0)); }
function restLabel(value) { return value ? `${value > 0 ? '+' : ''}${value}s` : 'Padrão'; }

function render() {
  if (!state.user) return;
  const hour = new Date().getHours();
  $('#hello').textContent = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  $('#title').textContent = { home: 'Nosso Treino', work: 'Treino', history: 'Histórico', control: 'Central de Controle', profile: 'Perfil' }[state.route];
  updateLocationButton();
  $('#main').innerHTML = ({ home: renderHome, work: renderWorkout, history: renderHistory, control: renderControl, profile: renderProfile }[state.route] || renderHome)();
  bindPageEvents();
}

function renderHome() {
  const id = currentWorkoutId();
  const workout = WORKOUTS[id];
  const thisWeek = sessionsThisWeek().length;
  const missed = missedTrainingDays();
  return `
    <section class="hero">
      <span class="hero-status">${state.location === 'inside' ? '● PRESENÇA CONFIRMADA' : 'DAYTONA CT · PLANO CONTÍNUO'}</span>
      <h2>Consistência vence a perfeição.</h2>
      <p>Se um dia não der certo, nada se perde. O próximo treino continua exatamente de onde vocês pararam.</p>
    </section>
    <div class="grid">
      <article class="card metric"><small>Treinos na semana</small><strong>${thisWeek}</strong></article>
      <article class="card metric"><small>Próximo treino</small><strong>${id}</strong></article>
    </div>
    <div class="section-title"><h3>Treino recomendado</h3><span>aprox. 1h15</span></div>
    <button class="card today-card" id="open-workout" type="button">
      <span class="workout-letter">${id}</span>
      <span><h3>${workout.title}</h3><p>${workout.focus}</p></span>
      <strong aria-hidden="true">›</strong>
    </button>
    ${missed ? `<div class="notice">A sequência foi mantida após ${missed} dia(s) de treino não concluído(s). O próximo continua sendo o treino ${id}.</div>` : ''}
    <div class="section-title"><h3>Esta semana</h3><span>segunda a sábado</span></div>
    <div class="week">${renderWeek()}</div>
    <div class="section-title"><h3>Presença</h3><span>localização opcional</span></div>
    <article class="card">
      ${state.data.gym.lat !== null
        ? `<strong>Academia configurada</strong><p class="muted">Presença confirmada dentro de ${state.data.gym.radius} metros.</p><button class="button secondary" id="check-location" type="button">Verificar agora</button>`
        : `<strong>Configure quando estiver na academia</strong><p class="muted">O local é salvo apenas neste aparelho.</p><button class="button primary" id="set-gym" type="button">Usar este local como academia</button>`}
    </article>`;
}

function renderWeek() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return [0, 1, 2, 3, 4, 5].map((offset) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + offset);
    const key = dateKey(day);
    const done = state.data.sessions.some((session) => dateKey(new Date(session.end || session.start)) === key);
    return `<div class="day ${key === dateKey(now) ? 'today' : ''} ${done ? 'done' : ''}"><small>${WEEK_DAYS[day.getDay()]}</small><b>${done ? '✓' : day.getDate()}</b></div>`;
  }).join('');
}

function renderWorkout() {
  const id = activeWorkoutId();
  const workout = WORKOUTS[id];
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise[1], 0);
  const doneSets = Object.values(state.data.active?.done || {}).reduce((sum, value) => sum + value, 0);
  const progress = Math.min(100, Math.round((doneSets / totalSets) * 100));
  return `
    <div class="page-heading"><small>${state.data.active ? 'SESSÃO EM ANDAMENTO' : 'TREINO RECOMENDADO'}</small><h2>Treino ${id}</h2><p class="muted">${workout.focus}</p></div>
    <article class="card summary">
      <span class="workout-letter">${id}</span>
      <span><h2>${workout.title}</h2><p>${doneSets} de ${totalSets} séries concluídas</p><progress class="progress-track" max="100" value="${progress}" aria-label="${progress}% do treino concluído"></progress></span>
    </article>
    <div class="exercise-list">${workout.exercises.map((exercise, index) => renderExercise(exercise, index)).join('')}</div>
    <button class="button primary full" id="${state.data.active ? 'finish-workout' : 'start-workout'}" type="button">${state.data.active ? 'Finalizar treino' : `Iniciar treino ${id}`}</button>`;
}

function renderExercise(exercise, index) {
  const completed = Math.min(state.data.active?.done?.[index] || 0, exercise[1]);
  return `<article class="card exercise">
    <span class="exercise-icon" aria-hidden="true">${completed === exercise[1] ? '✓' : '↗'}</span>
    <span><h4>${index + 1}. ${exercise[0]}</h4><span class="chips"><span class="chip">${exercise[1]} séries</span><span class="chip">${exercise[2]} rep.</span><span class="chip">${adjustedRest(exercise[3])}s</span></span></span>
    <button class="exercise-open" data-exercise="${index}" type="button">${completed ? `${completed}/${exercise[1]}` : 'Abrir'}</button>
  </article>`;
}

function renderHistory() {
  const sessions = [...state.data.sessions].reverse();
  const minutes = sessions.reduce((sum, session) => sum + Math.max(1, Math.round((session.end - session.start) / 60000)), 0);
  return `
    <div class="page-heading"><small>EVOLUÇÃO NESTE APARELHO</small><h2>Histórico</h2><p class="muted">Cada treino concluído aparece aqui.</p></div>
    <div class="grid"><article class="card metric"><small>Treinos</small><strong>${sessions.length}</strong></article><article class="card metric"><small>Tempo total</small><strong>${minutes}<small> min</small></strong></article></div>
    <div class="section-title"><h3>Últimas sessões</h3></div>
    <article class="card">${sessions.length ? sessions.map((session) => {
      const duration = Math.max(1, Math.round((session.end - session.start) / 60000));
      return `<div class="history-row"><span class="history-badge">${session.id}</span><span><strong>${WORKOUTS[session.id].title}</strong><p>${session.loc ? 'Local confirmado' : 'Sem confirmação de local'} · ${duration} min</p></span><small>${new Date(session.end).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</small></div>`;
    }).join('') : '<p class="muted">Nenhum treino concluído ainda.</p>'}</article>`;
}

function renderControl() {
  return `
    <div class="page-heading"><small>AJUSTES DE TREINO</small><h2>Central de Controle</h2><p class="muted">Personalize os intervalos e a confirmação de presença.</p></div>
    <div class="control-grid">
      <article class="card control-card"><div><span class="control-icon">◷</span><h3>Descanso</h3><p class="muted">Ajuste aplicado a todos os exercícios.</p></div><div><div class="range-head"><span>Ajuste</span><b id="rest-value">${restLabel(state.data.settings.rest)}</b></div><input id="rest-range" type="range" min="-15" max="30" step="15" value="${state.data.settings.rest}" aria-label="Ajuste do descanso"></div></article>
      <article class="card control-card"><div><span class="control-icon">⌖</span><h3>Raio da academia</h3><p class="muted">Distância para confirmar presença.</p></div><div><div class="range-head"><span>Raio</span><b id="radius-value">${state.data.gym.radius} m</b></div><input id="radius-range" type="range" min="80" max="500" step="20" value="${state.data.gym.radius}" aria-label="Raio da academia"></div></article>
    </div>
    <div class="section-title"><h3>Localização</h3><span>opcional</span></div>
    <div class="card button-stack"><button class="button primary" id="set-gym" type="button">Atualizar academia para este local</button><button class="button secondary" id="check-location" type="button">Verificar agora</button></div>
    <div class="section-title"><h3>Dados</h3><span>backup deste usuário</span></div>
    <div class="card button-stack"><button class="button secondary" id="export-data" type="button">Baixar backup</button><button class="button secondary" id="import-data" type="button">Restaurar backup</button><button class="button danger" id="clear-data" type="button">Apagar meus treinos</button></div>`;
}

function renderProfile() {
  const account = state.authProvider === 'google'
    ? `<strong>Conta Google</strong><p class="muted">${escapeHtml(state.accountName)}${state.accountEmail ? `<br>${escapeHtml(state.accountEmail)}` : ''}</p>`
    : `<strong>Usuário</strong><p class="muted">${escapeHtml(state.accountName)}</p>`;
  return `<div class="page-heading"><small>CONTA DESTE APARELHO</small><h2>Perfil</h2></div><article class="card">${account}<p class="privacy-note left">Os treinos continuam salvos somente neste aparelho.</p><button class="button secondary full" id="logout" type="button">Sair</button></article>`;
}

function bindPageEvents() {
  $('#open-workout')?.addEventListener('click', () => navigate('work'));
  $('#start-workout')?.addEventListener('click', startWorkout);
  $('#finish-workout')?.addEventListener('click', finishWorkout);
  $$('.exercise-open').forEach((button) => button.addEventListener('click', () => openExercise(Number(button.dataset.exercise))));
  $('#set-gym')?.addEventListener('click', setGymLocation);
  $('#check-location')?.addEventListener('click', () => checkLocation(true));
  $('#logout')?.addEventListener('click', logout);
  $('#rest-range')?.addEventListener('input', (event) => {
    state.data.settings.rest = Number(event.target.value); $('#rest-value').textContent = restLabel(state.data.settings.rest); saveData();
  });
  $('#radius-range')?.addEventListener('input', (event) => {
    state.data.gym.radius = Number(event.target.value); $('#radius-value').textContent = `${state.data.gym.radius} m`; saveData();
  });
  $('#export-data')?.addEventListener('click', exportBackup);
  $('#import-data')?.addEventListener('click', () => $('#backup-file').click());
  $('#clear-data')?.addEventListener('click', clearTrainingData);
}

function startWorkout() {
  const id = currentWorkoutId();
  state.data.active = { id, start: Date.now(), done: {}, loc: state.location === 'inside' };
  saveData(); render(); showToast(`Treino ${id} iniciado.`);
}

function finishWorkout() {
  const session = state.data.active;
  if (!session) return;
  const workout = WORKOUTS[session.id];
  const total = workout.exercises.reduce((sum, exercise) => sum + exercise[1], 0);
  const done = Object.values(session.done || {}).reduce((sum, value) => sum + value, 0);
  if (done < total && !confirm(`Você concluiu ${done} de ${total} séries. Finalizar mesmo assim?`)) return;
  session.end = Date.now();
  state.data.sessions.push(session);
  state.data.active = null;
  state.data.next = (state.data.next + 1) % SEQUENCE.length;
  saveData(); navigate('home'); showToast(`Treino concluído. O próximo é o ${currentWorkoutId()}.`);
}

function openExercise(index) {
  if (!state.data.active) startWorkout();
  const session = state.data.active;
  const exercise = WORKOUTS[session.id].exercises[index];
  const completed = session.done[index] || 0;
  state.modal = { index, mode: completed >= exercise[1] ? 'done' : 'ready', startedAt: 0, endsAt: 0 };
  $('#backdrop').classList.remove('hidden');
  $('#sheet').classList.remove('hidden');
  $('#sheet').innerHTML = `<div class="sheet-handle"></div><div class="sheet-head"><div><h3 id="sheet-title">${exercise[0]}</h3><p id="sheet-subtitle">Série ${Math.min(completed + 1, exercise[1])} de ${exercise[1]} · ${exercise[2]} repetições</p></div><button class="icon-button" id="close-sheet" type="button" aria-label="Fechar">×</button></div><div class="exercise-demo">${exerciseFigure()}</div><div class="timer"><small id="timer-label">Pronto para iniciar</small><div class="time" id="timer-value">00:00</div><div class="timer-actions" id="timer-actions"></div></div>`;
  $('#close-sheet').addEventListener('click', closeSheet);
  clearInterval(state.timer);
  updateTimer();
  state.timer = setInterval(updateTimer, 250);
  $('#close-sheet').focus();
}

function updateTimer() {
  if (!state.modal) return;
  const session = state.data.active;
  const exercise = WORKOUTS[session.id].exercises[state.modal.index];
  const completed = session.done[state.modal.index] || 0;
  const label = $('#timer-label'); const value = $('#timer-value'); const actions = $('#timer-actions');

  if (state.modal.mode === 'work') {
    const seconds = Math.floor((Date.now() - state.modal.startedAt) / 1000);
    label.textContent = 'Série em execução'; value.textContent = formatTime(seconds);
    setTimerActions('<button class="button secondary" id="cancel-set">Cancelar</button><button class="button primary" id="complete-set">Concluir série</button>');
    $('#cancel-set').onclick = () => { state.modal.mode = 'ready'; updateTimer(); };
    $('#complete-set').onclick = () => {
      session.done[state.modal.index] = Math.min(exercise[1], completed + 1); saveData();
      if (session.done[state.modal.index] >= exercise[1]) state.modal.mode = 'done';
      else { state.modal.mode = 'rest'; state.modal.endsAt = Date.now() + adjustedRest(exercise[3]) * 1000; }
      updateTimer();
    };
    return;
  }

  if (state.modal.mode === 'rest') {
    const seconds = Math.max(0, Math.ceil((state.modal.endsAt - Date.now()) / 1000));
    label.textContent = 'Descanso · próxima série'; value.textContent = formatTime(seconds);
    setTimerActions('<button class="button secondary" id="more-rest">+15s</button><button class="button primary" id="skip-rest">Pular</button>');
    $('#more-rest').onclick = () => { state.modal.endsAt += 15000; };
    $('#skip-rest').onclick = () => { state.modal.mode = 'ready'; updateTimer(); };
    if (!seconds) { notifyRestFinished(); state.modal.mode = 'ready'; updateTimer(); }
    return;
  }

  if (state.modal.mode === 'done') {
    label.textContent = 'Exercício concluído'; value.textContent = '✓';
    setTimerActions('<button class="button primary wide" id="back-workout">Voltar ao treino</button>');
    $('#back-workout').onclick = closeSheet;
    return;
  }

  label.textContent = completed ? `Próxima série: ${completed + 1} de ${exercise[1]}` : 'Pronto para iniciar';
  value.textContent = '00:00';
  setTimerActions('<button class="button primary wide" id="begin-set">Iniciar série</button>');
  $('#begin-set').onclick = () => { state.modal.mode = 'work'; state.modal.startedAt = Date.now(); updateTimer(); };
}

function setTimerActions(html) {
  const actions = $('#timer-actions');
  if (actions.dataset.view !== html) { actions.innerHTML = html; actions.dataset.view = html; }
}

function closeSheet() {
  clearInterval(state.timer); state.timer = null; state.modal = null;
  $('#backdrop').classList.add('hidden'); $('#sheet').classList.add('hidden'); render();
}

function exerciseFigure() {
  return `<svg viewBox="0 0 200 200" aria-label="Demonstração simplificada do movimento"><g fill="none" stroke-linecap="round"><path d="M35 170H165" stroke="#ffffff22" stroke-width="4"/><g class="motion"><circle cx="100" cy="48" r="13" fill="#d4ffe2" stroke="#082718" stroke-width="4"/><path d="M100 62L98 112M98 78L70 98M98 78L128 96M98 112L78 151M98 112L126 151" stroke="#d4ffe2" stroke-width="10"/><path d="M55 96H145M62 87V105M138 87V105" stroke="#ffcf84" stroke-width="7"/></g></g></svg>`;
}

function notifyRestFinished() {
  navigator.vibrate?.([180, 80, 180]);
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.frequency.value = 880; gain.gain.value = .08; oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + .25);
  } catch { /* Som não é essencial. */ }
  showToast('Descanso concluído.');
}

function getPosition() {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000 }));
}

async function setGymLocation() {
  if (!navigator.geolocation) { showToast('Este aparelho não oferece localização.'); return; }
  try {
    showToast('Obtendo sua localização…'); const position = await getPosition();
    state.data.gym.lat = position.coords.latitude; state.data.gym.lng = position.coords.longitude; saveData();
    showToast('Academia definida neste local.'); await checkLocation(false);
  } catch { showToast('Autorize a localização nas configurações do navegador.'); }
}

async function checkLocation(showResult) {
  if (state.data.gym.lat === null) { if (showResult) showToast('Defina primeiro o local da academia.'); return; }
  try {
    const position = await getPosition();
    state.distance = distanceInMeters(position.coords.latitude, position.coords.longitude, state.data.gym.lat, state.data.gym.lng);
    state.location = state.distance <= state.data.gym.radius ? 'inside' : 'outside';
    if (showResult) showToast(state.location === 'inside' ? 'Presença confirmada.' : `Você está a ${Math.round(state.distance)} m da academia.`);
    render();
  } catch { if (showResult) showToast('Não foi possível obter a localização.'); }
}

function updateLocationButton() {
  const button = $('#loc');
  button.textContent = state.location === 'inside' ? 'Na academia' : state.location === 'outside' ? `${Math.round(state.distance)} m` : state.data.gym.lat !== null ? 'Verificar local' : 'Definir local';
  button.classList.toggle('inside', state.location === 'inside');
}

function distanceInMeters(lat1, lng1, lat2, lng2) {
  const radians = (value) => value * Math.PI / 180; const radius = 6371000;
  const x = radians(lat2 - lat1); const y = radians(lng2 - lng1);
  const a = Math.sin(x / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(y / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(a));
}

function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function sessionsThisWeek() {
  const now = new Date(); const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday); nextMonday.setDate(monday.getDate() + 7);
  return state.data.sessions.filter((session) => new Date(session.end) >= monday && new Date(session.end) < nextMonday);
}
function missedTrainingDays() {
  if (!state.data.sessions.length) return 0;
  const last = new Date(Math.max(...state.data.sessions.map((session) => session.end)));
  const cursor = new Date(last); cursor.setHours(0, 0, 0, 0); cursor.setDate(cursor.getDate() + 1);
  const today = new Date(); today.setHours(0, 0, 0, 0); let count = 0;
  while (cursor < today) { if ([1, 2, 3, 4, 5, 6].includes(cursor.getDay())) count += 1; cursor.setDate(cursor.getDate() + 1); }
  return Math.min(count, 6);
}
function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }

function exportBackup() {
  const backup = { app: 'Nosso Treino', version: 2, exportedAt: new Date().toISOString(), user: state.user, data: state.data };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `nosso-treino-${dateKey(new Date())}.json`; link.click(); URL.revokeObjectURL(url);
  showToast('Backup baixado.');
}

async function importBackup(file) {
  try {
    const backup = JSON.parse(await file.text());
    if (backup.app !== 'Nosso Treino' || !backup.data || !Array.isArray(backup.data.sessions)) throw new Error('invalid');
    if (!confirm('Restaurar este backup e substituir os dados atuais?')) return;
    state.data = { ...defaultData(), ...backup.data, gym: { ...defaultData().gym, ...(backup.data.gym || {}) }, settings: { ...defaultData().settings, ...(backup.data.settings || {}) } };
    saveData(); render(); showToast('Backup restaurado.');
  } catch { showToast('Este arquivo não é um backup válido.'); }
}

function clearTrainingData() {
  if (!confirm('Apagar treinos, histórico e localização deste usuário? Esta ação não pode ser desfeita.')) return;
  state.data = defaultData(); saveData(); render(); showToast('Dados de treino apagados.');
}

function showToast(text) {
  const toast = $('#toast'); toast.textContent = text; toast.classList.remove('hidden');
  clearTimeout(toast.hideTimer); toast.hideTimer = setTimeout(() => toast.classList.add('hidden'), 2800);
}

function setupInstall() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); state.installPrompt = event;
    if (localStorage.getItem('nt-install-dismissed') !== '1') $('#install').classList.remove('hidden');
  });
  $('#install-now').addEventListener('click', async () => {
    if (!state.installPrompt) return; await state.installPrompt.prompt(); state.installPrompt = null; $('#install').classList.add('hidden');
  });
  $('#install-close').addEventListener('click', () => { localStorage.setItem('nt-install-dismissed', '1'); $('#install').classList.add('hidden'); });
}

function setup() {
  $('#form').addEventListener('submit', handleAuth);
  $('#google-login').addEventListener('click', handleGoogleLogin);
  window.addEventListener('nt-google-auth-changed', (event) => {
    if (event.detail && !state.user) loginWithGoogle(event.detail);
  });
  $('#mode').addEventListener('click', () => {
    state.authMode = state.authMode === 'login' ? 'create' : 'login';
    const creating = state.authMode === 'create';
    $('#form-title').textContent = creating ? 'Crie sua conta' : 'Boas-vindas';
    $('#submit').textContent = creating ? 'Criar conta' : 'Entrar';
    $('#mode').textContent = creating ? 'Já tenho uma conta' : 'Criar conta neste aparelho';
    $('#pass').autocomplete = creating ? 'new-password' : 'current-password'; $('#msg').textContent = '';
  });
  $('#show-pass').addEventListener('click', () => {
    const showing = $('#pass').type === 'text'; $('#pass').type = showing ? 'password' : 'text';
    $('#show-pass').textContent = showing ? 'Mostrar' : 'Ocultar'; $('#show-pass').setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
  });
  $$('.dock button').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.route)));
  $('#profile').addEventListener('click', () => navigate('profile'));
  $('#loc').addEventListener('click', () => state.data.gym.lat !== null ? checkLocation(true) : setGymLocation());
  $('#backdrop').addEventListener('click', closeSheet);
  $('#backup-file').addEventListener('change', (event) => { const [file] = event.target.files; if (file) importBackup(file); event.target.value = ''; });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && state.modal) closeSheet(); });
  setupInstall();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

  const session = localStorage.getItem('nt_session');
  if (session && getUsers()[session]) login(session);
  else if (window.ntGoogleCurrentUser) loginWithGoogle(window.ntGoogleCurrentUser);
}

setup();
