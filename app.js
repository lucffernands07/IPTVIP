// === Elementos principais ===
const input = document.getElementById('m3uUrl');
const button = document.getElementById('loadBtn');
const list = document.getElementById('channelList');
const player = document.getElementById('videoPlayer');
const statusText = document.createElement('p');
document.body.insertBefore(statusText, list);

const WORKER_URL = "https://iptvip-proxy.lucianoffernands.workers.dev/";
const limit = 100;

let currentPage = 1;
let currentM3U = '';
let loadMoreBtn = null;
let hls = null;

// === Carregar lista ===
button.addEventListener('click', () => {
  currentM3U = input.value.trim();
  if (!currentM3U) return alert("Cole o link M3U completo!");
  list.innerHTML = '';
  currentPage = 1;
  loadM3UPage();
});

// === Função para carregar lista paginada ===
async function loadM3UPage() {
  statusText.textContent = `⏳ Carregando canais...`;
  const url = `${WORKER_URL}?url=${encodeURIComponent(currentM3U)}&page=${currentPage}&limit=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao buscar lista M3U');

    const text = await res.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let added = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF')) {
        const name = lines[i].split(',').pop().trim();
        const streamUrl = lines[i + 1]?.trim();
        if (streamUrl && streamUrl.startsWith('http')) {
          const proxyUrl = `${WORKER_URL}stream?url=${encodeURIComponent(streamUrl)}`;
          addChannelButton(name, proxyUrl);
          added++;
        }
      }
    }

    if (added > 0) {
      statusText.textContent = `✅ Página ${currentPage} (${added} canais)`;
      showLoadMoreButton();
    } else {
      statusText.textContent = "🎬 Fim da lista.";
      hideLoadMoreButton();
    }

  } catch (err) {
    console.error(err);
    statusText.textContent = "❌ Erro ao carregar lista";
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
  // Fecha player anterior
  if (hls) {
    hls.destroy();
    hls = null;
  }

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
      loadM3UPage();
    };
    document.body.appendChild(loadMoreBtn);
  }
  loadMoreBtn.style.display = 'block';
}

function hideLoadMoreButton() {
  if (loadMoreBtn) loadMoreBtn.style.display = 'none';
}

// === Registro do Service Worker ===
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(() => console.log('✅ Service Worker registrado com sucesso'))
    .catch(err => console.error('❌ Falha ao registrar o Service Worker:', err));
}

window.onload = () => {
  // === Mostra versão do app no canto superior direito ===
  navigator.serviceWorker.ready.then(registration => {
    if (registration.active) {
      // Pede a versão ao Service Worker
      registration.active.postMessage({ type: 'GET_VERSION' });

      // Escuta a resposta com a versão
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'VERSION_INFO') {
          const versionText = `Versão ${event.data.version}`;

          // Cria o elemento visual discreto
          const versionEl = document.createElement('div');
          versionEl.id = 'app-version';
          versionEl.textContent = versionText;
          document.body.appendChild(versionEl);
        }
      });
    }
  });

  // === CSS dinâmico da versão ===
  const style = document.createElement('style');
  style.textContent = `
    #app-version {
      position: fixed;
      top: 6px;
      right: 10px;
      font-size: 11px;
      color: #ccc;
      opacity: 0.6;
      font-family: monospace;
      z-index: 9999;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
};
