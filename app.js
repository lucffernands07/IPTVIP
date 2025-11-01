// === Elementos principais ===
const form = document.getElementById('loginForm');
const list = document.getElementById('channelList');
const player = document.getElementById('videoPlayer');
const statusText = document.createElement('p');
document.body.insertBefore(statusText, list);

const WORKER_URL = "https://iptvip-proxy.lucianoffernands.workers.dev/";

let hls = null;
let loginData = {};

// === LOGIN ===
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

  loginData = { username, password, url };

  list.innerHTML = '';
  statusText.textContent = "🚀 Conectando ao servidor IPTV...";

  try {
    // 🔒 Força HTTPS e remove barras extras
    let safeUrl = url.trim();
    if (safeUrl.startsWith("http://")) {
      safeUrl = safeUrl.replace("http://", "https://");
    }
    if (safeUrl.endsWith("/")) {
      safeUrl = safeUrl.slice(0, -1);
    }

    console.log("🌐 URL segura usada:", safeUrl);

    // 🛰️ Monta a URL de requisição ao Worker
    const fetchUrl = `${WORKER_URL}?action=menu&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&url=${encodeURIComponent(safeUrl)}`;

    console.log("🚀 Solicitando menu em:", fetchUrl);

    // 🧠 Tenta com CORS normal primeiro
    let res;
    try {
      res = await fetch(fetchUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
      });
    } catch (err) {
      console.warn("⚠️ CORS falhou, tentando no-cors:", err);
      res = await fetch(fetchUrl, { method: "GET", mode: "no-cors" });
    }

    if (!res || !res.ok) {
      throw new Error(`Erro ao conectar ao servidor (status: ${res?.status || "sem resposta"})`);
    }

    const data = await res.json();
    console.log("✅ Menu recebido:", data);

    // 🎨 Atualiza UI
    form.style.display = "none";
    statusText.textContent = "📺 Escolha uma opção";
    showMainMenu(data.menu);

  } catch (err) {
    console.error("❌ Falha:", err);
    statusText.textContent = "❌ Falha ao conectar ao servidor IPTV";
  }
}); // <-- ✅ fecha o listener aqui

// === MENU PRINCIPAL ===
function showMainMenu(menuList) {
  list.innerHTML = '';

  menuList.forEach(item => {
    const btn = document.createElement('button');
    btn.textContent =
      item === "tv" ? "📺 TV ao Vivo" :
      item === "filmes" ? "🎬 Filmes" :
      item === "series" ? "📂 Séries" : item;
    btn.className = "main-btn";
    btn.onclick = () => loadCategorias(item);
    list.appendChild(btn);
  });

  // Botão sair (volta para login)
  const exitBtn = document.createElement('button');
  exitBtn.textContent = "🚪 Sair";
  exitBtn.className = "back-btn";
  exitBtn.onclick = () => {
    form.style.display = "block";
    list.innerHTML = "";
    statusText.textContent = "";
  };
  list.appendChild(exitBtn);
}

// === CARREGAR CATEGORIAS ===
async function loadCategorias(tipo) {
  list.innerHTML = '';
  statusText.textContent = "📦 Carregando categorias...";

  const { username, password, url } = loginData;
  const endpoint = `${WORKER_URL}?action=categorias&tipo=${tipo}&username=${username}&password=${password}&url=${encodeURIComponent(url)}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error("Erro ao buscar categorias");
    const data = await res.json();

    statusText.textContent = "📚 Escolha uma categoria";
    list.innerHTML = '';

    data.categorias.forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat;
      btn.className = "category-btn";
      btn.onclick = () => loadCanais(tipo, cat);
      list.appendChild(btn);
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = "⬅️ Voltar ao Menu";
    backBtn.className = "back-btn";
    backBtn.onclick = () => showMainMenu(["tv", "filmes", "series"]);
    list.appendChild(backBtn);

  } catch (err) {
    console.error(err);
    statusText.textContent = "❌ Falha ao carregar categorias";
  }
}

// === CARREGAR CANAIS ===
async function loadCanais(tipo, categoria) {
  list.innerHTML = '';
  statusText.textContent = `📡 Carregando canais de ${categoria}...`;

  const { username, password, url } = loginData;
  const endpoint = `${WORKER_URL}?action=canais&tipo=${tipo}&categoria=${encodeURIComponent(categoria)}&username=${username}&password=${password}&url=${encodeURIComponent(url)}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error("Erro ao buscar canais");
    const data = await res.json();

    statusText.textContent = `✅ ${data.total} canais encontrados`;
    list.innerHTML = '';

    data.canais.forEach(ch => {
      const div = document.createElement('div');
      div.className = "channel-item";

      const logo = document.createElement('img');
      logo.src = ch.logo || 'https://via.placeholder.com/60x60?text=TV';
      logo.className = "channel-logo";

      const name = document.createElement('span');
      name.textContent = ch.nome;
      name.className = "channel-name";

      div.appendChild(logo);
      div.appendChild(name);
      div.onclick = () => playChannel(ch.url);
      list.appendChild(div);
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = "⬅️ Voltar às Categorias";
    backBtn.className = "back-btn";
    backBtn.onclick = () => loadCategorias(tipo);
    list.appendChild(backBtn);

  } catch (err) {
    console.error(err);
    statusText.textContent = "❌ Falha ao carregar canais";
  }
}

// === PLAYER ===
function playChannel(url) {
  if (hls) {
    hls.destroy();
    hls = null;
  }

  player.style.display = "block";

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
