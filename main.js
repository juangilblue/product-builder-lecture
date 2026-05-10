const MODEL_URL = "https://teachablemachine.withgoogle.com/models/btiMd91SP/";

const CLASS_META = {
  "강아지": { emoji: "🐶", label: "강아지상", description: "다정하고 친근한 강아지상이에요!" },
  "고양이": { emoji: "🐱", label: "고양이상", description: "도도하고 매력적인 고양이상이에요!" },
  "dog":   { emoji: "🐶", label: "강아지상", description: "다정하고 친근한 강아지상이에요!" },
  "cat":   { emoji: "🐱", label: "고양이상", description: "도도하고 매력적인 고양이상이에요!" },
};

let model = null;
let webcam = null;
let webcamLoopId = null;

const loadingEl = document.getElementById("loading");
const mainContentEl = document.getElementById("main-content");
const uploadModeBtn = document.getElementById("upload-mode-btn");
const webcamModeBtn = document.getElementById("webcam-mode-btn");
const uploadSection = document.getElementById("upload-section");
const webcamSection = document.getElementById("webcam-section");
const fileInput = document.getElementById("file-input");
const uploadArea = document.getElementById("upload-area");
const previewImg = document.getElementById("preview-img");
const webcamContainer = document.getElementById("webcam-container");
const webcamToggleBtn = document.getElementById("webcam-toggle-btn");
const resultSection = document.getElementById("result-section");
const verdictEl = document.getElementById("verdict");
const resultBarsEl = document.getElementById("result-bars");
const themeToggle = document.getElementById("theme-toggle");

// Theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
}
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
});

async function loadModel() {
  try {
    model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
    loadingEl.classList.add("hidden");
    mainContentEl.classList.remove("hidden");
  } catch (err) {
    loadingEl.textContent = "모델을 불러오지 못했어요. 새로고침해주세요.";
    console.error(err);
  }
}

// Mode switching
uploadModeBtn.addEventListener("click", () => switchMode("upload"));
webcamModeBtn.addEventListener("click", () => switchMode("webcam"));

function switchMode(mode) {
  if (mode === "upload") {
    uploadModeBtn.classList.add("active");
    webcamModeBtn.classList.remove("active");
    uploadSection.classList.remove("hidden");
    webcamSection.classList.add("hidden");
    stopWebcam();
  } else {
    webcamModeBtn.classList.add("active");
    uploadModeBtn.classList.remove("active");
    webcamSection.classList.remove("hidden");
    uploadSection.classList.add("hidden");
  }
  resultSection.classList.add("hidden");
}

// Upload handling
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleImageFile(file);
});

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});
uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("dragover"));
uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) handleImageFile(file);
});

function handleImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.classList.remove("hidden");
    uploadArea.querySelector(".upload-placeholder").classList.add("hidden");
    previewImg.onload = () => predictImage(previewImg);
  };
  reader.readAsDataURL(file);
}

async function predictImage(imgEl) {
  if (!model) return;
  const predictions = await model.predict(imgEl);
  showResult(predictions);
}

// Webcam handling
webcamToggleBtn.addEventListener("click", async () => {
  if (webcam) {
    stopWebcam();
    webcamToggleBtn.textContent = "웹캠 시작";
  } else {
    await startWebcam();
    webcamToggleBtn.textContent = "웹캠 종료";
  }
});

async function startWebcam() {
  try {
    webcam = new tmImage.Webcam(280, 280, true);
    await webcam.setup();
    await webcam.play();
    webcamContainer.innerHTML = "";
    webcamContainer.appendChild(webcam.canvas);
    webcamLoop();
  } catch (err) {
    alert("웹캠을 사용할 수 없어요. 권한을 확인해주세요.");
    console.error(err);
  }
}

function stopWebcam() {
  if (webcamLoopId) {
    cancelAnimationFrame(webcamLoopId);
    webcamLoopId = null;
  }
  if (webcam) {
    webcam.stop();
    webcam = null;
  }
  webcamContainer.innerHTML = "";
}

async function webcamLoop() {
  webcam.update();
  const predictions = await model.predict(webcam.canvas);
  showResult(predictions);
  webcamLoopId = requestAnimationFrame(webcamLoop);
}

// Result rendering
function showResult(predictions) {
  resultSection.classList.remove("hidden");
  predictions.sort((a, b) => b.probability - a.probability);
  const top = predictions[0];
  const meta = CLASS_META[top.className] || { emoji: "✨", label: top.className, description: "" };
  verdictEl.innerHTML = `${meta.emoji} ${meta.label} ${meta.emoji}<br><span class="verdict-desc">${meta.description}</span>`;

  resultBarsEl.innerHTML = "";
  predictions.forEach((p) => {
    const m = CLASS_META[p.className] || { emoji: "", label: p.className };
    const pct = (p.probability * 100).toFixed(1);
    const bar = document.createElement("div");
    bar.className = "result-bar";
    bar.innerHTML = `
      <div class="result-bar-label">
        <span>${m.emoji} ${m.label}</span>
        <span class="result-bar-pct">${pct}%</span>
      </div>
      <div class="result-bar-track">
        <div class="result-bar-fill" style="width: ${pct}%"></div>
      </div>
    `;
    resultBarsEl.appendChild(bar);
  });
}

loadModel();
