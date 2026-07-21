function skiftaTema() {
    document.body.classList.toggle("dark-mode");
}

function laggTillHalsning(event) {
    event.preventDefault();

    const input = document.getElementById("guest-input");
    const container = document.getElementById("notes-container");

    if (input.value.trim() !== "") {
        const newNote = document.createElement("div");
        newNote.className = "note";
        newNote.textContent = input.value;

        container.prepend(newNote);
        input.value = "";
    }
}

async function laddaSidinnehall() {
  // 1. Hämta texten för startsidan
  try {
    const res = await fetch('/content/index.json');
    if (res.ok) {
      const data = await res.json();
      if (data.title) document.querySelector('.hero-scrapbook h1').textContent = data.title;
      if (data.subtitle) document.querySelector('.hero-subtext').textContent = data.subtitle;
      if (data.intro) document.querySelector('.handwritten-intro').textContent = data.intro;
    }
  } catch (err) {
    console.log("Kunde inte ladda statisk text.");
  }

  // 2. Kör både Projekt och Media
  laddaProjekt();
  laddaMedia(); // <-- HÄR! Denna saknades tidigare
}

async function laddaProjekt() {
  const gridContainer = document.querySelector('.portfolio-grid');
  if (!gridContainer) return;

  // Lägg till dina projektfiler från content/projects/ här
  const projectFiles = ['.gitkeep']; // Byts ut mot riktiga filer efter hand

  try {
    let projectsHTML = '';
    for (const fileName of projectFiles) {
      if (fileName.endsWith('.gitkeep')) continue;
      const res = await fetch(`/content/projects/${fileName}`);
      if (res.ok) {
        const p = await res.json();
        projectsHTML += `
          <article class="project-item">
              <div class="project-img-wrapper">
                  <img src="${p.image || 'https://picsum.photos/700/500'}" alt="${p.title}">
              </div>
              <div class="project-meta">
                  <h3>${p.title}</h3>
                  <span>${p.year || p.category}</span>
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

async function laddaMedia() {
  const mediaContainer = document.querySelector('#media-grid');
  if (!mediaContainer) return;

  // ⚠️ OBS! Ändra namnet nedan till vad filen heter i mappen content/media/ på GitHub!
  // Exempel: Om du sparade ett inlägg i Decap CMS skapades t.ex. 'min-youtube-video.json'
  const mediaFiles = ['min-video.json']; 

  let mediaHTML = '';

  for (const fileName of mediaFiles) {
    try {
      const itemRes = await fetch(`/content/media/${fileName}`);
      if (itemRes.ok) {
        const item = await itemRes.json();
        mediaHTML += `
          <div class="media-card">
            <span class="media-type">${item.type || 'Media'}</span>
            <h3>${item.title}</h3>
            ${item.creator ? `<p class="media-creator">Av: ${item.creator}</p>` : ''}
            ${item.review ? `<p class="media-review">${item.review}</p>` : ''}
            ${item.link ? `<a href="${item.link}" target="_blank" class="media-link">Öppna / Se här ↗</a>` : ''}
          </div>
        `;
      }
    } catch (e) {
      console.log("Kunde inte ladda mediafilen:", fileName);
    }
  }

  if (mediaHTML !== '') {
    mediaContainer.innerHTML = mediaHTML;
  }
}

document.addEventListener('DOMContentLoaded', laddaSidinnehall);
