const fileInput = document.getElementById('file-input');
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

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const lines = event.target.result.split('\n');
    channels = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF')) {
        const name = lines[i].split(',')[1] || 'Canal';
        const url = lines[i+1];
        channels.push({ name, url });
      }
    }
    renderChannels();
  };
  reader.readAsText(file);
});

clearFavoritesBtn.addEventListener('click', () => {
  favorites = [];
  saveFavorites();
  renderChannels();
});
