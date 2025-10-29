// === Elementos principais ===
const form = document.getElementById('loginForm'); // formulário de login
const list = document.getElementById('channelList');
const player = document.getElementById('videoPlayer');
const statusText = document.createElement('p');
document.body.insertBefore(statusText, list);

const WORKER_URL = "https://iptvip-proxy.lucianoffernands.workers.dev/";

let hls = null;

// === Evento de login ===
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

  list.innerHTML = '';
  statusText.textContent = `⏳ Carregando canais...`;

  try {
    // Chama o Worker passando os dados do login
    const res = await fetch(`${WORKER_URL}?url=${encodeURIComponent(url)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
    if (!res.ok) throw new Error('Erro ao buscar lista');

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

    statusText.textContent = added > 0 ? `✅ ${added} canais carregados` : "🎬 Nenhum canal encontrado";

  } catch (err) {
    console.error(err);
    statusText.textContent = "❌ Erro ao carregar lista";
  }
});

// === Criar botões de canais ===
function addChannelButton(name, url) {
  const btn = document.createElement('button');
  btn.textContent = name;
  btn.className = "channel-btn"; // usa CSS do style.css
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

// === Registro do Service Worker ===
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(() => console.log('✅ Service Worker registrado com sucesso'))
    .catch(err => console.error('❌ Falha ao registrar o Service Worker:', err));
}

// === Mostra versão do app no front ===
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
