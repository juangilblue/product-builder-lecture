const MODEL_URL = "https://teachablemachine.withgoogle.com/models/btiMd91SP/";

const CLASS_META = {
  "강아지": {
    emoji: "🐶",
    label: { ko: "강아지상", en: "Dog Face" },
    description: { ko: "다정하고 친근한 강아지상이에요!", en: "A warm and friendly dog-face vibe!" },
  },
  "고양이": {
    emoji: "🐱",
    label: { ko: "고양이상", en: "Cat Face" },
    description: { ko: "도도하고 매력적인 고양이상이에요!", en: "A chic and captivating cat-face vibe!" },
  },
  "dog": {
    emoji: "🐶",
    label: { ko: "강아지상", en: "Dog Face" },
    description: { ko: "다정하고 친근한 강아지상이에요!", en: "A warm and friendly dog-face vibe!" },
  },
  "cat": {
    emoji: "🐱",
    label: { ko: "고양이상", en: "Cat Face" },
    description: { ko: "도도하고 매력적인 고양이상이에요!", en: "A chic and captivating cat-face vibe!" },
  },
};

const TEXT = {
  loadFail: { ko: "모델을 불러오지 못했어요. 새로고침해주세요.", en: "Failed to load the model. Please refresh." },
  webcamStart: { ko: "웹캠 시작", en: "Start Webcam" },
  webcamStop: { ko: "웹캠 종료", en: "Stop Webcam" },
  webcamError: { ko: "웹캠을 사용할 수 없어요. 브라우저 권한을 확인해주세요.", en: "Cannot access the webcam. Please check browser permissions." },
};

let model = null;
let webcam = null;
let webcamLoopId = null;
let lastPredictions = null;

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

function lang() {
  return (window.getCurrentLang && window.getCurrentLang()) || "ko";
}

if (loadingEl) init();

async function init() {
  await loadModel();
  bindEvents();
  document.addEventListener("langchange", () => {
    if (lastPredictions) showResult(lastPredictions);
    if (webcam) {
      webcamToggleBtn.textContent = TEXT.webcamStop[lang()];
    } else {
      webcamToggleBtn.textContent = TEXT.webcamStart[lang()];
    }
  });
}

async function loadModel() {
  try {
    model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
    loadingEl.classList.add("hidden");
    mainContentEl.classList.remove("hidden");
  } catch (err) {
    loadingEl.textContent = TEXT.loadFail[lang()];
    console.error(err);
  }
}

function bindEvents() {
  uploadModeBtn.addEventListener("click", () => switchMode("upload"));
  webcamModeBtn.addEventListener("click", () => switchMode("webcam"));

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

  webcamToggleBtn.addEventListener("click", async () => {
    if (webcam) {
      stopWebcam();
      webcamToggleBtn.textContent = TEXT.webcamStart[lang()];
    } else {
      await startWebcam();
      webcamToggleBtn.textContent = TEXT.webcamStop[lang()];
    }
  });
}

function switchMode(mode) {
  if (mode === "upload") {
    uploadModeBtn.classList.add("active");
    webcamModeBtn.classList.remove("active");
    uploadSection.classList.remove("hidden");
    webcamSection.classList.add("hidden");
    stopWebcam();
    webcamToggleBtn.textContent = TEXT.webcamStart[lang()];
  } else {
    webcamModeBtn.classList.add("active");
    uploadModeBtn.classList.remove("active");
    webcamSection.classList.remove("hidden");
    uploadSection.classList.add("hidden");
  }
  resultSection.classList.add("hidden");
  lastPredictions = null;
}

function handleImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.classList.remove("hidden");
    const placeholder = uploadArea.querySelector(".upload-placeholder");
    if (placeholder) placeholder.classList.add("hidden");
    previewImg.onload = () => predictImage(previewImg);
  };
  reader.readAsDataURL(file);
}

async function predictImage(imgEl) {
  if (!model) return;
  const predictions = await model.predict(imgEl);
  showResult(predictions);
}

async function startWebcam() {
  try {
    webcam = new tmImage.Webcam(280, 280, true);
    await webcam.setup();
    await webcam.play();
    webcamContainer.innerHTML = "";
    webcamContainer.appendChild(webcam.canvas);
    webcamLoop();
  } catch (err) {
    alert(TEXT.webcamError[lang()]);
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

function showResult(predictions) {
  lastPredictions = predictions;
  const L = lang();
  resultSection.classList.remove("hidden");
  predictions.sort((a, b) => b.probability - a.probability);
  const top = predictions[0];
  const meta = CLASS_META[top.className] || {
    emoji: "✨",
    label: { ko: top.className, en: top.className },
    description: { ko: "", en: "" },
  };
  verdictEl.innerHTML =
    `${meta.emoji} ${meta.label[L]} ${meta.emoji}<br>` +
    `<span class="verdict-desc">${meta.description[L]}</span>`;

  resultBarsEl.innerHTML = "";
  predictions.forEach((p) => {
    const m = CLASS_META[p.className] || { emoji: "", label: { ko: p.className, en: p.className } };
    const pct = (p.probability * 100).toFixed(1);
    const bar = document.createElement("div");
    bar.className = "result-bar";
    bar.innerHTML = `
      <div class="result-bar-label">
        <span>${m.emoji} ${m.label[L]}</span>
        <span class="result-bar-pct">${pct}%</span>
      </div>
      <div class="result-bar-track">
        <div class="result-bar-fill" style="width: ${pct}%"></div>
      </div>
    `;
    resultBarsEl.appendChild(bar);
  });
}
