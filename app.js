async function loadM3U(url) {
  const proxy = "https://cors-proxy.fringe.zone/raw?url=" + encodeURIComponent(url);
  const listDiv = document.getElementById("channelList");
  listDiv.innerHTML = "⏳ Carregando lista...";

  try {
    const response = await fetch(proxy);
    if (!response.ok) throw new Error("Erro HTTP: " + response.status);

    const text = await response.text();
    const lines = text.split("\n");
    listDiv.innerHTML = "";

    let found = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXTINF")) {
        const name = lines[i].split(",")[1] || "Canal desconhecido";
        const streamUrl = lines[i + 1];
        if (streamUrl && streamUrl.startsWith("http")) {
          found++;
          const btn = document.createElement("div");
          btn.className = "channel";
          btn.textContent = name;
          btn.onclick = () => playChannel(streamUrl);
          listDiv.appendChild(btn);
        }
      }
    }

    if (found === 0) listDiv.innerHTML = "❌ Nenhum canal encontrado.";
  } catch (err) {
    listDiv.innerHTML = "⚠️ Erro ao carregar lista: " + err.message;
    console.error(err);
  }
}

function playChannel(url) {
  const video = document.getElementById("videoPlayer");
  video.src = "";
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
    video.addEventListener("loadedmetadata", () => video.play());
  } else {
    alert("Seu navegador não suporta streaming HLS 😢");
  }
}

document.getElementById("loadBtn").addEventListener("click", () => {
  const m3uUrl = document.getElementById("m3uUrl").value.trim();
  if (m3uUrl) {
    loadM3U(m3uUrl);
  } else {
    alert("Cole o link M3U primeiro!");
  }
});
