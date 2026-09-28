/* ============================================================================
   ホームページ ノート（tools/layout.html 用）
   ・活動展示6枠：位置は固定。画像・URL・公開設定・並び順（優先順位）を編集
   ・椅子横の飾り画像：位置はドラッグで調整、中身（画像・URL・公開設定）も編集
   保存は行わず、シェルの「変更をすべて保存」から呼ばれる
   window.EDITOR_DIRTY() / window.EDITOR_SAVE() を提供する。
   ============================================================================ */

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG;
  var layout = window.SITE_LAYOUT;
  if (!cfg || !layout) return;

  var MAX_EXHIBITS = 6;

  var IMAGE_SRC = { mobile: "../assets/images/room_mobile.jpg", pc: "../assets/images/room_pc.jpg" };
  var IMAGE_RATIO = { mobile: 828 / 1471, pc: 1600 / 901 };

  var layoutState = JSON.parse(JSON.stringify(layout));
  var mode = "mobile";
  var dirty = false;

  function markDirty() { dirty = true; }

  var canvas = document.getElementById("canvas");
  var canvasImg = document.getElementById("canvasImg");
  var sidePanel = document.getElementById("sidePanel");

  // ---------------------------------------------------------------
  // 配置プレビュー（展示6枠は固定表示のみ、椅子横の飾りだけドラッグ可）
  // ---------------------------------------------------------------
  function renderCanvas() {
    canvasImg.src = IMAGE_SRC[mode];
    canvas.style.aspectRatio = String(IMAGE_RATIO[mode]);
    canvas.querySelectorAll(".box").forEach(function (el) { el.remove(); });
    sidePanel.innerHTML = "";

    var cur = layoutState[mode];

    (cur.slots || []).forEach(function (box, i) {
      var el = document.createElement("div");
      el.className = "box";
      el.innerHTML = '<span class="box-label">展示' + (i + 1) + "</span>";
      applyBoxStyle(el, box);
      canvas.appendChild(el);
    });

    if (cur.sideDecor) {
      var decorBox = cur.sideDecor;
      var el = document.createElement("div");
      el.className = "box movable";
      el.innerHTML = '<span class="box-label">椅子横の飾り画像</span><span class="handle"></span>';
      // 画像が設定されていれば、枠の中に薄く表示して位置合わせしやすくする
      var decorImageEl = document.getElementById("decorImage");
      var decorImagePath = decorImageEl ? decorImageEl.value : "";
      if (decorImagePath) {
        el.style.backgroundImage = 'url("../' + decorImagePath + '")';
        el.style.backgroundSize = "100% 100%";
        el.style.backgroundRepeat = "no-repeat";
      }
      canvas.appendChild(el);
      applyBoxStyle(el, decorBox);
      bindDrag(el, decorBox);

      var head = document.createElement("div");
      head.className = "field-row head";
      head.innerHTML = "<span>飾り画像</span><span>left%</span><span>top%</span><span>width%</span><span>height%</span><span>丸</span>";
      sidePanel.appendChild(head);

      var row = document.createElement("div");
      row.className = "field-row";
      row.innerHTML =
        '<label class="name">位置</label>' +
        '<input type="number" step="0.01" data-key="left">' +
        '<input type="number" step="0.01" data-key="top">' +
        '<input type="number" step="0.01" data-key="width">' +
        '<input type="number" step="0.01" data-key="height">' +
        '<input type="checkbox" data-key="round" title="楕円にする">';
      sidePanel.appendChild(row);
      syncInputs(row, decorBox);

      row.querySelectorAll("input").forEach(function (input) {
        input.addEventListener("input", function () {
          var key = input.dataset.key;
          if (key === "round") { decorBox.round = input.checked; }
          else { var v = parseFloat(input.value); if (!isNaN(v)) decorBox[key] = v; }
          applyBoxStyle(el, decorBox);
          markDirty();
        });
      });
      el._row = row;
    }
  }

  function applyBoxStyle(el, box) {
    el.style.left = box.left + "%";
    el.style.top = box.top + "%";
    el.style.width = box.width + "%";
    el.style.height = box.height + "%";
    el.style.borderRadius = box.round ? "50%" : "0";
  }

  function syncInputs(row, box) {
    row.querySelector('[data-key="left"]').value = round2(box.left);
    row.querySelector('[data-key="top"]').value = round2(box.top);
    row.querySelector('[data-key="width"]').value = round2(box.width);
    row.querySelector('[data-key="height"]').value = round2(box.height);
    row.querySelector('[data-key="round"]').checked = !!box.round;
  }

  function round2(n) { return Math.round(n * 100) / 100; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function bindDrag(el, box) {
    var handle = el.querySelector(".handle");

    el.addEventListener("pointerdown", function (e) {
      if (e.target === handle) return;
      e.preventDefault();
      el.classList.add("active");
      el.setPointerCapture(e.pointerId);
      var rect = canvas.getBoundingClientRect();
      var startX = e.clientX, startY = e.clientY;
      var startLeft = box.left, startTop = box.top;

      function onMove(ev) {
        var dxPct = ((ev.clientX - startX) / rect.width) * 100;
        var dyPct = ((ev.clientY - startY) / rect.height) * 100;
        // 画面の外へはみ出してもよい（はみ出した部分はサイトでは表示されない）
        box.left = clamp(startLeft + dxPct, -100, 200);
        box.top = clamp(startTop + dyPct, -100, 200);
        applyBoxStyle(el, box);
        syncInputs(el._row, box);
        markDirty();
      }
      function onUp(ev) {
        el.classList.remove("active");
        el.releasePointerCapture(ev.pointerId);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
      }
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
    });

    handle.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      handle.setPointerCapture(e.pointerId);
      var rect = canvas.getBoundingClientRect();
      var startX = e.clientX, startY = e.clientY;
      var startW = box.width, startH = box.height;

      function onMove(ev) {
        var dwPct = ((ev.clientX - startX) / rect.width) * 100;
        var dhPct = ((ev.clientY - startY) / rect.height) * 100;
        // 画面の外まで大きくしてもよい（はみ出した部分はサイトでは表示されない）
        box.width = clamp(startW + dwPct, 2, 250);
        box.height = clamp(startH + dhPct, 2, 250);
        applyBoxStyle(el, box);
        syncInputs(el._row, box);
        markDirty();
      }
      function onUp(ev) {
        handle.releasePointerCapture(ev.pointerId);
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
      }
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
    });
  }

  document.querySelectorAll(".tabs button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tabs button").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      mode = btn.dataset.mode;
      renderCanvas();
    });
  });

  renderCanvas();

  // ---------------------------------------------------------------
  // 活動展示6枠（画像・URL・公開・並び順）
  // ---------------------------------------------------------------
  var exhibitListEl = document.getElementById("exhibitList");
  var exhibits = (cfg.exhibits || []).slice(0, MAX_EXHIBITS);
  while (exhibits.length < MAX_EXHIBITS) {
    exhibits.push({ name: "", image: "", url: "", published: false });
  }

  function renderExhibitList() {
    exhibitListEl.innerHTML = "";
    exhibits.forEach(function (ex, i) {
      var card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML =
        '<div class="item-head">' +
          '<span class="badge">展示' + (i + 1) + "</span>" +
          '<label><input type="checkbox" data-ex="published"> 公開する</label>' +
          '<span class="order-btns">' +
            '<button type="button" class="btn" data-up' + (i === 0 ? " disabled" : "") + '>▲</button>' +
            '<button type="button" class="btn" data-down' + (i === exhibits.length - 1 ? " disabled" : "") + '>▼</button>' +
          "</span>" +
        "</div>" +
        '<div class="grid2">' +
          '<div class="field"><label>展示名</label><input type="text" data-ex="name"></div>' +
          '<div class="field"><label>画像ファイル（空欄なら背景の絵をそのまま表示）</label><input type="text" data-ex="image" data-picker="images"></div>' +
        "</div>" +
        '<div class="field"><label>クリック時に開くURL</label><input type="text" data-ex="url"></div>';
      exhibitListEl.appendChild(card);

      card.querySelector('[data-ex="published"]').checked = !!ex.published;
      card.querySelector('[data-ex="name"]').value = ex.name || "";
      card.querySelector('[data-ex="image"]').value = ex.image || "";
      card.querySelector('[data-ex="url"]').value = ex.url || "";

      card.querySelectorAll("input").forEach(function (input) {
        input.addEventListener("input", function () {
          exhibits[i] = readExhibitCard(card);
          markDirty();
        });
      });

      var upBtn = card.querySelector("[data-up]");
      var downBtn = card.querySelector("[data-down]");
      upBtn.addEventListener("click", function () {
        if (i === 0) return;
        exhibits[i] = readExhibitCard(card);
        var tmp = exhibits[i - 1]; exhibits[i - 1] = exhibits[i]; exhibits[i] = tmp;
        markDirty();
        renderExhibitList();
      });
      downBtn.addEventListener("click", function () {
        if (i === exhibits.length - 1) return;
        exhibits[i] = readExhibitCard(card);
        var tmp2 = exhibits[i + 1]; exhibits[i + 1] = exhibits[i]; exhibits[i] = tmp2;
        markDirty();
        renderExhibitList();
      });

      if (window.FilePicker) window.FilePicker.attachAll(card);
    });
  }

  function readExhibitCard(card) {
    return {
      name: card.querySelector('[data-ex="name"]').value,
      image: card.querySelector('[data-ex="image"]').value,
      url: card.querySelector('[data-ex="url"]').value,
      published: card.querySelector('[data-ex="published"]').checked
    };
  }

  function readExhibits() {
    // 画面に表示中の最新値を、カードの現在のDOM状態から取り直す
    var cards = exhibitListEl.querySelectorAll(".item-card");
    return Array.prototype.map.call(cards, readExhibitCard);
  }

  renderExhibitList();

  // ---------------------------------------------------------------
  // タイトルロゴ（画像・大きさ）
  // ---------------------------------------------------------------
  var logoCfg = (cfg.home && cfg.home.logo) || {};
  var logoImageEl = document.getElementById("logoImage");
  var logoWMobileEl = document.getElementById("logoWidthMobile");
  var logoWPCEl = document.getElementById("logoWidthPC");
  var logoPreviewEl = document.getElementById("logoPreview");
  var welcomeTextEl = document.getElementById("welcomeText");

  welcomeTextEl.value = (cfg.home && cfg.home.welcomeText) || "";
  logoImageEl.value = logoCfg.image || "";
  logoWMobileEl.value = typeof logoCfg.widthMobile === "number" ? logoCfg.widthMobile : 76;
  logoWPCEl.value = typeof logoCfg.widthPC === "number" ? logoCfg.widthPC : 16;

  function renderLogoPreview() {
    logoPreviewEl.innerHTML = "";
    var path = logoImageEl.value;
    if (!path) {
      var msg = document.createElement("span");
      msg.className = "empty";
      msg.textContent = "ロゴ画像が設定されていません";
      logoPreviewEl.appendChild(msg);
      return;
    }
    var img = document.createElement("img");
    img.src = "../" + path;
    img.alt = "";
    // プレビュー枠の幅を「スマホの画面幅」に見立てて、指定した％で表示する
    img.style.width = (parseFloat(logoWMobileEl.value) || 76) + "%";
    logoPreviewEl.appendChild(img);
  }

  [logoImageEl, logoWMobileEl, logoWPCEl, welcomeTextEl].forEach(function (el) {
    el.addEventListener("input", function () {
      markDirty();
      renderLogoPreview();
    });
  });
  renderLogoPreview();

  function readLogo() {
    return {
      image: logoImageEl.value,
      widthMobile: parseFloat(logoWMobileEl.value) || 76,
      widthPC: parseFloat(logoWPCEl.value) || 16
    };
  }

  // ---------------------------------------------------------------
  // 椅子横の飾り画像（中身）
  // ---------------------------------------------------------------
  var decor = (cfg.home && cfg.home.sideDecor) || { image: "", url: "", published: false };
  document.getElementById("decorImage").value = decor.image || "";
  document.getElementById("decorUrl").value = decor.url || "";
  document.getElementById("decorPublished").checked = !!decor.published;

  ["decorImage", "decorUrl", "decorPublished"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", markDirty);
  });

  // 画像を変えたら、配置プレビューの枠の中身も更新する
  document.getElementById("decorImage").addEventListener("input", renderCanvas);

  if (window.FilePicker) window.FilePicker.attachAll(document);

  function readDecorContent() {
    return {
      image: document.getElementById("decorImage").value,
      url: document.getElementById("decorUrl").value,
      published: document.getElementById("decorPublished").checked
    };
  }

  // ---------------------------------------------------------------
  // layout.js の中身を組み立てる（portrait・slots は編集していないのでそのまま）
  // ---------------------------------------------------------------
  function fmtBox(box) {
    var parts = [
      "left: " + round2(box.left), "top: " + round2(box.top),
      "width: " + round2(box.width), "height: " + round2(box.height)
    ];
    if (box.round) parts.push("round: true");
    return "{ " + parts.join(", ") + " }";
  }

  function buildLayoutCode() {
    function block(m) {
      var c = layoutState[m];
      var slotsCode = c.slots.map(function (s) { return "      " + fmtBox(s); }).join(",\n");
      var out = "    portrait: " + fmtBox(c.portrait) + ",\n    slots: [\n" + slotsCode + "\n    ]";
      if (c.sideDecor) out += ",\n    sideDecor: " + fmtBox(c.sideDecor);
      return out;
    }
    return (
      "window.SITE_LAYOUT = {\n\n" +
      "  // スマホ（縦長の展示室 / room_mobile.jpg 828×1471）\n" +
      "  mobile: {\n" + block("mobile") + "\n  },\n\n" +
      "  // PC（横長の展示室 / room_pc.jpg 1600×901）\n" +
      "  pc: {\n" + block("pc") + "\n  }\n" +
      "};\n"
    );
  }

  // ---------------------------------------------------------------
  // シェルから呼ばれる保存の仕組み
  // ---------------------------------------------------------------
  window.EDITOR_DIRTY = function () { return dirty; };

  window.EDITOR_SAVE = async function () {
    await window.SaveAPI.save("data/layout.js", buildLayoutCode());

    var fresh = (await window.ConfigIO.loadFresh()) || JSON.parse(JSON.stringify(cfg));
    fresh.exhibits = readExhibits();
    fresh.home = fresh.home || {};
    fresh.home.welcomeText = welcomeTextEl.value;
    fresh.home.logo = readLogo();
    fresh.home.sideDecor = readDecorContent();
    await window.SaveAPI.save("data/config.js", window.ConfigIO.serialize(fresh));

    dirty = false;
  };
})();
