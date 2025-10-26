// URL do seu Worker que faz o proxy
const WORKER_URL = "https://iptvip-proxy.lucianoffernands.workers.dev/?url=";

// URL original da lista M3U
const M3U_URL = "http://manchete.asia/get.php?username=Pano071284&password=07122020et&type=m3u_plus&output=m3u8";

const statusEl = document.getElementById('status');
const listEl = document.getElementById('channel-list');
const videoEl = document.getElementById('player');

// Função principal: carrega e exibe canais
async function loadM3U() {
  try {
    statusEl.textContent = "📺 Carregando canais...";

    const res = await fetch(WORKER_URL + encodeURIComponent(M3U_URL));
    if (!res.ok) throw new Error("Erro ao buscar lista");

    const text = await res.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let channels = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF')) {
        const nameMatch = lines[i].match(/,(.*)$/);
        const name = nameMatch ? nameMatch[1] : 'Canal sem nome';
        const url = lines[i + 1];
        if (url && url.startsWith('http')) {
          channels.push({ name, url });
        }
      }
    }

    if (!channels.length) {
      statusEl.textContent = "Nenhum canal encontrado 😢";
      return;
    }

    statusEl.textContent = `✅ ${channels.length} canais encontrados`;
    renderChannels(channels);

  } catch (err) {
    console.error(err);
    statusEl.textContent = "❌ Erro ao carregar canais";
  }
}

// Mostra os canais na tela
function renderChannels(channels) {
  listEl.innerHTML = "";
  channels.forEach(ch => {
    const btn = document.createElement('button');
    btn.textContent = ch.name;
    btn.className = 'channel-btn';
    btn.onclick = () => playChannel(ch.url);
    listEl.appendChild(btn);
  });
}

// Toca o canal selecionado
function playChannel(url) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(videoEl);
  } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
    videoEl.src = url;
  } else {
    alert("Seu navegador não suporta streaming HLS 😢");
  }
  videoEl.play();
}

// Inicia
window.onload = loadM3U;
