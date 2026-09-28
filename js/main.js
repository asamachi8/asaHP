/* ============================================================================
   幻想肖像画美術館 ポートフォリオ　ホームページ（展示室の壁）用スクリプト
   data/config.js の SITE_CONFIG を読み込んで、DOMへ展開します。
   肖像・自己紹介・VOICE SAMPLEは about.html（自己紹介ページ）で扱います。
   ============================================================================ */

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG;
  if (!cfg) return;

  document.title = cfg.museumName + "｜Portfolio";

  // ==========================================================
  // タイトルロゴ（画像と大きさ）
  // ==========================================================
  var logoCfg = (cfg.home && cfg.home.logo) || {};
  if (logoCfg.image) {
    document.querySelectorAll('[data-role="site-logo"]').forEach(function (img) {
      img.src = logoCfg.image;
      img.alt = cfg.museumName;
    });
  }
  if (typeof logoCfg.widthMobile === "number") {
    document.documentElement.style.setProperty("--logo-w-mobile", String(logoCfg.widthMobile));
  }
  if (typeof logoCfg.widthPC === "number") {
    document.documentElement.style.setProperty("--logo-w-pc", String(logoCfg.widthPC));
  }

  // ロゴの下に添える一言
  var welcome = cfg.home && cfg.home.welcomeText;
  document.querySelectorAll('[data-role="welcome-text"]').forEach(function (el) {
    if (welcome) { el.textContent = welcome; } else { el.remove(); }
  });

  // ==========================================================
  // 中央の額縁：クリックすると自己紹介ページ（about.html）へ
  // 表示する肖像は「声の活動」側の画像を代表として使用
  // ==========================================================
  var portraitImage = document.getElementById("portraitImage");
  if (portraitImage && cfg.profiles && cfg.profiles.voice) {
    portraitImage.src = cfg.profiles.voice.image;
    portraitImage.alt = "";
  }

  // ==========================================================
  // 活動展示（最大6枠、published:false は自動非表示）
  // ==========================================================
  var MAX_EXHIBITS = 6;
  var gallery = document.getElementById("exhibitGallery");
  var exhibitList = document.getElementById("exhibitList");

  if (gallery) {
    var items = (cfg.exhibits || [])
      .filter(function (ex) { return ex.published; })
      .slice(0, MAX_EXHIBITS);

    items.forEach(function (ex) {
      // 額縁（背景画像に描かれた枠）の上に重ねるリンク。
      // 位置・大きさは data/layout.js（js/layout-apply.js が適用）で固定。
      var a = document.createElement("a");
      a.className = "slot";
      a.href = ex.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.setAttribute("aria-label", ex.name);

      if (ex.image) {
        var img = document.createElement("img");
        img.src = ex.image;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        a.appendChild(img);
      }

      var caption = document.createElement("span");
      caption.className = "slot-caption";
      caption.textContent = ex.name;
      caption.setAttribute("aria-hidden", "true");
      a.appendChild(caption);

      gallery.appendChild(a);

      // スマホ用：展示名の一覧（額縁が小さいため、名前を文字でも見せる）
      if (exhibitList) {
        var link = document.createElement("a");
        link.href = ex.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = ex.name;
        exhibitList.appendChild(link);
      }
    });

    if (items.length === 0 && exhibitList) exhibitList.remove();
  }

  // ==========================================================
  // 左下の椅子のそばの飾り画像（sideDecor）
  // ==========================================================
  var sideDecor = cfg.home && cfg.home.sideDecor;
  var sideDecorSlot = document.getElementById("sideDecorSlot");
  if (sideDecorSlot) {
    if (sideDecor && sideDecor.published && sideDecor.image) {
      var decorTag = sideDecor.url ? "a" : "div";
      var decorEl = document.createElement(decorTag);
      decorEl.id = "sideDecorSlot";
      decorEl.className = "slot side-decor";
      if (sideDecor.url) {
        decorEl.href = sideDecor.url;
        // サイト内のページ（topics.html など）は同じタブ、外部サイトは新しいタブで開く
        if (/^https?:/i.test(sideDecor.url)) {
          decorEl.target = "_blank";
          decorEl.rel = "noopener noreferrer";
        }
      }
      var decorImg = document.createElement("img");
      decorImg.src = sideDecor.image;
      decorImg.alt = "";
      decorImg.loading = "lazy";
      decorImg.decoding = "async";
      decorEl.appendChild(decorImg);
      sideDecorSlot.replaceWith(decorEl);
    } else {
      sideDecorSlot.remove();
    }
  }

  // 展示額縁をDOMに追加し終えたので、額縁の位置を反映する
  if (window.applySiteLayout) window.applySiteLayout();
})();
