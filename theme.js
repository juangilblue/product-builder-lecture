(function () {
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark-preload");
    document.addEventListener("DOMContentLoaded", () => {
      document.body.classList.add("dark-mode");
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  });
})();
