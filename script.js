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