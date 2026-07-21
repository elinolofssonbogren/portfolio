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

  // 2. Ladda projekt och media automatiskt
  laddaProjekt();
  laddaMedia();
}

async function laddaProjekt() {
  const gridContainer = document.querySelector('.portfolio-grid');
  if (!gridContainer) return;

  try {
    // Ändra länken nedan till din GitHub användare och repo om du vill att även projekt laddas helt automatiskt
    const res = await fetch('https://api.github.com/repos/elinolofssonbogren/portfolio/contents/content/projects');
    if (!res.ok) return;

    const files = await res.json();
    let projectsHTML = '';

    for (const file of files) {
      if (file.name === '.gitkeep' || !file.name.endsWith('.json')) continue;

      const itemRes = await fetch(`/content/projects/${file.name}`);
      if (itemRes.ok) {
        const p = await itemRes.json();
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

  try {
    // ⚠️ ÄNDRA DITT_GITHUB_ANVÄNDARNAMN OCH DITT_REPO_NAMN NEDAN!
    const res = await fetch('https://api.github.com/repos/elinolofssonbogren/portfolio/contents/content/media');
    
    if (!res.ok) {
      console.log("Kunde inte hämta medialistan automatiskt.");
      return;
    }

    const files = await res.json();
    let mediaHTML = '';

    // Loopar igenom alla filer i content/media automatiskt
    for (const file of files) {
      if (file.name === '.gitkeep' || !file.name.endsWith('.json')) continue;

      const itemRes = await fetch(`/content/media/${file.name}`);
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
    }

    if (mediaHTML !== '') {
      mediaContainer.innerHTML = mediaHTML;
    }
  } catch (err) {
    console.log("Fel vid automatisk inläsning av media:", err);
  }
}

document.addEventListener('DOMContentLoaded', laddaSidinnehall);
