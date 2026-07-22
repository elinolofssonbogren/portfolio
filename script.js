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
   ANSLAGSTAVLA (LOCALSTORAGE)
   ========================================== */
function laggTillHalsning(event) {
  event.preventDefault();

  const input = document.getElementById("guest-input");
  if (input.value.trim() !== "") {
    const txt = input.value.trim();

    skapaNoteElement(txt);

    const sparade = JSON.parse(localStorage.getItem("guestbook")) || [];
    sparade.unshift(txt);
    localStorage.setItem("guestbook", JSON.stringify(sparade));

    input.value = "";
  }
}

function skapaNoteElement(text) {
  const container = document.getElementById("notes-container");
  if (!container) return;
  const newNote = document.createElement("div");
  newNote.className = "note";
  newNote.textContent = text;
  container.prepend(newNote);
}

function laddaGuestbook() {
  const sparade = JSON.parse(localStorage.getItem("guestbook")) || ["Välkommen till mitt digitala arkiv!"];
  sparade.reverse().forEach(text => skapaNoteElement(text));
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
