// Elemento para mostrar a versão
const versionEl = document.createElement('p');
versionEl.textContent = 'Service Worker: carregando...';
document.body.insertBefore(versionEl, document.body.firstChild);

// Envia mensagem para o Service Worker pedindo a versão
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({ type: 'get-sw-version' });
}

// Recebe a resposta do Service Worker
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

// Worker proxy
const WORKER_URL = "https://iptvip-proxy.lucianoffernands.workers.dev/?url=";

button.addEventListener('click', loadM3U);

async function loadM3U() {
  const m3u = input.value.trim();
  if (!m3u) return alert("Cole um link M3U válido!");

  statusText.textContent = "⏳ Carregando canais...";
  list.innerHTML = "";
  let channels = [];
  let buffer = "";

  try {
    const res = await fetch(WORKER_URL + encodeURIComponent(m3u));
    if (!res.ok || !res.body) throw new Error("Erro ao buscar lista");

    // leitura em streaming (linha a linha)
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let chunk;
    while (!(chunk = await reader.read()).done) {
      buffer += decoder.decode(chunk.value, { stream: true });
      let lines = buffer.split('\n');
      buffer = lines.pop(); // mantém o pedaço incompleto

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
          const name = lines[i].split(',').pop().trim();
          const url = lines[i + 1]?.trim();
          if (url && url.startsWith('http')) {
            channels.push({ name, url });
            if (channels.length <= 300) addChannelButton(name, url); // exibe até 300 canais
          }
        }
      }

      statusText.textContent = `📺 Lendo... ${channels.length} canais`;
    }

    statusText.textContent = `✅ ${channels.length} canais carregados`;
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
    hls.on(Hls.Events.MANIFEST_PARSED, () => player.play());
  } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
    player.src = url;
    player.play();
  } else {
    alert("Seu navegador não suporta reprodução de vídeo M3U8.");
  }
}
