// === Elementos principais ===
const loginBtn = document.getElementById('loginBtn');
const listNameInput = document.getElementById('listName');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const serverUrlInput = document.getElementById('serverUrl');

const menu = document.getElementById('menu');
const categoryBtns = document.querySelectorAll('.categoryBtn');

const list = document.getElementById('channelList');
const player = document.getElementById('videoPlayer');
const statusText = document.createElement('p');
document.body.insertBefore(statusText, list);

const WORKER_URL = "https://iptvip-proxy.lucianoffernands.workers.dev/";
let currentM3U = '';
let currentCategory = '';
let hls = null;

// === Login (gerar M3U) ===
loginBtn.addEventListener('click', async () => {
  const listName = listNameInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const serverUrl = serverUrlInput.value.trim();

  if (!username || !password || !serverUrl) return alert("Preencha todos os campos!");

  // Monta URL XTREAM Codes M3U
  currentM3U = `${serverUrl}/get.php?username=${username}&password=${password}&type=m3u_plus&output=m3u8`;

  // Mostra menu
  menu.style.display = 'block';
  statusText.textContent = "✅ Login bem-sucedido. Escolha uma categoria.";
});

// === Menu de categorias ===
categoryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentCategory = btn.dataset.cat.toUpperCase();
    list.innerHTML = '';
    loadM3U();
  });
});

// === Função para carregar M3U filtrada por categoria ===
async function loadM3U() {
  statusText.textContent = "⏳ Carregando canais...";

  try {
    let url = `${WORKER_URL}?url=${encodeURIComponent(currentM3U)}`;
    if (currentCategory) url += `&category=${encodeURIComponent(currentCategory)}`;

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

    statusText.textContent = added > 0 ? `✅ ${added} canais carregados.` : "🎬 Nenhum canal encontrado.";

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
