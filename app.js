// === Elementos principais ===
const form = document.getElementById('loginForm');
const list = document.getElementById('channelList');
const player = document.getElementById('videoPlayer');
const statusText = document.createElement('p');
document.body.insertBefore(statusText, list);
const menu = document.querySelector('.menu-tiles'); // novo menu

const WORKER_URL = "https://iptvip-proxy.lucianoffernands.workers.dev/";

let hls = null;
let loginData = {};

// === LOGIN ===
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = form.username.value.trim();
  const password = form.password.value.trim();
  const listName = form.listname.value.trim();
  const url = form.url.value.trim();

  if (!username || !password || !listName || !url) {
    alert("Preencha todos os campos!");
    return;
  }

  let safeUrl = url.trim();
  if (safeUrl.startsWith("http://")) safeUrl = safeUrl.replace("http://", "https://");
  if (safeUrl.endsWith("/")) safeUrl = safeUrl.slice(0, -1);

  loginData = { username, password, url: safeUrl };

  list.innerHTML = '';
  statusText.textContent = "🚀 Conectando ao servidor IPTV...";

  try {
    const fetchUrl = `${WORKER_URL}?action=menu&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&url=${encodeURIComponent(safeUrl)}`;
    const res = await fetch(fetchUrl, { method: "GET", headers: { "Content-Type": "application/json" }, mode: "cors" });

    if (!res.ok) throw new Error(`Erro ao conectar ao servidor (status: ${res.status})`);

    const data = await res.json();

    // Esconde o formulário e mostra menu
    form.style.display = "none";
    list.style.display = "none";
    statusText.textContent = "📺 Escolha uma opção";

    showMainMenu(); // exibe o menu novo

  } catch (err) {
    console.error("❌ Falha:", err);
    statusText.textContent = "❌ Falha ao conectar ao servidor IPTV";
  }
});

// === NOVO MENU VISUAL ===
function showMainMenu() {
  if (menu) {
    menu.style.display = "block"; // mostra o menu
    initMenuTiles();
  }
}

// === LIGA OS BOTÕES DO NOVO MENU ===
function initMenuTiles() {
  const liveBtn = document.querySelector('.tile-live');
  const moviesBtn = document.querySelector('.tile-movies');
  const seriesBtn = document.querySelector('.tile-series');
  const accountBtn = document.querySelector('.tile-account');
  const settingsBtn = document.querySelector('.tile-settings');
  const logoutBtn = document.getElementById('menu-logout'); // garante seleção correta

  // Botões principais
  if (liveBtn) {
    liveBtn.addEventListener('click', () => {
      menu.style.display = "none";
      list.style.display = "block";
      loadCategorias("tv");
    });
  }

  if (moviesBtn) {
    moviesBtn.addEventListener('click', () => {
      menu.style.display = "none";
      list.style.display = "block";
      loadCategorias("filmes");
    });
  }

  if (seriesBtn) {
    seriesBtn.addEventListener('click', () => {
      menu.style.display = "none";
      list.style.display = "block";
      loadCategorias("series");
    });
  }

  if (accountBtn) {
    accountBtn.addEventListener('click', () => alert("📋 Em breve: informações da conta!"));
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => alert("⚙️ Em breve: configurações!"));
  }

  // Botão Sair
  if (logoutBtn) {
  if (logoutBtn) {
  logoutBtn.onclick = () => {
    // Oculta menu e lista
    menu.style.display = "none";
    list.style.display = "none";
    list.innerHTML = "";

    // Mostra formulário de login
    form.style.display = ""; // usa o CSS original
    form.reset();            // limpa os inputs

    // Limpa status e dados de login
    statusText.textContent = "";
    loginData = {};

    // Oculta e reseta player
    if (hls) {
      hls.destroy();
      hls = null;
    }
    player.style.display = "none";
    player.src = "";
  };
  }
}

// === CARREGAR CATEGORIAS ===
async function loadCategorias(tipo) {
  list.innerHTML = '';
  statusText.textContent = "📦 Carregando categorias...";

  const { username, password, url } = loginData;
  const endpoint = `${WORKER_URL}?action=categorias&tipo=${tipo}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&url=${encodeURIComponent(url)}`;

  try {
    const res = await fetch(endpoint, { method: "GET", headers: { "Content-Type": "application/json" }, mode: "cors" });
    if (!res.ok) throw new Error("Erro ao buscar categorias");

    const data = await res.json();
    statusText.textContent = "📚 Escolha uma categoria";
    list.innerHTML = '';

    data.categorias.forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat;
      btn.className = "category-btn";
      btn.onclick = () => loadCanais(tipo, cat);
      list.appendChild(btn);
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = "⬅️ Voltar ao Menu";
    backBtn.className = "back-btn";
    backBtn.onclick = () => {
      list.style.display = "none";
      showMainMenu();
    };
    list.appendChild(backBtn);

  } catch (err) {
    console.error(err);
    statusText.textContent = "❌ Falha ao carregar categorias";
  }
}

// === CARREGAR CANAIS ===
async function loadCanais(tipo, categoria) {
  list.innerHTML = '';
  statusText.textContent = `📡 Carregando canais de ${categoria}...`;

  const { username, password, url } = loginData;
  const endpoint = `${WORKER_URL}?action=canais&tipo=${tipo}&categoria=${encodeURIComponent(categoria)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&url=${encodeURIComponent(url)}`;

  try {
    const res = await fetch(endpoint, { method: "GET", headers: { "Content-Type": "application/json" }, mode: "cors" });
    if (!res.ok) throw new Error("Erro ao buscar canais");

    const data = await res.json();
    statusText.textContent = `✅ ${data.total} canais encontrados`;
    list.innerHTML = '';

    data.canais.forEach(ch => {
      const div = document.createElement('div');
      div.className = "channel-item";

      const logo = document.createElement('img');
      logo.src = ch.logo || 'https://via.placeholder.com/60x60?text=TV';
      logo.className = "channel-logo";

      const name = document.createElement('span');
      name.textContent = ch.nome;
      name.className = "channel-name";

      div.appendChild(logo);
      div.appendChild(name);
      div.onclick = () => playChannel(ch.url);
      list.appendChild(div);
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = "⬅️ Voltar às Categorias";
    backBtn.className = "back-btn";
    backBtn.onclick = () => loadCategorias(tipo);
    list.appendChild(backBtn);

  } catch (err) {
    console.error(err);
    statusText.textContent = "❌ Falha ao carregar canais";
  }
}

// === PLAYER ===
function playChannel(url) {
  if (hls) {
    hls.destroy();
    hls = null;
  }

  player.style.display = "block";

  if (Hls.isSupported()) {
    const hlsInstance = new Hls();
    const secureUrl = `${WORKER_URL}?action=proxy&target=${encodeURIComponent(url)}`;
    hlsInstance.loadSource(secureUrl);
    hlsInstance.attachMedia(player);
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      player.play().catch(() => {
        alert("Clique no player para iniciar o vídeo.");
      });
    });
    hls = hlsInstance;
  } else if (player.canPlayType("application/vnd.apple.mpegurl")) {
    player.src = `${WORKER_URL}?action=proxy&target=${encodeURIComponent(url)}`;
    player.addEventListener("loadedmetadata", () => {
      player.play().catch(() => {
        alert("Clique no player para iniciar o vídeo.");
      });
    });
  } else {
    alert("Seu navegador não suporta M3U8.");
  }
}

// === Service Worker ===
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(() => console.log('✅ Service Worker registrado'))
    .catch(err => console.error('❌ Falha ao registrar o Service Worker:', err));
}

// === Versão no front ===
window.onload = () => {
  navigator.serviceWorker.ready.then(registration => {
    if (registration.active) {
      registration.active.postMessage({ type: 'GET_VERSION' });
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'VERSION_INFO') {
          let versionEl = document.getElementById('app-version');
          if (!versionEl) {
            versionEl = document.createElement('div');
            versionEl.id = 'app-version';
            document.body.appendChild(versionEl);
          }
          versionEl.textContent = `Versão ${event.data.version}`;
        }
      });
    }
  });
};
