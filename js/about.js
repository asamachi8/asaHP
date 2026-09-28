/* ============================================================================
   幻想肖像画美術館 ポートフォリオ　自己紹介ページ用スクリプト
   肖像プロフィールの切替（声の活動 ⇔ 美術館ガイド）と VOICE SAMPLE を扱います。
   ============================================================================ */

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG;
  if (!cfg) return;

  document.title = "ABOUT｜" + cfg.museumName;

  // ==========================================================
  // 肖像プロフィールの切替
  // ==========================================================
  var profileKeys = ["voice", "guide"];
  var currentProfileIndex = 0;

  var portraitFrame = document.getElementById("portraitFrame");
  var portraitImage = document.getElementById("portraitImage");
  var profileName = document.getElementById("profileName");
  var profileTitle = document.getElementById("profileTitle");
  var profileBio = document.getElementById("profileBio");
  var voiceSection = document.getElementById("voiceSection");
  var attachmentSection = document.getElementById("attachmentGallery");

  // 額縁と自己紹介の並び（data/config.js の about.layout）
  var aboutCard = document.getElementById("aboutCard");
  var layout = (cfg.about && cfg.about.layout) || "vertical";
  if (aboutCard) aboutCard.classList.add("layout-" + layout);

  function renderProfile(index) {
    var key = profileKeys[index];
    var p = cfg.profiles && cfg.profiles[key];
    if (!p || !portraitImage) return;
    portraitImage.src = p.image;
    portraitImage.alt = p.displayName + "の肖像画";
    if (profileName) profileName.textContent = p.displayName;
    if (profileTitle) profileTitle.textContent = p.title;
    if (profileBio) profileBio.textContent = p.bio;

    // 声の活動の姿 → VOICE SAMPLE、美術館ガイドの姿 → 創作イラストなどの添付物
    // （中身が1件もない枠は出さない）
    var isVoice = key === "voice";
    var hasVoice = voiceSection && voiceSection.querySelectorAll(".voice-sample-item").length > 0;
    var hasWorks = attachmentSection && attachmentSection.querySelectorAll(".attachment-item").length > 0;
    if (voiceSection) voiceSection.hidden = !(isVoice && hasVoice);
    if (attachmentSection) attachmentSection.hidden = !(!isVoice && hasWorks);
  }

  if (portraitFrame) {
    renderProfile(currentProfileIndex);

    portraitFrame.setAttribute("role", "button");
    portraitFrame.setAttribute("tabindex", "0");
    portraitFrame.setAttribute("aria-label", "肖像画をクリックすると姿が切り替わります");

    function togglePortrait() {
      currentProfileIndex = (currentProfileIndex + 1) % profileKeys.length;
      renderProfile(currentProfileIndex);
    }

    portraitFrame.addEventListener("click", togglePortrait);
    portraitFrame.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        togglePortrait();
      }
    });
  }

  // ==========================================================
  // VOICE SAMPLE（クリックした時点まで音声/動画を読み込まない）
  // ==========================================================
  var voicePanel = document.getElementById("voiceSamplePanel");
  if (voicePanel) {
    var samples = (cfg.voiceSamples || []).filter(function (s) { return s.published; });

    samples.forEach(function (sample) {
      var item = document.createElement("div");
      item.className = "voice-sample-item";

      var row = document.createElement("div");
      row.className = "voice-sample-row";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "voice-sample-play";
      btn.setAttribute("aria-label", sample.title + "を再生");
      btn.textContent = "▶";

      var label = document.createElement("span");
      label.className = "voice-sample-title";
      label.textContent = sample.title;

      row.appendChild(btn);
      row.appendChild(label);
      item.appendChild(row);
      voicePanel.appendChild(item);

      var loaded = false;
      btn.addEventListener("click", function () {
        if (loaded) return;
        loaded = true;

        if (sample.mediaType === "video") {
          var video = document.createElement("video");
          video.controls = true;
          video.src = sample.src;
          video.setAttribute("playsinline", "");
          item.appendChild(video);
          video.play().catch(function () {});
        } else {
          var audio = document.createElement("audio");
          audio.controls = true;
          audio.src = sample.src;
          audio.autoplay = true;
          item.appendChild(audio);
        }

        btn.disabled = true;
        btn.style.opacity = "0.4";
      });
    });
  }

  // ==========================================================
  // 追加添付物（創作イラストなど、最大8件）
  // ==========================================================
  var MAX_ATTACHMENTS = 8;
  var gallery = document.getElementById("attachmentGallery");
  var works = [];

  if (gallery) {
    works = (cfg.attachments || [])
      .filter(function (w) { return w.published && w.image; })
      .slice(0, MAX_ATTACHMENTS);

    works.forEach(function (work, index) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "attachment-item";
      el.setAttribute("aria-label", (work.title || "作品") + "を大きく見る");

      var img = document.createElement("img");
      img.src = work.image;
      img.alt = work.title || "";
      img.loading = "lazy";
      img.decoding = "async";
      el.appendChild(img);

      el.addEventListener("click", function () { openLightbox(index); });
      gallery.appendChild(el);
    });
  }

  // ==========================================================
  // 添付物の拡大表示（細部まで見るためのライトボックス）
  // ==========================================================
  var lightbox = document.getElementById("lightbox");
  var lbPanel = lightbox && lightbox.querySelector(".lightbox-panel");
  var lbStage = document.getElementById("lightboxStage");
  var lbImage = document.getElementById("lightboxImage");
  var lbTitle = document.getElementById("lightboxTitle");
  var lbLink = document.getElementById("lightboxLink");
  var lbZoom = document.getElementById("lightboxZoom");
  var lbPrev = document.getElementById("lightboxPrev");
  var lbNext = document.getElementById("lightboxNext");
  var lbClose = document.getElementById("lightboxClose");

  var lbIndex = 0;
  var lastFocused = null;

  function setZoom(on) {
    if (!lbPanel) return;
    lbPanel.classList.toggle("is-zoomed", !!on);
    if (lbZoom) lbZoom.textContent = on ? "拡大をもどす" : "もっと拡大";
    if (!on && lbStage) { lbStage.scrollLeft = 0; lbStage.scrollTop = 0; }
  }

  function showWork(index) {
    var work = works[index];
    if (!work) return;
    lbIndex = index;

    setZoom(false);
    lbImage.src = work.image;
    lbImage.alt = work.title || "";
    lbTitle.textContent = work.title || "";

    if (work.url) {
      lbLink.href = work.url;
      lbLink.hidden = false;
    } else {
      lbLink.removeAttribute("href");
      lbLink.hidden = true;
    }

    var many = works.length > 1;
    lbPrev.hidden = !many;
    lbNext.hidden = !many;
  }

  function openLightbox(index) {
    if (!lightbox) return;
    lastFocused = document.activeElement;
    showWork(index);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    setZoom(false);
    lbImage.removeAttribute("src");
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function step(delta) {
    if (works.length < 2) return;
    showWork((lbIndex + delta + works.length) % works.length);
  }

  if (lightbox) {
    lbClose.addEventListener("click", closeLightbox);
    lightbox.querySelector("[data-lightbox-close]").addEventListener("click", closeLightbox);
    lbPrev.addEventListener("click", function () { step(-1); });
    lbNext.addEventListener("click", function () { step(1); });
    lbZoom.addEventListener("click", function () {
      setZoom(!lbPanel.classList.contains("is-zoomed"));
    });
    lbImage.addEventListener("click", function () {
      setZoom(!lbPanel.classList.contains("is-zoomed"));
    });

    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); closeLightbox(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    });

    // 拡大中はマウスのドラッグでも画像を動かせるようにする
    var dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;

    lbStage.addEventListener("pointerdown", function (e) {
      if (!lbPanel.classList.contains("is-zoomed") || e.pointerType === "touch") return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      startLeft = lbStage.scrollLeft; startTop = lbStage.scrollTop;
      lbStage.classList.add("is-dragging");
      lbStage.setPointerCapture(e.pointerId);
    });

    lbStage.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      e.preventDefault();
      lbStage.scrollLeft = startLeft - (e.clientX - startX);
      lbStage.scrollTop = startTop - (e.clientY - startY);
    });

    ["pointerup", "pointercancel"].forEach(function (type) {
      lbStage.addEventListener(type, function () {
        dragging = false;
        lbStage.classList.remove("is-dragging");
      });
    });
  }

  // 両方の枠を作り終えたので、いまの姿に合わせて表示を切り替える
  renderProfile(currentProfileIndex);
})();
