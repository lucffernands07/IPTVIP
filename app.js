// === Elementos principais ===
const input = document.getElementById('m3uUrl'); // ainda pode colar M3U se quiser
const button = document.getElementById('loadBtn');
const list = document.getElementById('channelList');
const player = document.getElementById('videoPlayer');
const statusText = document.createElement('p');
document.body.insertBefore(statusText, list);

// Novo select de categorias
let categorySelect = document.getElementById('categorySelect');
if (!categorySelect) {
  categorySelect = document.createElement('select');
  categorySelect.id = 'categorySelect';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Todas as categorias';
  categorySelect.appendChild(defaultOption);
  document.body.insertBefore(categorySelect, list);
}

const WORKER_URL = "https://iptvip-proxy.lucianoffernands.workers.dev/";
const limit = 100;

let currentPage = 1;
let currentCategory = '';
let channelsData = [];
let loadMoreBtn = null;
let hls = null;

// === Carregar lista ===
button.addEventListener('click', () => {
  currentCategory = categorySelect.value;
  list.innerHTML = '';
  currentPage = 1;
  loadChannelsPage();
});

// === Função para carregar canais por categoria (paginado) ===
async function loadChannelsPage() {
  statusText.textContent = `⏳ Carregando canais...`;
  const url = `${WORKER_URL}?category=${encodeURIComponent(currentCategory)}&page=${currentPage}&limit=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao buscar canais');

    const json = await res.json();
    const lines = json.channels || [];

    let added = 0;
    lines.forEach(chan => {
      if (chan.name && chan.url) {
        const proxyUrl = `${WORKER_URL}stream?url=${encodeURIComponent(chan.url)}`;
        addChannelButton(chan.name, proxyUrl);
        added++;
      }
    });

    if (added > 0) {
      statusText.textContent = `✅ Página ${currentPage} (${added} canais)`;
      showLoadMoreButton();
    } else {
      statusText.textContent = "🎬 Fim da lista.";
      hideLoadMoreButton();
    }

    // Atualiza lista de categorias
    updateCategoryOptions(json.categories || []);

  } catch (err) {
    console.error(err);
    statusText.textContent = "❌ Erro ao carregar canais";
  }
}

// === Criar botões de canais ===
function addChannelButton(name, url) {
  const btn = document.createElement('button');
  btn.textContent = name;
  btn.style.display = 'block';
  btn.style.margin = '5px 0';
  btn.onclick = () => playChannel(url);
  list.appendChild(btn);
}

// === Reproduzir canal ===
function playChannel(url) {
  if (hls) { hls.destroy(); hls = null; }

  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(player);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      player.play().catch(() => alert("Clique no player para iniciar o vídeo."));
    });
  } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
    player.src = url;
    player.play();
  } else {
    alert("Seu navegador não suporta M3U8.");
  }
}

// === Paginação ===
function showLoadMoreButton() {
  if (!loadMoreBtn) {
    loadMoreBtn = document.createElement('button');
    loadMoreBtn.textContent = "⬇️ Carregar mais canais";
    loadMoreBtn.style.margin = '10px 0';
    loadMoreBtn.onclick = () => {
      currentPage++;
      loadChannelsPage();
    };
    document.body.appendChild(loadMoreBtn);
  }
  loadMoreBtn.style.display = 'block';
}

function hideLoadMoreButton() {
  if (loadMoreBtn) loadMoreBtn.style.display = 'none';
}

// === Atualiza opções do select de categorias ===
function updateCategoryOptions(categories) {
  const existing = Array.from(categorySelect.options).map(o => o.value);
  categories.forEach(cat => {
    if (!existing.includes(cat)) {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    }
  });
}

// === Registro do Service Worker ===
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(() => console.log('✅ Service Worker registrado com sucesso'))
    .catch(err => console.error('❌ Falha ao registrar o Service Worker:', err));
}

// === Versão do app ===
window.onload = () => {
  navigator.serviceWorker.ready.then(registration => {
    if (registration.active) {
      registration.active.postMessage({ type: 'GET_VERSION' });
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'VERSION_INFO') {
          const versionText = `Versão ${event.data.version}`;
          const versionEl = document.createElement('div');
          versionEl.id = 'app-version';
          versionEl.textContent = versionText;
          document.body.appendChild(versionEl);
        }
      });
    }
  });
};
