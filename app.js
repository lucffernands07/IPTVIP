console.log("✅ app.js carregado");

// Função principal para carregar a lista M3U
async function loadM3U(url) {
  try {
    console.log("📡 Carregando lista:", url);
    const proxy = "https://iptvip-proxy.lucianoffernands.workers.dev/?url=";
    const response = await fetch(proxy + encodeURIComponent(url));

    if (!response.ok) throw new Error("Erro ao baixar lista");

    const text = await response.text();
    console.log("✅ Lista carregada com sucesso!");
    parseM3U(text);
  } catch (e) {
    console.error("❌ Erro ao carregar M3U:", e);
    alert("Falha ao carregar a lista. Verifique o link M3U ou CORS.");
  }
}

// Interpreta o conteúdo M3U e cria os botões dos canais
function parseM3U(text) {
  const lines = text.split("\n");
  const container = document.getElementById("channelList");
  container.innerHTML = "";

  let currentName = "";
  let count = 1;

  lines.forEach(line => {
    line = line.trim();

    // Nome do canal (linha #EXTINF)
    if (line.startsWith("#EXTINF")) {
      const match = line.match(/,(.*)$/);
      if (match) currentName = match[1];
    }

    // URL do canal
    if (line.startsWith("http")) {
      const btn = document.createElement("button");
      btn.textContent = currentName || `Canal ${count++}`;
      btn.className = "channel-btn";
      btn.onclick = () => playStream(line);
      container.appendChild(btn);
    }
  });

  if (!container.children.length) {
    container.innerHTML = "<p>Nenhum canal encontrado.</p>";
  }
}

// Toca o link do canal no player
function playStream(url) {
  const video = document.getElementById("videoPlayer");
  console.log("🎬 Tocando:", url);

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
  } else {
    alert("Seu navegador não suporta streaming HLS.");
  }
}

// Evento do botão “Carregar Lista”
document.getElementById("loadBtn").addEventListener("click", () => {
  const url = document.getElementById("m3uUrl").value.trim();
  if (url) {
    document.getElementById("channelList").innerHTML = "<p>⏳ Carregando canais...</p>";
    loadM3U(url);
  } else {
    alert("Cole um link M3U válido!");
  }
});
