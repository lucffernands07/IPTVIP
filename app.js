// === Elementos principais ===
const form = document.getElementById('loginForm');
const list = document.getElementById('channelList');
const player = document.getElementById('videoPlayer');
const menuTiles = document.querySelector('.menu-tiles'); // ⬅️ adiciona referência ao menu visual
const statusText = document.createElement('p');
document.body.insertBefore(statusText, list);

const WORKER_URL = "https://iptvip-proxy.lucianoffernands.workers.dev/";

let hls = null;
let loginData = {};

// 🔒 Garante que o menu e o player comecem escondidos
if (menuTiles) menuTiles.style.display = "none";
player.style.display = "none";

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

    // ✅ Login bem-sucedido:
    form.style.display = "none";
    statusText.textContent = "📺 Escolha uma opção";

    // ⬅️ Mostra o novo menu visual (tiles)
    if (menuTiles) menuTiles.style.display = "grid";

    // (Opcional) se quiser manter o menu antigo, chama showMainMenu:
    // showMainMenu(data.menu);

  } catch (err) {
    console.error("❌ Falha:", err);
    statusText.textContent = "❌ Falha ao conectar ao servidor IPTV";
  }
});

// === PLAYER ===
function playChannel(url) {
  if (hls) {
    hls.destroy();
    hls = null;
  }

  player.style.display = "block"; // mostra o player só aqui

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

// === CONECTA OS BOTÕES DO MENU VISUAL ===
function initMenuTiles() {
  const liveBtn = document.querySelector('.tile-live');
  const moviesBtn = document.querySelector('.tile-movies');
  const seriesBtn = document.querySelector('.tile-series');
  const accountBtn = document.querySelector('.tile-account');
  const settingsBtn = document.querySelector('.tile-settings');
  const logoutBtn = document.querySelector('.tile-logout');

  const menu = document.querySelector('.menu-tiles');

  const showListAndLoad = (tipo) => {
    if (menu) menu.style.display = "none";   // esconde os tiles
    list.style.display = "block";            // mostra o container da lista
    loadCategorias(tipo);                     // carrega as categorias
  };

  if (liveBtn) liveBtn.onclick = () => showListAndLoad("tv");
  if (moviesBtn) moviesBtn.onclick = () => showListAndLoad("filmes");
  if (seriesBtn) seriesBtn.onclick = () => showListAndLoad("series");

  if (accountBtn) accountBtn.onclick = () => alert("📋 Em breve: informações da conta!");
  if (settingsBtn) settingsBtn.onclick = () => alert("⚙️ Em breve: configurações!");

  if (logoutBtn) logoutBtn.onclick = () => {
    if (menu) menu.style.display = "none"; 
    form.style.display = "block";
    list.style.display = "none";
    list.innerHTML = "";
    statusText.textContent = "";
  };
}

// Inicializa os tiles quando a página carrega
window.addEventListener("DOMContentLoaded", initMenuTiles);

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
