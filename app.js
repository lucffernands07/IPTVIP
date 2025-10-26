const input = document.getElementById('m3uUrl');
const button = document.getElementById('loadBtn');
const list = document.getElementById('channelList');
const player = document.getElementById('videoPlayer');
const statusText = document.createElement('p');
statusText.textContent = "Aguardando...";
document.body.insertBefore(statusText, list);

// URL do seu Worker (proxy)
const WORKER_URL = "https://iptvip-proxy.lucianoffernands.workers.dev/?url=";

button.addEventListener('click', loadM3U);

async function loadM3U() {
  const m3u = input.value.trim();
  if (!m3u) {
    alert("Cole um link M3U válido!");
    return;
  }

  statusText.textContent = "⏳ Carregando canais...";
  list.innerHTML = "";

  try {
    const res = await fetch(WORKER_URL + encodeURIComponent(m3u));
    if (!res.ok) throw new Error("Erro ao buscar lista");
    const text = await res.text();
    const lines = text.split('\n');
    let channels = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF')) {
        const name = lines[i].split(',').pop().trim();
        const url = lines[i + 1]?.trim();
        if (url && url.startsWith('http')) {
          channels.push({ name, url });
        }
      }
    }

    if (channels.length === 0) throw new Error("Nenhum canal encontrado");

    channels.forEach(ch => {
      const btn = document.createElement('button');
      btn.textContent = ch.name;
      btn.style.display = 'block';
      btn.style.margin = '5px 0';
      btn.onclick = () => playChannel(ch.url);
      list.appendChild(btn);
    });

    statusText.textContent = `✅ ${channels.length} canais carregados`;
  } catch (err) {
    console.error(err);
    statusText.textContent = "❌ Erro ao carregar lista";
  }
}

function playChannel(url) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(player);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      player.play();
    });
  } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
    player.src = url;
    player.play();
  } else {
    alert("Seu navegador não suporta reprodução de vídeo M3U8.");
  }
    }
