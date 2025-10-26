document.addEventListener('DOMContentLoaded', () => {
  // Elementos do HTML
  const m3uInput = document.getElementById('m3uUrl');
  const loadBtn = document.getElementById('loadBtn');
  const listEl = document.getElementById('channelList');
  const videoEl = document.getElementById('videoPlayer');

  // URL do seu Worker (proxy)
  const WORKER_URL = "https://iptvip-proxy.lucianoffernands.workers.dev/?url=";

  // Função para carregar a lista M3U
  async function loadM3U() {
    try {
      listEl.innerHTML = "📺 Carregando canais...";

      const m3uUrl = m3uInput.value;
      if (!m3uUrl) {
        listEl.innerHTML = "❌ Cole um link M3U válido";
        return;
      }

      const res = await fetch(WORKER_URL + encodeURIComponent(m3uUrl));
      if (!res.ok) throw new Error("Erro ao buscar lista");

      const text = await res.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);

      const channels = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
          const nameMatch = lines[i].match(/,(.*)$/);
          const name = nameMatch ? nameMatch[1] : 'Canal sem nome';
          const url = lines[i + 1];
          if (url && url.startsWith('http')) channels.push({ name, url });
        }
      }

      if (!channels.length) {
        listEl.innerHTML = "❌ Nenhum canal encontrado";
        return;
      }

      // Exibe os canais
      listEl.innerHTML = "";
      channels.forEach(ch => {
        const btn = document.createElement('button');
        btn.textContent = ch.name;
        btn.className = 'channel-btn';
        btn.style.margin = "5px";
        btn.onclick = () => playChannel(ch.url);
        listEl.appendChild(btn);
      });

    } catch (err) {
      console.error(err);
      listEl.innerHTML = "❌ Erro ao carregar canais";
    }
  }

  // Função para tocar canal
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

  // Evento do botão
  loadBtn.addEventListener('click', loadM3U);
});
