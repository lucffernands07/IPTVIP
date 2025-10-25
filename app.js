const channelList = document.getElementById('channel-list');
const player = document.getElementById('player');
const clearFavoritesBtn = document.getElementById('clear-favorites');

let channels = [];
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function renderChannels() {
  channelList.innerHTML = '';
  channels.forEach(ch => {
    const li = document.createElement('li');
    li.textContent = ch.name;
    if(favorites.includes(ch.name)) li.classList.add('favorite');

    li.addEventListener('click', () => playChannel(ch.url));
    li.addEventListener('dblclick', () => toggleFavorite(ch.name, li));

    channelList.appendChild(li);
  });
}

function toggleFavorite(name, li) {
  if(favorites.includes(name)){
    favorites = favorites.filter(f => f !== name);
    li.classList.remove('favorite');
  } else {
    favorites.push(name);
    li.classList.add('favorite');
  }
  saveFavorites();
}

function playChannel(url) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(player);
  } else {
    player.src = url;
  }
}

// Lista M3U online
const m3uUrl = 'http://manchete.asia/get.php?username=Pano071284&password=07122020et&type=m3u_plus&output=m3u8';

fetch(m3uUrl)
  .then(res => res.text())
  .then(text => {
    const lines = text.split('\n');
    channels = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF')) {
        const name = lines[i].split(',')[1] || 'Canal';
        const url = lines[i+1];
        channels.push({ name, url });
      }
    }
    renderChannels();
  })
  .catch(err => console.error('Erro ao carregar a lista M3U:', err));

clearFavoritesBtn.addEventListener('click', () => {
  favorites = [];
  saveFavorites();
  renderChannels();
});
