// IndexedDB setup
let db;
const request = indexedDB.open("JournalApp", 1);

request.onupgradeneeded = (e) => {
  db = e.target.result;
  const journalStore = db.createObjectStore("pages", { keyPath: "id" });
  journalStore.createIndex("title", "title", { unique: false });
};

request.onsuccess = (e) => {
  db = e.target.result;
  loadPage(currentPage);
};

request.onerror = (e) => {
  console.error("IndexedDB error:", e.target.errorCode);
};

// Variables de navigation
let currentPage = 1;
let startX = 0;
let endX = 0;

// Sélection des éléments DOM
const journalContainer = document.querySelector(".journal-container");
const chapterTitleInput = document.getElementById("chapter-title");
const pageContentInput = document.getElementById("page-content");

// Sauvegarder une page dans IndexedDB
const savePage = () => {
  const transaction = db.transaction(["pages"], "readwrite");
  const store = transaction.objectStore("pages");

  const pageData = {
    id: currentPage,
    title: chapterTitleInput.value,
    content: pageContentInput.value,
  };

  store.put(pageData);
};

// Charger une page
const loadPage = (pageNum) => {
  const transaction = db.transaction(["pages"], "readonly");
  const store = transaction.objectStore("pages");
  const request = store.get(pageNum);

  request.onsuccess = () => {
    const data = request.result;

    if (data) {
      chapterTitleInput.value = data.title;
      pageContentInput.value = data.content;
    } else {
      // Si aucune donnée, afficher une page vide
      chapterTitleInput.value = "";
      pageContentInput.value = "";
    }
  };
};

// Mise à jour des classes des pages
const updatePages = () => {
  const pages = document.querySelectorAll(".page");
  pages.forEach((page, index) => {
    if (index === currentPage - 1) {
      page.className = "page active";
    } else if (index === currentPage - 2) {
      page.className = "page previous";
    } else if (index === currentPage) {
      page.className = "page next";
    } else {
      page.className = "page";
    }
  });
};

// Création d'une page si elle n'existe pas
const ensurePageExists = (pageNum) => {
  const pages = document.querySelectorAll(".page");
  if (pageNum > pages.length) {
    const newPage = document.createElement("div");
    newPage.className = "page next"; // Par défaut en "next"
    newPage.innerHTML = `
      <div class="chapter-name">
        <input type="text" id="chapter-title" placeholder="Titre du chapitre">
      </div>
      <textarea id="page-content" placeholder="Écris ton texte ici..."></textarea>
    `;
    journalContainer.appendChild(newPage);
  }
};

// Gérer le swipe pour tourner la page
journalContainer.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

journalContainer.addEventListener("touchmove", (e) => {
  endX = e.touches[0].clientX;
});

journalContainer.addEventListener("touchend", () => {
  const diffX = startX - endX;

  if (diffX > 50) {
    // Swipe vers la gauche
    savePage();
    currentPage++;
    ensurePageExists(currentPage);
    updatePages();
    setTimeout(() => loadPage(currentPage), 500);
  } else if (diffX < -50) {
    // Swipe vers la droite
    savePage();
    currentPage = Math.max(1, currentPage - 1);
    updatePages();
    setTimeout(() => loadPage(currentPage), 500);
  }
});

// Initialisation
window.onload = () => {
  ensurePageExists(currentPage);
  updatePages();
  loadPage(currentPage);
};
