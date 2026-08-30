/* =====================================================
   MENTE SANA — storage.js
   Capa única de acceso a LocalStorage. Tanto el sitio
   (progress.js) como el chatbot (chatbot.js) leen y
   escriben el estado a través de este módulo, para que
   ambos compartan siempre los mismos datos.

   Diseñado para poder reemplazarse en el futuro por
   llamadas a una base de datos real sin cambiar la forma
   en la que el resto del código lo consume: basta con
   reimplementar las funciones de este archivo.
   ===================================================== */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'menteSanaState';
  const CHAT_HISTORY_KEY = 'menteSanaChatHistory';

  const defaultState = {
    moodLog: {},           // { 'YYYY-MM-DD': 'excelente' }
    activitiesDates: {},   // { 'YYYY-MM-DD': ['respiracion', 'gratitud', ...] }
    streak: 0,
    lastActiveDate: null,
    totalActivitiesCount: 0,
    badgesUnlocked: []     // ['paso', 'primera-conversacion', ...]
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  /* ---------- Estado general de bienestar / progreso ---------- */

  function getState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(defaultState);
      return Object.assign(clone(defaultState), JSON.parse(raw));
    } catch (e) {
      return clone(defaultState);
    }
  }

  function setState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* almacenamiento no disponible (modo privado, cuota llena, etc.):
         la sesión sigue funcionando, simplemente sin persistencia. */
    }
    emit('state:changed', state);
  }

  function resetState() {
    const fresh = clone(defaultState);
    setState(fresh);
    return fresh;
  }

  /* Registra una actividad completada hoy (respiracion, gratitud,
     pausa, reto, animo, chat-conversacion, chat-ejercicio, etc.)
     y actualiza la racha de días consecutivos. */
  function logActivity(key) {
    const state = getState();
    const today = todayKey();

    if (!state.activitiesDates[today]) state.activitiesDates[today] = [];
    if (!state.activitiesDates[today].includes(key)) {
      state.activitiesDates[today].push(key);
      state.totalActivitiesCount += 1;
    }

    if (state.lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = yesterday.toISOString().slice(0, 10);
      state.streak = (state.lastActiveDate === yKey) ? state.streak + 1 : 1;
      state.lastActiveDate = today;
    }

    setState(state);
    return state;
  }

  function logMood(mood) {
    const state = getState();
    state.moodLog[todayKey()] = mood;
    setState(state);
    return logActivity('animo');
  }

  function unlockBadge(badgeKey) {
    const state = getState();
    if (!state.badgesUnlocked.includes(badgeKey)) {
      state.badgesUnlocked.push(badgeKey);
      setState(state);
    }
    return state;
  }

  /* ---------- Historial de conversación del chatbot ---------- */
  /* Se guarda en este dispositivo junto con el resto del estado
     local y puede borrarse en cualquier momento desde el
     propio chat con el botón "Limpiar conversación". */

  function getChatHistory() {
    try {
      const raw = localStorage.getItem(CHAT_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveChatHistory(messages) {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (e) { /* sesión sin persistencia disponible */ }
  }

  function clearChatHistory() {
    try {
      localStorage.removeItem(CHAT_HISTORY_KEY);
    } catch (e) { /* no-op */ }
  }

  /* ---------- Mini sistema de eventos ---------- */
  /* Permite que progress.js se refresque automáticamente cuando
     el chatbot registra una actividad, sin acoplar ambos módulos. */

  const listeners = {};

  function on(eventName, callback) {
    if (!listeners[eventName]) listeners[eventName] = [];
    listeners[eventName].push(callback);
  }

  function emit(eventName, payload) {
    (listeners[eventName] || []).forEach(cb => cb(payload));
  }

  /* ---------- API pública ---------- */
  window.MenteSanaStorage = {
    todayKey,
    getState,
    setState,
    resetState,
    logActivity,
    logMood,
    unlockBadge,
    getChatHistory,
    saveChatHistory,
    clearChatHistory,
    on,
    emit
  };

})(window);


(function () {
  'use strict';
  const KEY='menteSanaModular';
  const empty={user:null,coins:0,completed:{},purchases:[],hunger:50,emergency:{name:'',phone:''},comments:{},wall:[]};
  let state=load();let currentArticle=null;
  const categories=['Todos los artículos','Drogas','Depresión','Ansiedad','Alcoholismo','Autoestima','Insomnio','Estrés laboral o académico','Vínculos afectivos'];
  const articles=[
    {id:'drogas-1',cat:'Drogas',title:'Cómo reconocer una relación de riesgo con las drogas',intro:'Señales tempranas y caminos seguros para buscar apoyo.',body:['El consumo comienza a ser problemático cuando afecta las responsabilidades, las relaciones, la economía o la salud. Ocultarlo, necesitar una cantidad cada vez mayor, abandonar actividades importantes o sentir que no puedes detenerte son señales que conviene tomar en serio.','Observar estas señales no significa juzgar a la persona. Hablar con alguien de confianza, identificar los momentos que impulsan el consumo y buscar acompañamiento profesional son pasos de cuidado. El apoyo temprano puede reducir riesgos y facilitar cambios sostenibles.']},
    {id:'depresion-1',cat:'Depresión',title:'Cuando la tristeza se queda',intro:'Diferencias entre un día difícil y síntomas que necesitan atención.',body:['La tristeza suele aparecer como respuesta a una experiencia difícil, pero la depresión puede mantenerse incluso cuando no existe una causa evidente. También puede incluir pérdida de interés, cansancio, culpa, cambios en el sueño o el apetito y dificultad para concentrarse.','Cuando varias de estas señales duran dos semanas o interfieren con el estudio, el trabajo o las relaciones, es importante buscar apoyo profesional. Pedir ayuda no es exagerar. Ante pensamientos de hacerte daño, contacta de inmediato a emergencias o a una persona cercana y evita quedarte a solas.']},
    {id:'ansiedad-1',cat:'Ansiedad',title:'Volver al presente durante la ansiedad',intro:'Una técnica sensorial sencilla para recuperar estabilidad.',body:['La ansiedad puede acelerar la respiración y hacer que los pensamientos parezcan urgentes. Para volver al presente, observa cinco cosas que ves, cuatro que puedes tocar, tres que escuchas, dos que hueles y una que saboreas. Hazlo lentamente y sin exigirte sentirte bien de inmediato.','Este ejercicio no elimina el origen de la ansiedad, pero ayuda al cuerpo a reconocer el entorno actual y puede reducir la intensidad del momento. Si los episodios son frecuentes, muy intensos o limitan tu vida cotidiana, considera conversar con un profesional de salud mental.']},
    {id:'alcohol-1',cat:'Alcoholismo',title:'Hablar del consumo sin juzgar',intro:'Cómo iniciar una conversación respetuosa sobre el alcohol.',body:['Una conversación útil comienza desde hechos concretos y preocupación genuina, no desde etiquetas. Elige un momento tranquilo, explica qué cambios has observado y escucha sin convertir el diálogo en una discusión. Evita hablar cuando la persona se encuentre bajo los efectos del alcohol.','Si eres tú quien necesita ayuda, registrar cuánto bebes, con quién y en qué situaciones puede ayudarte a identificar patrones. Compartir esa información con un profesional permite crear un plan realista y seguro, especialmente si existe consumo frecuente o síntomas al intentar dejarlo.']},
    {id:'autoestima-1',cat:'Autoestima',title:'Una voz interna más amable',intro:'Prácticas para reducir la autocrítica cotidiana.',body:['La autocrítica suele usar palabras absolutas como “siempre”, “nunca” o “todo”. Cuando aparezcan, pregúntate si hablarías de la misma forma a alguien que quieres. Cambia “todo me sale mal” por una descripción concreta: “esto no salió como esperaba y puedo revisar qué aprendí”.','La autoestima no depende únicamente de pensar en positivo. También se construye al reconocer límites, celebrar avances pequeños y cumplir compromisos realistas contigo. Tratarte con respeto no elimina los errores; te permite aprender de ellos sin convertirlos en una definición de quién eres.']},
    {id:'insomnio-1',cat:'Insomnio',title:'Preparar la mente para dormir',intro:'Hábitos que favorecen un descanso más estable.',body:['Mantener horarios similares ayuda al cuerpo a reconocer cuándo debe descansar. Reduce la luz intensa antes de acostarte, evita trabajar desde la cama y crea una rutina breve que marque el final del día, como leer, estirarte o escuchar sonidos tranquilos.','Si no logras dormir después de un rato, levántate y realiza una actividad calmada con poca luz hasta sentir sueño. Evita mirar constantemente la hora. Cuando el insomnio persiste, causa cansancio intenso o afecta tu rutina, conviene solicitar una evaluación profesional.']},
    {id:'estres-1',cat:'Estrés laboral o académico',title:'Pausas que protegen tu energía',intro:'Organiza el esfuerzo sin llevarte al agotamiento.',body:['Divide el trabajo en bloques alcanzables, define una sola prioridad y programa pausas antes de sentirte agotado. Una lista corta y realista reduce la sensación de tener que resolverlo todo al mismo tiempo y permite medir mejor el avance.','Cerrar la jornada también es una habilidad. Anota cuál será el siguiente paso, ordena el espacio de trabajo y establece una hora para terminar. Descansar no es perder tiempo: ayuda a recuperar la atención y evita que el estrés se convierta en agotamiento constante.']},
    {id:'vinculos-1',cat:'Vínculos afectivos',title:'Límites que cuidan las relaciones',intro:'Decir lo que necesitas con claridad y respeto.',body:['Un límite sano explica qué necesitas y qué harás para cuidarte. Habla en primera persona, describe la situación concreta y evita amenazas. Por ejemplo: “Necesito que conversemos sin gritos; si eso ocurre, haré una pausa y retomaremos después”.','Los límites funcionan cuando son claros, posibles y consistentes. El respeto, la confianza y la libertad para decir “no” son partes esenciales de un vínculo seguro. Si una relación genera miedo, control o aislamiento, busca apoyo en una persona de confianza o en un servicio especializado.']}
  ];
  const activities=[
    {id:'respirar',icon:'🌬️',title:'Respiración consciente',text:'Respira lentamente durante dos minutos.',steps:['Inhala durante 4 segundos','Sostén 2 segundos','Exhala durante 6 segundos']},
    {id:'meditar',icon:'🧘',title:'Meditación breve',text:'Dedica cinco minutos a observar tu respiración.',steps:['Siéntate con comodidad','Observa sin corregir','Vuelve con calma cuando te distraigas']},
    {id:'escribir',icon:'✍️',title:'Escritura emocional',text:'Escribe libremente cómo te sientes hoy.',steps:['Ponle nombre a una emoción','Describe qué la provocó','Anota qué necesitas ahora']},
    {id:'pasto',icon:'🌿',title:'Conectar con la naturaleza',text:'Toca el pasto o una planta y observa sus detalles.',steps:['Deja el teléfono a un lado','Observa textura y temperatura','Respira tres veces']},
    {id:'sin-celular',icon:'📵',title:'Pausa sin celular',text:'Pasa 30 minutos lejos de la pantalla.',steps:['Silencia notificaciones','Deja el teléfono en otro lugar','Elige una actividad tranquila']},
    {id:'caminar',icon:'🚶',title:'Caminata consciente',text:'Camina diez minutos prestando atención a tu entorno.',steps:['Nota el ritmo de tus pasos','Observa los sonidos','Relaja los hombros']},
    {id:'gratitud',icon:'🙏',title:'Tres agradecimientos',text:'Piensa o escribe tres cosas que valoras hoy.',steps:['Una persona','Un momento','Algo de ti']},
    {id:'conexion',icon:'💬',title:'Conectar con alguien',text:'Escribe o llama a una persona importante para ti.',steps:['Pregunta cómo está','Escucha con atención','Comparte cómo te sientes']}
  ];
  function load(){try{const saved=Object.assign({},empty,JSON.parse(localStorage.getItem(KEY)||'{}'));if(saved.user&&!saved.user.role)saved.user.role='usuario';return saved}catch{return structuredClone(empty)}}
  function save(){localStorage.setItem(KEY,JSON.stringify(state));renderUser();}
  function esc(v){const d=document.createElement('div');d.textContent=v;return d.innerHTML}
  function today(){return new Date().toISOString().slice(0,10)}
  function openModal(el){el.hidden=false;document.body.style.overflow='hidden'}function closeModal(el){el.hidden=true;document.body.style.overflow=''}

  const navLinks=document.getElementById('navLinks'),navToggle=document.getElementById('navToggle');
  navToggle.addEventListener('click',()=>navLinks.classList.toggle('is-open'));
  document.addEventListener('click',e=>{const link=e.target.closest('[data-route]');if(!link)return;e.preventDefault();route(link.dataset.route)});
  function route(name){
    if(name==='perfil'&&!state.user){openRegister();return}
    document.querySelectorAll('.module').forEach(m=>m.classList.toggle('is-active',m.dataset.module===name));
    document.querySelectorAll('[data-route]').forEach(a=>a.classList.toggle('is-active',a.dataset.route===name));
    navLinks.classList.remove('is-open');history.replaceState(null,'','#'+name);window.scrollTo({top:0,behavior:'smooth'});if(name==='perfil')renderProfile();
  }

  const registerModal=document.getElementById('registerModal');function openRegister(){openModal(registerModal)}
  document.querySelectorAll('[data-open-register]').forEach(b=>b.addEventListener('click',()=>state.user?route('perfil'):openRegister()));
  document.getElementById('activitiesAccessButton').addEventListener('click',()=>state.user?route('perfil'):openRegister());
  document.getElementById('authButton').addEventListener('click',()=>state.user?route('perfil'):openRegister());
  document.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>closeModal(registerModal)));
  document.getElementById('registerForm').addEventListener('submit',e=>{e.preventDefault();const name=document.getElementById('registerName').value.trim(),contact=document.getElementById('registerContact').value.trim(),username=document.getElementById('registerUsername').value.trim().replace(/^@/,'');const err=document.getElementById('registerError');if(!/^[A-Za-z0-9_.-]{3,24}$/.test(username)){err.textContent='El username debe tener entre 3 y 24 caracteres, sin espacios.';return}state.user={name,contact,username,role:'usuario',joined:new Date().toISOString()};save();closeModal(registerModal);route('perfil')});
  document.getElementById('logoutButton').addEventListener('click',()=>{state.user=null;save();route('inicio')});

  const tabs=document.getElementById('resourceTabs');categories.forEach((cat,i)=>{const b=document.createElement('button');b.className='resource-tab'+(i===0?' is-active':'');b.textContent=cat;b.onclick=()=>renderArticles(cat,b);tabs.appendChild(b)});
  function renderArticles(cat,button){document.querySelectorAll('.resource-tab').forEach(b=>b.classList.remove('is-active'));if(button)button.classList.add('is-active');const grid=document.getElementById('articlesGrid');grid.innerHTML='';const visible=cat==='Todos los artículos'?articles:articles.filter(a=>a.cat===cat);visible.forEach(a=>{const el=document.createElement('article');el.className='article-card';el.innerHTML=`<span class="article-card__category">${a.cat}</span><h3>${a.title}</h3><p>${a.intro}</p><button class="resource-card__more">Leer artículo</button>`;el.querySelector('button').onclick=()=>openArticle(a);grid.appendChild(el)})}
  renderArticles(categories[0],tabs.firstChild);
  const articleModal=document.getElementById('articleModal');
  function openArticle(a){currentArticle=a;document.getElementById('articleCategory').textContent=a.cat;document.getElementById('articleTitle').textContent=a.title;document.getElementById('articleContent').innerHTML=a.body.map(p=>`<p>${p}</p>`).join('')+`<p><strong>Recuerda:</strong> este contenido es educativo y no reemplaza la atención profesional.</p>`;document.getElementById('commentText').placeholder=state.user?'Escribe un comentario respetuoso':'Regístrate para comentar';renderComments();openModal(articleModal)}
  document.querySelectorAll('[data-close-article]').forEach(b=>b.addEventListener('click',()=>closeModal(articleModal)));
  document.getElementById('commentForm').addEventListener('submit',e=>{e.preventDefault();if(!state.user){closeModal(articleModal);openRegister();return}const input=document.getElementById('commentText'),text=input.value.trim();if(!text)return;(state.comments[currentArticle.id]??=[]).unshift({user:state.user.username,text,date:new Date().toISOString()});input.value='';save();renderComments()});
  function renderComments(){const list=document.getElementById('articleCommentList'),items=state.comments[currentArticle.id]||[];list.innerHTML=items.length?items.map(c=>`<div class="comment"><strong>@${esc(c.user)}</strong><p>${esc(c.text)}</p><time>${new Date(c.date).toLocaleString('es')}</time></div>`).join(''):'<p class="dashboard__hint">Aún no hay comentarios.</p>'}

  const activityGrid=document.getElementById('activitiesGrid');
  function dailyActivities(){const start=state.user?.joined?new Date(state.user.joined):new Date();const now=new Date();start.setHours(0,0,0,0);now.setHours(0,0,0,0);const day=Math.max(0,Math.floor((now-start)/86400000));return Array.from({length:3},(_,i)=>activities[(day*3+i)%activities.length])}
  function renderActivities(){activityGrid.innerHTML='';dailyActivities().forEach((a,i)=>{const done=Boolean(state.completed[`${a.id}:${today()}`]);const el=document.createElement('article');el.className='activity-card'+(done?' is-complete':'');el.innerHTML=`<span class="activity-day-label">Actividad ${i+1} de hoy</span><h3 class="activity-card__title">${a.title}</h3><p class="activity-card__text">${a.text}</p><ol class="activity-card__steps">${a.steps.map(s=>`<li>${s}</li>`).join('')}</ol><span class="activity-reward">Recompensa: 1 moneda</span><button class="btn btn--primary btn--small complete-activity">${done?'Completada hoy':'Marcar como completada'}</button>`;el.querySelector('button').onclick=()=>completeActivity(a.id);activityGrid.appendChild(el)})}
  function completeActivity(id){const key=`${id}:${today()}`;if(state.completed[key])return;state.completed[key]={date:new Date().toISOString()};state.coins++;state.hunger=Math.min(100,state.hunger+5);save();renderActivities();renderProfile()}
  renderActivities();

  function renderUser(){const logged=Boolean(state.user);document.querySelectorAll('.lock').forEach(l=>l.hidden=logged);document.getElementById('authButton').textContent=logged?'@'+state.user.username:'Comienza tu camino';document.getElementById('coinCount').textContent=state.coins;const access=document.getElementById('activitiesAccessButton');access.textContent=logged?'Ver mis actividades de hoy':'Registrarme y desbloquear actividades'}
  function renderProfile(){if(!state.user)return;document.getElementById('profileName').textContent=state.user.name;document.getElementById('publicUsername').textContent='@'+state.user.username;document.getElementById('profileAvatar').textContent=state.user.name.charAt(0).toUpperCase();document.getElementById('completedCount').textContent=Object.keys(state.completed).length;document.getElementById('profileCoins').textContent=state.coins;document.getElementById('hungerValue').textContent=state.hunger+'%';document.getElementById('hungerBar').style.width=state.hunger+'%';const gifts=state.purchases.filter(i=>i!=='comida'),inv=document.getElementById('inventory');inv.innerHTML=gifts.length?`<strong>Mis compras:</strong> ${gifts.map(i=>`<span>${i}</span>`).join('')}`:'<span>Aún no has comprado accesorios.</span>';document.getElementById('mimoAccessory').textContent=state.purchases.includes('sombrero')?'Sombrero':state.purchases.includes('lazo')?'Lazo':'';document.getElementById('emergencyName').value=state.emergency.name||'';document.getElementById('emergencyPhone').value=state.emergency.phone||'';renderChart();renderWall()}
  function renderChart(){const chart=document.getElementById('progressChart'),counts={};Object.values(state.completed).forEach(v=>{const d=v.date.slice(0,10);counts[d]=(counts[d]||0)+1});chart.innerHTML='';for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=d.toISOString().slice(0,10),n=counts[key]||0;const el=document.createElement('div');el.className='chart-day';el.innerHTML=`<span class="chart-bar" style="height:${Math.max(5,n*35)}px"></span><span>${d.toLocaleDateString('es',{weekday:'short'}).slice(0,3)}</span>`;chart.appendChild(el)}}
  document.getElementById('shopToggle').addEventListener('click',()=>{const shop=document.getElementById('mimoShop');shop.hidden=!shop.hidden;document.getElementById('shopToggle').textContent=shop.hidden?'Abrir tienda':'Cerrar tienda'});
  document.querySelectorAll('.shop-action').forEach(b=>b.addEventListener('click',()=>{const cost=Number(b.dataset.cost),item=b.dataset.item;if(state.coins<cost){document.getElementById('mimoMessage').textContent='Necesitamos más monedas. Completa otra actividad.';return}if(item!=='comida'&&state.purchases.includes(item)){document.getElementById('mimoMessage').textContent='Mimo ya tiene ese regalo.';return}state.coins-=cost;if(item==='comida'){state.hunger=Math.min(100,state.hunger+25);document.getElementById('mimoMessage').textContent='Gracias por cuidarme.'}else{state.purchases.push(item);document.getElementById('mimoMessage').textContent='Me encanta mi nuevo regalo.'}save();renderProfile()}));
  document.getElementById('emergencyForm').addEventListener('submit',e=>{e.preventDefault();state.emergency={name:document.getElementById('emergencyName').value.trim(),phone:document.getElementById('emergencyPhone').value.trim()};save();document.getElementById('emergencySaved').textContent='Contacto guardado en este dispositivo ✓'});
  document.getElementById('wallForm').addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('wallMessage'),text=input.value.trim();if(!text)return;state.wall.unshift({user:state.user.username,text,date:new Date().toISOString()});input.value='';save();renderWall()});
  function renderWall(){const list=document.getElementById('wallPosts');list.innerHTML=state.wall.length?state.wall.map(p=>`<div class="comment"><strong>@${esc(p.user)}</strong><p>${esc(p.text)}</p><time>${new Date(p.date).toLocaleString('es')}</time></div>`).join(''):'<p class="dashboard__hint">Sé la primera persona en publicar.</p>'}
  renderUser();const initial=location.hash.slice(1)||'inicio';route(initial);window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal(registerModal);closeModal(articleModal)}});
})();


(function(){
  'use strict';
  const Storage=window.MenteSanaStorage;
  const WELCOME='Hola, soy Mimo. Estoy aquí para escucharte. Puedes contarme cómo te sientes o elegir una opción. No estás siendo juzgado.';
  const CRISIS=/(suicid|quiero morir|no quiero vivir|matarme|quitarme la vida|hacerme daño|hacerme dano|autolesion|cortarme|lastimarme)/i;
  const quick=[
    ['Quiero hablar','Quiero hablar'],['Me siento triste','Me siento triste'],
    ['Estoy estresado','Estoy estresado'],['Necesito relajarme','Necesito relajarme'],
    ['Dame un consejo','Dame un consejo'],['Quiero sentirme mejor','Quiero sentirme mejor']
  ];
  const quickReplies={
    'Quiero hablar':'Claro, estoy aquí para escucharte. Puedes contarme qué ocurrió o qué tienes en mente, a tu ritmo.',
    'Me siento triste':'Lamento que estés pasando por este momento. No tienes que fingir que estás bien aquí. Si quieres, cuéntame qué es lo que más te pesa ahora.',
    'Estoy estresado':'Parece que has estado cargando demasiado. Elige una sola tarea urgente y divide el siguiente paso en algo que puedas hacer en diez minutos.',
    'Necesito relajarme':'Afloja la mandíbula y baja los hombros. Inhala durante cuatro segundos y exhala lentamente durante seis; repítelo cinco veces.',
    'Dame un consejo':'Haz una pausa y separa lo que puedes controlar hoy de lo que no depende de ti. Dedica tu energía a una acción pequeña y posible.',
    'Quiero sentirme mejor':'Elige una acción sencilla de cinco minutos: beber agua, salir al aire libre, respirar con calma o escribir cómo te sientes.'
  };
  const intents=[
    {key:'triste',test:/(triste|llorar|deprimid|desanimad|vac[ií]o|sin ganas)/i,replies:[
      'Lamento que estés sintiéndote así. La tristeza puede sentirse muy pesada. Si quieres, puedes contarme qué ocurrió o desde cuándo te sientes así.',
      'Gracias por decirlo. No tienes que fingir que estás bien aquí. ¿Qué es lo que más te está pesando en este momento?'
    ],advice:['Permítete sentirlo sin exigirte resolver todo hoy. Escribe en una frase qué necesitas en este momento.','Busca a una persona segura y dile simplemente: “Hoy no me siento bien, ¿puedes acompañarme un momento?”']},
    {key:'estres',test:/(estr[eé]s|estresad|presi[oó]n|agobiad|saturad|mucho trabajo|muchas tareas)/i,replies:[
      'Parece que has estado cargando demasiado. Hagamos una pausa: ¿qué asunto ocupa más espacio en tu mente ahora?',
      'Tiene sentido que te sientas saturado. Podemos separar lo urgente de lo que puede esperar. ¿Qué tienes pendiente?'
    ],advice:['Elige una sola tarea pequeña que puedas completar en diez minutos. Lo demás puede esperar durante ese bloque.','Relaja los hombros, inhala cuatro segundos y exhala seis. Repite tres veces antes de continuar.']},
    {key:'ansiedad',test:/(ansiedad|ansios|nervios|p[aá]nico|preocup|miedo)/i,replies:[
      'La ansiedad puede hacer que todo parezca urgente. En este instante estás aquí conmigo. ¿Qué pensamiento está apareciendo una y otra vez?',
      'Gracias por contármelo. Vamos poco a poco. ¿Sientes la ansiedad más en tus pensamientos o en tu cuerpo?'
    ],advice:['Mira a tu alrededor y nombra cinco cosas que ves, cuatro que tocas y tres que escuchas.','Apoya ambos pies en el suelo y alarga la exhalación. No necesitas pelear contra la sensación; deja que baje poco a poco.']},
    {key:'relajar',test:/(relajar|calmar|respirar|tranquil|tensi[oó]n)/i,replies:[
      'Claro. Hagamos una pausa breve juntos. Afloja la mandíbula y deja caer los hombros.',
      'Podemos bajar el ritmo durante un momento. No tienes que resolver nada mientras respiras.'
    ],advice:['Inhala por la nariz durante cuatro segundos y exhala lentamente durante seis. Hazlo cinco veces.','Cierra los ojos durante treinta segundos y presta atención únicamente a los sonidos cercanos.']},
    {key:'dormir',test:/(no puedo dormir|insomnio|sueño|desvelad|dormir)/i,replies:[
      'No poder descansar es agotador. ¿Tu mente está muy activa o sientes incomodidad en el cuerpo?',
      'El sueño suele alejarse cuando intentamos forzarlo. Podemos preparar una transición más tranquila.'
    ],advice:['Reduce la luz, deja el teléfono lejos y realiza algo tranquilo durante diez minutos antes de volver a la cama.','Anota en papel lo que te preocupa y escribe al lado: “puedo retomarlo mañana”.']},
    {key:'soledad',test:/(solo|sola|soledad|nadie me|sin amigos|me abandon)/i,replies:[
      'Sentirse solo duele, incluso cuando hay personas alrededor. Gracias por buscar este espacio para hablar.',
      'Estoy leyendo lo que me dices. ¿Hay alguien con quien antes te resultaba fácil conversar?'
    ],advice:['Envía un mensaje sencillo a alguien seguro: “Hola, ¿tienes unos minutos para hablar?”','Busca un espacio compartido y tranquilo, aunque no tengas que conversar: una biblioteca, un parque o estar cerca de familia.']},
    {key:'enojo',test:/(enojad|molest|furios|rabia|ira)/i,replies:[
      'Tu enojo probablemente está señalando que algo importante para ti fue traspasado. ¿Qué ocurrió?',
      'Podemos escuchar ese enojo sin actuar impulsivamente. ¿Qué necesitas proteger o expresar?'
    ],advice:['Aléjate unos minutos de la situación antes de responder. Mueve el cuerpo o camina para liberar tensión.','Escribe lo que quisieras decir, pero no lo envíes todavía. Revísalo cuando tu cuerpo esté más tranquilo.']},
    {key:'hablar',test:/(quiero hablar|necesito hablar|esc[uú]chame|puedo contarte|hola|buenas)/i,replies:[
      'Claro, estoy aquí para escucharte. ¿Cómo ha sido tu día?',
      'Puedes contarme lo que quieras, a tu ritmo. ¿Qué tienes en mente?'
    ],advice:['Empieza nombrando una emoción y la situación que la provocó: “Me siento… porque…”.','No necesitas contar todo de una vez. Comienza por la parte que te resulte más fácil explicar.']},
    {key:'mejorar',test:/(sentirme mejor|estar mejor|cambiar|mejorar|bienestar)/i,replies:[
      'Querer sentirte mejor ya es un primer paso. No necesitas cambiarlo todo; podemos elegir algo pequeño para hoy.',
      'Me alegra que quieras cuidarte. ¿Prefieres comenzar por descansar, moverte, hablar o respirar?'
    ],advice:['Elige una acción de cinco minutos: beber agua, salir al aire libre o escribir cómo te sientes.','Haz hoy algo pequeño que tu versión de mañana agradecerá, sin buscar que sea perfecto.']},
    {key:'consejo',test:/(consejo|recomendaci[oó]n|qu[eé] hago|ay[uú]dame)/i,replies:['Puedo darte una idea sencilla, pero recuerda que tú conoces mejor tu situación.'],advice:['Antes de tomar una decisión, pregúntate: “¿Qué opción cuida mejor mi bienestar sin hacerme daño ni dañar a otra persona?”','Haz una pausa y separa lo que puedes controlar hoy de lo que no depende de ti. Dedica tu energía únicamente a lo primero.']}
  ];
  const generic={key:'general',replies:['Gracias por compartirlo. Quiero entenderte mejor: ¿cómo te hace sentir eso?','Te estoy escuchando. ¿Qué parte de esta situación ha sido la más difícil para ti?'],advice:['Date unos minutos sin pantallas y pregúntate qué necesitas: descanso, apoyo, espacio o claridad.','Habla contigo con la misma amabilidad que usarías con alguien que quieres.']};
  let lastIntent=generic;

  function build(){
    const launcher=document.createElement('div');launcher.className='chat-launcher';launcher.innerHTML=`<span class="chat-launcher__hint">¿Necesitas hablar?</span><button class="chat-launcher__btn" id="chatLauncherBtn" aria-label="Abrir chat"><span class="chat-launcher__dot"></span><span class="chat-launcher__icon chat-launcher__icon--chat">Chat</span><span class="chat-launcher__icon chat-launcher__icon--close">Cerrar</span></button>`;
    const win=document.createElement('div');win.className='chat-window';win.id='chatWindow';win.innerHTML=`<div class="chat-window__header"><div class="chat-window__avatar"><img src="imagenes/Mimo_2D_cabeza.svg" alt="Mimo"></div><div class="chat-window__identity"><p class="chat-window__name">Mimo</p><p class="chat-window__status">Aquí para escucharte</p></div><div class="chat-window__actions"><button id="chatClearBtn" title="Limpiar conversación" aria-label="Limpiar conversación">Limpiar</button><button id="chatCloseBtn" title="Cerrar" aria-label="Cerrar">Cerrar</button></div></div><p class="chat-window__disclaimer">Asistente con respuestas de acompañamiento predeterminadas. No reemplaza la atención profesional.</p><div class="chat-window__body" id="chatBody" aria-live="polite"></div><div class="chat-quick" id="chatQuick"></div><form class="chat-window__footer" id="chatForm"><textarea class="chat-window__input" id="chatInput" rows="1" placeholder="Escribe cómo te sientes..."></textarea><button class="chat-window__send" id="chatSendBtn">Enviar</button></form>`;
    document.body.append(win,launcher);quick.forEach(([label,text])=>{const b=document.createElement('button');b.className='chat-quick__btn';b.textContent=label;b.onclick=()=>send(text);win.querySelector('#chatQuick').appendChild(b)});return{launcher,win};
  }
  const {launcher,win}=build(),body=document.getElementById('chatBody'),input=document.getElementById('chatInput'),form=document.getElementById('chatForm');let history=Storage.getChatHistory();
  function time(){return new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})}
  function append(role,text){const w=document.createElement('div');w.className='msg '+(role==='user'?'msg--user':'msg--bot');w.innerHTML=`${role==='user'?'':'<div class="msg__avatar"><img src="imagenes/Mimo_2D_cabeza.svg" alt="Mimo"></div>'}<div><div class="msg__bubble"></div><span class="msg__time">${time()}</span></div>`;w.querySelector('.msg__bubble').textContent=text;body.appendChild(w);body.scrollTop=body.scrollHeight}
  function remember(role,content){history.push({role,content});history=history.slice(-30);Storage.saveChatHistory(history)}
  function choose(list){return list[Math.floor(Math.random()*list.length)]}
  function classify(text){return intents.find(i=>i.test.test(text))||generic}
  function send(text){const value=(text||'').trim();if(!value)return;append('user',value);remember('user',value);input.value='';setTimeout(()=>{
    let reply;if(CRISIS.test(value)){reply='Siento mucho que estés pasando por algo tan intenso. Tu seguridad es lo más importante. Contacta ahora a emergencias de tu zona o a una persona de confianza y no te quedes a solas. ¿Estás en un lugar seguro?';lastIntent=generic}
    else if(quickReplies[value]){reply=quickReplies[value];lastIntent=classify(value)}
    else if(/dame (un|1) consejo|quiero un consejo/i.test(value)){reply=choose(lastIntent.advice||generic.advice)}
    else{lastIntent=classify(value);reply=choose(lastIntent.replies)+' Si quieres, selecciona “Dame un consejo”.'}
    append('assistant',reply);remember('assistant',reply);Storage.logActivity('chat-conversacion');
  },450)}
  if(history.length)history.forEach(m=>append(m.role,m.content));else append('assistant',WELCOME);
  document.getElementById('chatLauncherBtn').onclick=()=>{win.classList.toggle('is-open');launcher.classList.toggle('is-open');if(win.classList.contains('is-open'))setTimeout(()=>input.focus(),250)};
  document.getElementById('chatCloseBtn').onclick=()=>{win.classList.remove('is-open');launcher.classList.remove('is-open')};
  document.getElementById('chatClearBtn').onclick=()=>{if(confirm('¿Borrar la conversación?')){Storage.clearChatHistory();history=[];body.innerHTML='';append('assistant',WELCOME)}};
  form.onsubmit=e=>{e.preventDefault();send(input.value)};input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input.value)}};
  setTimeout(()=>launcher.classList.add('is-ready'),700);
})();
