(function () {
  const SUPPORTED = ["ko", "en"];
  const stored = localStorage.getItem("lang");
  const initial = SUPPORTED.includes(stored) ? stored : "ko";

  document.documentElement.lang = initial;

  function applyLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = "ko";
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);

    // Update <title> from per-page meta tags if present
    const titleMeta = document.querySelector(`meta[name="title-${lang}"]`);
    if (titleMeta) document.title = titleMeta.getAttribute("content");

    // Update attributes (placeholder, aria-label, alt)
    document.querySelectorAll(`[data-${lang}-placeholder]`).forEach((el) => {
      el.setAttribute("placeholder", el.dataset[`${lang}Placeholder`]);
    });
    document.querySelectorAll(`[data-${lang}-aria-label]`).forEach((el) => {
      el.setAttribute("aria-label", el.dataset[`${lang}AriaLabel`]);
    });
    document.querySelectorAll(`[data-${lang}-alt]`).forEach((el) => {
      el.setAttribute("alt", el.dataset[`${lang}Alt`]);
    });

    // Toggle button visual state
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.langSet === lang);
    });

    // Notify other scripts (e.g., result rendering)
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyLang(initial);

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => applyLang(btn.dataset.langSet));
    });
  });

  window.getCurrentLang = function () {
    return document.documentElement.lang || "ko";
  };
})();
