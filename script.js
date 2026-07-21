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

