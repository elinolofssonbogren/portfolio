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

  // 2. Hämta dynamiska projekt
  laddaProjekt();
}

async function laddaProjekt() {
  const gridContainer = document.querySelector('.portfolio-grid');
  if (!gridContainer) return;

  try {
    // Hämta listan över sparade projekt (via Decap CMS struktur eller API)
    // OBS: För enkelhets skull läser vi in dina skapade JSON-filer i content/projects/
    // Du kan lägga till dina projektfiler i en lista nedan när du skapat dem
    
    // Ett smidigt sätt när du skapar projekt i CMS är att ersätta gridens innehåll
    // om du skapar en index-fil för alla projekt.
  } catch (err) {
    console.log("Använder standardprojekt.");
  }
}

document.addEventListener('DOMContentLoaded', laddaSidinnehall);

async function laddaMedia() {
  const mediaContainer = document.querySelector('#media-grid');
  if (!mediaContainer) return;

  try {
    // Om du skapat t.ex. ett inlägg som döpts efter titeln i Decap CMS,
    // ersätter du filnamnet nedan med vad filen heter i content/media/ på GitHub.
    // Tips: Du kan lägga till fler filnamn i listan efter hand!
    const res = await fetch('/content/media/'); 
    
    // Om du vill testa direkt med en specificerad fil:
    // Ange exakta namnet på JSON-filen som skapades under content/media/
    const mediaFiles = ['min-video.json']; // <-- ÄNDRA HÄR till ditt filnamn

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
  } catch (err) {
    console.log("Kunde inte ladda media-sektionen.");
  }
}
