(function () {
  const root = document.querySelector("[data-hf-wall]");
  if (!root) return;

  const chipRow = root.querySelector("[data-hf-wall-chips]");
  const grid = root.querySelector("[data-hf-wall-grid]");
  const wordInput = root.querySelector("[data-hf-wall-word]");
  const nameInput = root.querySelector("[data-hf-wall-name]");
  const countEl = root.querySelector("[data-hf-wall-count]");
  const form = root.querySelector("[data-hf-wall-form]");

  if (!chipRow || !grid || !wordInput || !nameInput || !countEl || !form) return;

  const words = ["Curiosity", "Courage", "Kindness", "Empathy", "Wonder", "Imagination", "Hope", "Forgiveness"];
  const seed = [
    ["Curiosity", "Aarav"],
    ["Kindness", "Meera"],
    ["Courage", "Dev"],
    ["Wonder", "Sana"],
    ["Imagination", "Kabir"],
    ["Empathy", "Riya"],
  ];

  let count = seed.length;

  function paint(word, name) {
    const note = document.createElement("div");
    note.className = "hf-wall-note";
    note.style.setProperty("--hf-wall-r", `${(Math.random() * 5 - 2.5).toFixed(1)}deg`);

    const wordEl = document.createElement("div");
    wordEl.className = "hf-wall-note-word";
    wordEl.textContent = word;

    const nameEl = document.createElement("div");
    nameEl.className = "hf-wall-note-name";
    nameEl.textContent = `— ${name || "Anonymous"}`;

    note.append(wordEl, nameEl);
    grid.prepend(note);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => note.classList.add("is-show"));
    });
  }

  function addNote() {
    const word = wordInput.value.trim();
    if (!word) {
      wordInput.focus();
      return;
    }

    paint(word, nameInput.value.trim());
    count += 1;
    countEl.textContent = String(count);
    wordInput.value = "";
    nameInput.value = "";
    wordInput.focus();
  }

  words.forEach((word) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "hf-wall-chip";
    chip.textContent = word;
    chip.addEventListener("click", () => {
      wordInput.value = word;
      nameInput.focus();
    });
    chipRow.appendChild(chip);
  });

  seed.forEach(([word, name]) => paint(word, name));
  grid.querySelectorAll(".hf-wall-note").forEach((note) => note.classList.add("is-show"));
  countEl.textContent = String(count);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addNote();
  });

  wordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addNote();
    }
  });

  nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addNote();
    }
  });
})();
