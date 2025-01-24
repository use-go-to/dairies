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

let currentPage = 1;
let isAnimating = false; // Flag pour empêcher de lancer plusieurs animations en même temps

const prevPageButton = document.getElementById("prev-page");
const nextPageButton = document.getElementById("next-page");
const chapterTitleInput = document.getElementById("chapter-title");
const pageContentInput = document.getElementById("page-content");
const journalPage = document.getElementById("journal-page");
const pageWrapper = document.querySelector(".page-wrapper");

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
      chapterTitleInput.value = "";
      pageContentInput.value = "";
    }
  };
};

const navigatePage = (direction) => {
  if (isAnimating) return; // Empêche de lancer une animation si l'animation est déjà en cours
  isAnimating = true;

  savePage();

  // Animation de la page qui se plie
  journalPage.style.transform = `rotateY(${direction * -180}deg)`; // Fait pivoter la page de 180°
  pageWrapper.style.transition = "transform 1s cubic-bezier(0.68, -0.55, 0.27, 1.55)";
  
  // Après l'animation, on met à jour la page et réinitialise la transformation de la page
  setTimeout(() => {
    currentPage = direction === 1 ? currentPage + 1 : Math.max(1, currentPage - 1);
    loadPage(currentPage);
    journalPage.style.transition = "none"; // Désactive la transition lors du retour à la position initiale
    journalPage.style.transform = "rotateY(0deg)";
    
    // Réactive la transition après avoir réinitialisé la transformation
    setTimeout(() => {
      journalPage.style.transition = "transform 1s cubic-bezier(0.68, -0.55, 0.27, 1.55)";
      isAnimating = false; // Réactive l'animation
    }, 50);
  }, 1000); // Durée de l'animation
};

prevPageButton.addEventListener("click", () => navigatePage(-1));
nextPageButton.addEventListener("click", () => navigatePage(1));

chapterTitleInput.addEventListener("input", savePage);
pageContentInput.addEventListener("input", savePage);
