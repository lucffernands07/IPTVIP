// Mostrar versão do SW
const versionEl = document.createElement('p');
versionEl.textContent = 'Service Worker: carregando...';
document.body.insertBefore(versionEl, document.body.firstChild);

if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({ type: 'get-sw-version' });
}
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'sw-version') {
    versionEl.textContent = `Service Worker: ${event.data.version}`;
  }
});

const input = document.getElementById('m3uUrl');
const button = document.getElementById('loadBtn');
const list = document.getElementById('channelList');
const player = document.getElementById('videoPlayer');
const statusText = document.createElement('p');
statusText.textContent = "Aguardando...";
document.body.insertBefore(statusText, list);

// Worker proxy (com paginação)
const WORKER_URL = "https://iptvip-proxy.lucianoffernands.workers.dev/";

let currentPage = 1;
let currentM3U = '';
const limit = 100; // canais por página

button.addEventListener('click', () => {
  currentPage = 1;
  currentM3U = input.value.trim();
  if (!currentM3U) return alert("Cole um link M3U válido!");
  list.innerHTML = '';
  loadM3UPage();
});

async function loadM3UPage() {
  statusText.textContent = `⏳ Carregando página ${currentPage}...`;
  const url = `${WORKER_URL}?url=${encodeURIComponent(currentM3U)}&page=${currentPage}&limit=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao buscar lista');

    const text = await res.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let added = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF')) {
        const name = lines[i].split(',').pop().trim();
        const streamUrl = lines[i + 1]?.trim();
        if (streamUrl && streamUrl.startsWith('http')) {
          addChannelButton(name, streamUrl);
          added++;
        }
      }
    }

    if (added > 0) {
      statusText.textContent = `✅ Página ${currentPage} (${added} canais)`;
      showLoadMoreButton();
    } else {
      statusText.textContent = `🎬 Fim da lista.`;
      hideLoadMoreButton();
    }
  } catch (err) {
    console.error(err);
    statusText.textContent = "❌ Erro ao carregar lista";
  }
}

function addChannelButton(name, url) {
  const btn = document.createElement('button');
  btn.textContent = name;
  btn.style.display = 'block';
  btn.style.margin = '5px 0';
  btn.onclick = () => playChannel(url);
  list.appendChild(btn);
}

function playChannel(url) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(player);
    hl
