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
// Hämta texten från content/index.json och uppdatera sidan
async function laddaSidinnehall() {
  try {
    const response = await fetch('/content/index.json');
    if (response.ok) {
      const data = await response.json();

      // Uppdatera elementen på sidan om de finns i JSON-filen
      if (data.title) {
        document.querySelector('.hero-scrapbook h1').textContent = data.title;
      }
      if (data.subtitle) {
        document.querySelector('.hero-subtext').textContent = data.subtitle;
      }
      if (data.intro) {
        document.querySelector('.handwritten-intro').textContent = data.intro;
      }
    }
  } catch (error) {
    console.log("Kunde inte ladda dynamiskt innehåll, använder standardtext.");
  }
}

// Kör funktionen när sidan laddats
document.addEventListener('DOMContentLoaded', laddaSidinnehall);
