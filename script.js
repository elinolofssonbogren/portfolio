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

  laddaProjekt();
  laddaMedia();
}

async function laddaProjekt() {
  const gridContainer = document.querySelector('.portfolio-grid');
  if (!gridContainer) return;

  try {
    const res = await fetch('https://api.github.com/repos/elinolofssonbogren/portfolio/contents/content/projects');
    if (!res.ok) return;

    const files = await res.json();
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

        projectsHTML += `
          <article class="project-item">
              <div class="project-img-wrapper">
                  <img src="${p.image || 'https://picsum.photos/700/500'}" alt="${p.title || 'Projekt'}">
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

async function laddaMedia() {
  const mediaContainer = document.querySelector('#media-grid');
  if (!mediaContainer) return;

  try {
    const res = await fetch('https://api.github.com/repos/elinolofssonbogren/portfolio/contents/content/media');
    
    if (!res.ok) {
      console.log("Kunde inte hämta medialistan automatiskt.");
      return;
    }

    const files = await res.json();
    let mediaHTML = '';

    for (const file of files) {
      if (file.name.startsWith('.')) continue;

      const itemRes = await fetch(`/content/media/${file.name}`);
      if (itemRes.ok) {
        let item = {};
        
        if (file.name.endsWith('.json')) {
          item = await itemRes.json();
        } else if (file.name.endsWith('.md')) {
          const rawText = await itemRes.text();
          
          const lines = rawText.split('\n');
          lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed === '---' || !trimmed) return;

            const colonIndex = trimmed.indexOf(':');
            if (colonIndex !== -1) {
              const key = trimmed.slice(0, colonIndex).trim();
              let val = trimmed.slice(colonIndex + 1).trim();
              val = val.replace(/^["']|["']$/g, '');
              item[key] = val;
            }
          });
        } else {
          continue;
        }

        const harGiltigBild = item.image && !item.image.includes('youtu');

        mediaHTML += `
          <div class="media-card">
            ${harGiltigBild ? `<div class="media-img-wrapper"><img src="${item.image}" alt="${item.title || 'Media'}"></div>` : ''}
            <span class="media-type">${item.type || 'Media'}</span>
            <h3>${item.title || 'Utan titel'}</h3>
            ${item.creator ? `<p class="media-creator">Av: ${item.creator}</p>` : ''}
            ${item.review ? `<p class="media-review">${item.review}</p>` : ''}
            ${item.link ? `<a href="${item.link}" target="_blank" class="media-link">Öppna / Se här ↗</a>` : ''}
          </div>
        `;
      }
    }

    if (mediaHTML !== '') {
      mediaContainer.innerHTML = mediaHTML;
    }
  } catch (err) {
    console.log("Fel vid automatisk inläsning av media:", err);
  }
}

document.addEventListener('DOMContentLoaded', laddaSidinnehall);
