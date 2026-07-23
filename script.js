/* ==========================================
   SUPABASE-KONFIGURATION
   Klistra in dina egna värden från
   Supabase → Settings → API
   ========================================== */
const SUPABASE_URL = "https://sktumupwkhqqiziaylqw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdHVtdXB3a2hxcWl6aWF5bHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MDk1OTEsImV4cCI6MjEwMDM4NTU5MX0.A9uDk0fcEDBED2CJgvN7ijczh_mjEV82Mo1idkLta5k";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let allMediaData = []; // Sparar all data för filtrering

/* ==========================================
   TEMA (SPARAS I LOCALSTORAGE)
   ========================================== */
function skiftaTema() {
  const arMorkt = document.body.classList.toggle("dark-mode");
  localStorage.setItem("tema", arMorkt ? "dark" : "light");
}

function laddaTema() {
  const sparatTema = localStorage.getItem("tema");
  if (sparatTema === "dark") {
    document.body.classList.add("dark-mode");
  }
}

/* ==========================================
   HJÄLPFUNKTIONER
   ========================================== */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function formatDatum(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/* ==========================================
   ANSLAGSTAVLA / KOMMENTARSFLÖDE (SUPABASE)
   ========================================== */
async function laddaGuestbook() {
  const container = document.getElementById('notes-container');
  if (!container) return;

  if (!supabaseClient) {
    container.innerHTML = '<p>Kommentarsfunktionen är inte konfigurerad än.</p>';
    return;
  }

  const { data, error } = await supabaseClient
    .from('comments')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.log('Kunde inte hämta kommentarer:', error);
    container.innerHTML = '<p>Kunde inte ladda kommentarer just nu. Försök igen om en liten stund.</p>';
    return;
  }

  const trad = byggKommentarstrad(data || []);
  const rootsNyastForst = trad.slice().reverse();

  container.innerHTML = rootsNyastForst.length > 0
    ? rootsNyastForst.map(renderKommentar).join('')
    : '<p>Bli den första att skriva något!</p>';
}

function byggKommentarstrad(kommentarer) {
  const map = {};
  const roots = [];

  kommentarer.forEach(k => { k.svar = []; map[k.id] = k; });
  kommentarer.forEach(k => {
    if (k.parent_id && map[k.parent_id]) {
      map[k.parent_id].svar.push(k);
    } else if (!k.parent_id) {
      roots.push(k);
    }
  });

  return roots;
}

function renderKommentar(k) {
  const namn = k.name && k.name.trim() !== '' ? escapeHtml(k.name) : 'Anonym';
  const text = escapeHtml(k.text);
  const svarHTML = (k.svar || []).map(renderKommentar).join('');

  return `
    <div class="comment" data-id="${k.id}">
      <div class="comment-header">
        <span class="comment-name">${namn}</span>
        <span class="comment-date">${formatDatum(k.created_at)}</span>
      </div>
      <p class="comment-text">${text}</p>
      <button type="button" class="reply-btn" onclick="visaSvarsformular(event, ${k.id})">Svara</button>
      <div class="reply-form-slot" id="reply-form-${k.id}"></div>
      ${svarHTML ? `<div class="comment-replies">${svarHTML}</div>` : ''}
    </div>
  `;
}

function visaSvarsformular(event, parentId) {
  const slot = document.getElementById(`reply-form-${parentId}`);
  if (!slot) return;

  // Om formuläret redan är öppet, stäng det (toggle)
  if (slot.innerHTML.trim() !== '') {
    slot.innerHTML = '';
    return;
  }

  slot.innerHTML = `
    <form class="reply-form" onsubmit="skickaKommentar(event, ${parentId})">
      <input type="text" class="comment-name-input" placeholder="Ditt namn (valfritt)">
      <input type="text" class="comment-text-input" placeholder="Skriv ett svar..." required>
      <button type="submit">SVARA</button>
    </form>
  `;
}

async function skickaKommentar(event, parentId) {
  event.preventDefault();

  if (!supabaseClient) {
    alert('Kommentarsfunktionen är inte konfigurerad än.');
    return;
  }

  const form = event.target;
  const namnInput = form.querySelector('.comment-name-input');
  const textInput = form.querySelector('.comment-text-input');
  const namn = namnInput.value.trim();
  const text = textInput.value.trim();

  if (text === '') return;

  const { error } = await supabaseClient.from('comments').insert({
    name: namn || null,
    text: text,
    parent_id: parentId
  });

  if (error) {
    console.log('Kunde inte spara kommentar:', error);
    alert('Något gick fel när kommentaren skulle sparas. Försök igen om en liten stund.');
    return;
  }

  form.reset();
  laddaGuestbook();
}

/* ==========================================
   CACHAD FETCH (MINSKAR RISKEN FÖR
   GITHUB API RATE-LIMITING)
   ========================================== */
const CACHE_TID_MS = 10 * 60 * 1000; // 10 minuter

async function cachadFetch(url) {
  const cacheKey = `cache:${url}`;
  let cachat = null;
  try {
    cachat = JSON.parse(localStorage.getItem(cacheKey) || "null");
  } catch (e) {
    cachat = null;
  }

  if (cachat && (Date.now() - cachat.tid) < CACHE_TID_MS) {
    return cachat.data;
  }

  const res = await fetch(url);
  if (!res.ok) {
    if (cachat) return cachat.data; // hellre gammal data än ingen alls
    throw new Error(`Fetch misslyckades: ${url}`);
  }

  const data = await res.json();
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ tid: Date.now(), data }));
  } catch (e) {
    // localStorage kan vara full/blockerad - inte kritiskt
  }
  return data;
}

/* ==========================================
   LADDA SIDINNEHÅLL
   ========================================== */
async function laddaSidinnehall() {
  laddaTema();

  try {
    const res = await fetch('/content/index.json');
    if (res.ok) {
      const data = await res.json();
      if (data.title) document.querySelector('.hero-scrapbook h1').textContent = data.title;
      if (data.subtitle) document.querySelector('.hero-subtext').textContent = data.subtitle;
      if (data.intro) {
        const introEl = document.querySelector('.handwritten-intro');
        if (introEl) introEl.textContent = data.intro;
      }
    }
  } catch (err) {
    console.log("Kunde inte ladda statisk text.");
  }

  laddaProjekt();
  laddaMedia();
  laddaGuestbook();
}

async function laddaProjekt() {
  const gridContainer = document.querySelector('.portfolio-grid');
  if (!gridContainer) return;

  try {
    const files = await cachadFetch('https://api.github.com/repos/elinolofssonbogren/portfolio/contents/content/projects');
    let projectsHTML = '';

    for (const file of files) {
      if (file.name.startsWith('.')) continue;

      const itemRes = await fetch(`/content/projects/${file.name}`);
      if (itemRes.ok) {
        let p = {};
        if (file.name.endsWith('.json')) {
          p = await itemRes.json();
        } else if (file.name.endsWith('.md')) {
          const rawText = await itemRes.text();
          rawText.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
              p[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
            }
          });
        } else {
          continue;
        }

        const bildUrl = p.image || 'https://picsum.photos/700/500';

        projectsHTML += `
          <article class="project-item">
              <div class="project-img-wrapper">
                  <img src="${bildUrl}" alt="${p.title || 'Projekt'}" onerror="this.closest('.project-img-wrapper').classList.add('bild-saknas'); this.remove();">
              </div>
              <div class="project-meta">
                  <h3>${p.title || 'Utan titel'}</h3>
                  <span>${p.year || p.category || ''}</span>
              </div>
          </article>
        `;
      }
    }

    if (projectsHTML !== '') gridContainer.innerHTML = projectsHTML;
  } catch (err) {
    console.log("Använder standardprojekt.");
  }
}

/* ==========================================
   MEDIA OCH FILTRERING
   ========================================== */
async function laddaMedia() {
  const mediaContainer = document.querySelector('#media-grid');
  if (!mediaContainer) return;

  try {
    const files = await cachadFetch('https://api.github.com/repos/elinolofssonbogren/portfolio/contents/content/media');
    allMediaData = [];

    for (const file of files) {
      if (file.name.startsWith('.')) continue;

      const itemRes = await fetch(`/content/media/${file.name}`);
      if (itemRes.ok) {
        let item = {};
        if (file.name.endsWith('.json')) {
          item = await itemRes.json();
        } else if (file.name.endsWith('.md')) {
          const rawText = await itemRes.text();
          rawText.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed === '---' || !trimmed) return;
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex !== -1) {
              const key = trimmed.slice(0, colonIndex).trim();
              let val = trimmed.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
              item[key] = val;
            }
          });
        } else {
          continue;
        }

        allMediaData.push(item);
      }
    }

    visaMedia(allMediaData);
  } catch (err) {
    console.log("Fel vid automatisk inläsning av media:", err);
  }
}

function visaMedia(lista) {
  const mediaContainer = document.querySelector('#media-grid');
  if (!mediaContainer) return;

  let mediaHTML = '';
  lista.forEach(item => {
    const harGiltigBild = item.image && !item.image.includes('youtu');

    mediaHTML += `
      <div class="media-card" data-type="${(item.type || '').toLowerCase()}">
        ${harGiltigBild ? `<div class="media-img-wrapper"><img src="${item.image}" alt="${item.title || 'Media'}" onerror="this.closest('.media-img-wrapper').remove();"></div>` : ''}
        <span class="media-type">${item.type || 'Media'}</span>
        <h3>${item.title || 'Utan titel'}</h3>
        ${item.creator ? `<p class="media-creator">Av: ${item.creator}</p>` : ''}
        ${item.review ? `<p class="media-review">${item.review}</p>` : ''}
        ${item.link ? `<a href="${item.link}" target="_blank" class="media-link">Öppna / Se här ↗</a>` : ''}
      </div>
    `;
  });

  mediaContainer.innerHTML = mediaHTML || '<p>Ingen media hittades i denna kategori.</p>';
}

// Mappar olika "TYP AV MEDIA"-värden från CMS:et till filterkategorierna.
// Lägg till fler synonymer här om du lägger till nya typer i admin-panelen.
const KATEGORI_SYNONYMER = {
  bok: ['bok', 'böcker', 'book'],
  podd: ['podd', 'poddar', 'podcast'],
  film: ['film', 'youtube', 'video', 'vimeo', 'netflix', 'serie', 'tv']
};

function filtreraMedia(event, kategori) {
  const knappar = document.querySelectorAll('.filter-btn');
  knappar.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  if (kategori === 'alla') {
    visaMedia(allMediaData);
  } else {
    const synonymer = KATEGORI_SYNONYMER[kategori] || [kategori];
    const filtrerad = allMediaData.filter(item => {
      const typ = (item.type || '').toLowerCase();
      return synonymer.some(s => typ.includes(s));
    });
    visaMedia(filtrerad);
  }
}

document.addEventListener('DOMContentLoaded', laddaSidinnehall);
