async function loadM3U(url) {
  const proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
  const response = await fetch(proxy);
  const text = await response.text();

  const lines = text.split("\n");
  const listDiv = document.getElementById("channelList");
  listDiv.innerHTML = "";

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const nameMatch = lines[i].split(",")[1] || "Canal Desconhecido";
      const streamUrl = lines[i + 1];
      if (streamUrl && streamUrl.startsWith("http")) {
        const btn = document.createElement("div");
        btn.className = "channel";
        btn.textContent = nameMatch;
        btn.onclick = () => playChannel(streamUrl);
        listDiv.appendChild(btn);
      }
    }
  }
}

function playChannel(url) {
  const video = document.getElementById("videoPlayer");
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
