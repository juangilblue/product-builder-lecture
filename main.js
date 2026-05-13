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
  webcamStart: { ko: "카메라 시작", en: "Start Camera" },
  webcamStop: { ko: "카메라 종료", en: "Stop Camera" },
  webcamError: { ko: "카메라를 사용할 수 없어요. 브라우저 권한을 확인해주세요.", en: "Cannot access the camera. Please check browser permissions." },
  shareTitle: { ko: "동물상 테스트", en: "Animal Face Test" },
  shareDog: { ko: "강아지상", en: "Dog Face" },
  shareCat: { ko: "고양이상", en: "Cat Face" },
  shareTextKo: (label, pct) => `🐶🐱 내 동물상은 ${label}! (${pct}%)\n나도 테스트해보기 👇`,
  shareTextEn: (label, pct) => `🐶🐱 My animal face is ${label}! (${pct}%)\nTry it yourself 👇`,
  copied: { ko: "링크가 복사되었어요!", en: "Link copied!" },
  copyFail: { ko: "복사에 실패했어요.", en: "Failed to copy." },
  saved: { ko: "이미지를 저장했어요!", en: "Image saved!" },
};

const SHARE_URL = "https://juangilblue.github.io/product-builder-lecture/";

let model = null;
let webcam = null;
let webcamLoopId = null;
let lastPredictions = null;
let lastPhotoSource = null;

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
const webcamCaptureBtn = document.getElementById("webcam-capture-btn");
const webcamRetakeBtn = document.getElementById("webcam-retake-btn");
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
      setWebcamUI(webcamLoopId ? "live" : "captured");
    } else {
      setWebcamUI("idle");
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
      setWebcamUI("idle");
    } else {
      await startWebcam();
      setWebcamUI("live");
    }
  });

  webcamCaptureBtn.addEventListener("click", () => {
    captureAndPredict();
  });

  webcamRetakeBtn.addEventListener("click", () => {
    resumeWebcamPreview();
  });

  document.querySelectorAll("[data-share]").forEach((btn) => {
    btn.addEventListener("click", () => handleShare(btn.dataset.share));
  });
}

function setWebcamUI(state) {
  const L = lang();
  if (state === "idle") {
    webcamToggleBtn.classList.remove("hidden");
    webcamToggleBtn.textContent = TEXT.webcamStart[L];
    webcamCaptureBtn.classList.add("hidden");
    webcamRetakeBtn.classList.add("hidden");
  } else if (state === "live") {
    webcamToggleBtn.classList.remove("hidden");
    webcamToggleBtn.textContent = TEXT.webcamStop[L];
    webcamCaptureBtn.classList.remove("hidden");
    webcamRetakeBtn.classList.add("hidden");
  } else if (state === "captured") {
    webcamToggleBtn.classList.remove("hidden");
    webcamToggleBtn.textContent = TEXT.webcamStop[L];
    webcamCaptureBtn.classList.add("hidden");
    webcamRetakeBtn.classList.remove("hidden");
  }
}

function switchMode(mode) {
  if (mode === "upload") {
    uploadModeBtn.classList.add("active");
    webcamModeBtn.classList.remove("active");
    uploadSection.classList.remove("hidden");
    webcamSection.classList.add("hidden");
    stopWebcam();
    setWebcamUI("idle");
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
  lastPhotoSource = imgEl;
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
    resultSection.classList.add("hidden");
    lastPredictions = null;
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

function webcamLoop() {
  if (!webcam) return;
  webcam.update();
  webcamLoopId = requestAnimationFrame(webcamLoop);
}

async function captureAndPredict() {
  if (!webcam || !model) return;
  if (webcamLoopId) {
    cancelAnimationFrame(webcamLoopId);
    webcamLoopId = null;
  }
  webcam.update();
  const snapshot = document.createElement("canvas");
  snapshot.width = webcam.canvas.width;
  snapshot.height = webcam.canvas.height;
  snapshot.getContext("2d").drawImage(webcam.canvas, 0, 0);
  const predictions = await model.predict(snapshot);
  lastPhotoSource = snapshot;
  showResult(predictions);
  setWebcamUI("captured");
}

function resumeWebcamPreview() {
  if (!webcam) return;
  resultSection.classList.add("hidden");
  lastPredictions = null;
  if (!webcamLoopId) webcamLoop();
  setWebcamUI("live");
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

function buildShareText() {
  if (!lastPredictions || !lastPredictions.length) return "";
  const L = lang();
  const sorted = [...lastPredictions].sort((a, b) => b.probability - a.probability);
  const top = sorted[0];
  const meta = CLASS_META[top.className] || { label: { ko: top.className, en: top.className } };
  const pct = (top.probability * 100).toFixed(0);
  const label = meta.label[L];
  return L === "ko" ? TEXT.shareTextKo(label, pct) : TEXT.shareTextEn(label, pct);
}

function showToast(message) {
  const toast = document.getElementById("share-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add("hidden"), 2200);
}

async function handleShare(kind) {
  if (!lastPredictions) return;
  if (kind === "native") return shareNative();
  if (kind === "twitter") return shareTwitter();
  if (kind === "facebook") return shareFacebook();
  if (kind === "copy") return copyShareLink();
  if (kind === "save") return saveResultImage();
}

async function shareNative() {
  const text = buildShareText();
  const title = TEXT.shareTitle[lang()];
  if (navigator.share) {
    try {
      const canvas = renderResultCard();
      if (canvas && navigator.canShare) {
        const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
        if (blob) {
          const file = new File([blob], "animal-face-result.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title, text, url: SHARE_URL, files: [file] });
            return;
          }
        }
      }
      await navigator.share({ title, text, url: SHARE_URL });
    } catch (err) {
      if (err && err.name !== "AbortError") console.error(err);
    }
  } else {
    copyShareLink();
  }
}

function shareTwitter() {
  const text = encodeURIComponent(buildShareText());
  const url = encodeURIComponent(SHARE_URL);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "noopener,noreferrer");
}

function shareFacebook() {
  const url = encodeURIComponent(SHARE_URL);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer");
}

async function copyShareLink() {
  const text = `${buildShareText()}\n${SHARE_URL}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast(TEXT.copied[lang()]);
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast(TEXT.copied[lang()]);
    } catch {
      showToast(TEXT.copyFail[lang()]);
    }
  }
}

function saveResultImage() {
  const canvas = renderResultCard();
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = "animal-face-result.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast(TEXT.saved[lang()]);
}

function renderResultCard() {
  if (!lastPredictions || !lastPredictions.length) return null;
  const L = lang();
  const W = 720;
  const H = 900;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#fff7f0");
  grad.addColorStop(1, "#f0f5ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#2d2d2d";
  ctx.font = "bold 34px -apple-system, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(L === "ko" ? "🐶 동물상 테스트 결과 🐱" : "🐶 Animal Face Test 🐱", W / 2, 60);

  const photoSize = 320;
  const photoX = (W - photoSize) / 2;
  const photoY = 100;
  ctx.save();
  ctx.beginPath();
  const r = 24;
  ctx.moveTo(photoX + r, photoY);
  ctx.arcTo(photoX + photoSize, photoY, photoX + photoSize, photoY + photoSize, r);
  ctx.arcTo(photoX + photoSize, photoY + photoSize, photoX, photoY + photoSize, r);
  ctx.arcTo(photoX, photoY + photoSize, photoX, photoY, r);
  ctx.arcTo(photoX, photoY, photoX + photoSize, photoY, r);
  ctx.closePath();
  ctx.clip();
  if (lastPhotoSource) {
    try {
      ctx.drawImage(lastPhotoSource, photoX, photoY, photoSize, photoSize);
    } catch {
      ctx.fillStyle = "#ddd";
      ctx.fillRect(photoX, photoY, photoSize, photoSize);
    }
  } else {
    ctx.fillStyle = "#ddd";
    ctx.fillRect(photoX, photoY, photoSize, photoSize);
  }
  ctx.restore();

  const sorted = [...lastPredictions].sort((a, b) => b.probability - a.probability);
  const top = sorted[0];
  const topMeta = CLASS_META[top.className] || { emoji: "✨", label: { ko: top.className, en: top.className } };

  ctx.fillStyle = "#222";
  ctx.font = "bold 40px -apple-system, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${topMeta.emoji} ${topMeta.label[L]} ${topMeta.emoji}`, W / 2, 490);

  let y = 560;
  sorted.forEach((p) => {
    const m = CLASS_META[p.className] || { emoji: "", label: { ko: p.className, en: p.className } };
    const pct = (p.probability * 100).toFixed(1);
    ctx.font = "22px -apple-system, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#333";
    ctx.textAlign = "left";
    ctx.fillText(`${m.emoji} ${m.label[L]}`, 100, y);
    ctx.textAlign = "right";
    ctx.fillText(`${pct}%`, W - 100, y);

    const barX = 100;
    const barY = y + 14;
    const barW = W - 200;
    const barH = 18;
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(barX, barY, barW * p.probability, barH);
    y += 78;
  });

  ctx.font = "18px -apple-system, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#777";
  ctx.textAlign = "center";
  ctx.fillText(SHARE_URL.replace(/^https?:\/\//, ""), W / 2, H - 40);

  return canvas;
}
