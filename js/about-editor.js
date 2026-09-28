/* ============================================================================
   asaHPエディター：自己紹介ページ ノート（tools/about.html 用）
   ============================================================================ */

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG;
  if (!cfg) return;

  var MAX_VOICE = 4;
  var MAX_ATTACH = 8;
  var dirty = false;
  function markDirty() { dirty = true; }
  document.body.addEventListener("input", markDirty, true);
  document.body.addEventListener("change", markDirty, true);

  // ---- 額縁と自己紹介の並び ----
  document.getElementById("aboutLayout").value = (cfg.about && cfg.about.layout) || "vertical";

  // ---- ページ背景 ----
  document.getElementById("aboutBg").value = (cfg.room && cfg.room.aboutBackground) || "";
  document.getElementById("aboutOverlay").value =
    cfg.room && typeof cfg.room.aboutOverlay === "number" ? cfg.room.aboutOverlay : 0.35;

  // ---- プロフィール ----
  function fillProfile(prefix, p) {
    p = p || {};
    document.getElementById(prefix + "Image").value = p.image || "";
    document.getElementById(prefix + "Name").value = p.displayName || "";
    document.getElementById(prefix + "Title").value = p.title || "";
    document.getElementById(prefix + "Bio").value = p.bio || "";
  }
  fillProfile("voice", cfg.profiles && cfg.profiles.voice);
  fillProfile("guide", cfg.profiles && cfg.profiles.guide);

  function readProfile(prefix) {
    return {
      image: document.getElementById(prefix + "Image").value,
      displayName: document.getElementById(prefix + "Name").value,
      title: document.getElementById(prefix + "Title").value,
      bio: document.getElementById(prefix + "Bio").value
    };
  }

  // ---- VOICE SAMPLE（4件固定） ----
  var voiceListEl = document.getElementById("voiceSampleList");
  var voiceSamples = (cfg.voiceSamples || []).slice(0, MAX_VOICE);
  while (voiceSamples.length < MAX_VOICE) {
    voiceSamples.push({ title: "", mediaType: "audio", src: "", thumbnail: "", published: false });
  }

  voiceSamples.forEach(function (s, i) {
    var card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML =
      '<div class="item-head"><span class="badge">サンプル' + (i + 1) + '</span>' +
      '<label><input type="checkbox" data-vs="published"> 公開する</label></div>' +
      '<div class="field"><label>タイトル</label><input type="text" data-vs="title"></div>' +
      '<div class="grid2">' +
      '<div class="field"><label>種類</label><select data-vs="mediaType"><option value="audio">音声</option><option value="video">動画</option></select></div>' +
      '<div class="field"><label>音声/動画ファイル または URL</label><input type="text" data-vs="src" data-picker="audio"></div>' +
      '</div>' +
      '<div class="field"><label>動画用サムネイル画像（音声のみなら空欄でOK）</label><input type="text" data-vs="thumbnail" data-picker="images"></div>';
    voiceListEl.appendChild(card);

    card.querySelector('[data-vs="published"]').checked = !!s.published;
    card.querySelector('[data-vs="title"]').value = s.title || "";
    card.querySelector('[data-vs="mediaType"]').value = s.mediaType || "audio";
    card.querySelector('[data-vs="src"]').value = s.src || "";
    card.querySelector('[data-vs="thumbnail"]').value = s.thumbnail || "";
    card._el = {
      published: card.querySelector('[data-vs="published"]'),
      title: card.querySelector('[data-vs="title"]'),
      mediaType: card.querySelector('[data-vs="mediaType"]'),
      src: card.querySelector('[data-vs="src"]'),
      thumbnail: card.querySelector('[data-vs="thumbnail"]')
    };
    if (window.FilePicker) window.FilePicker.attachAll(card);
  });

  function readVoiceSamples() {
    return Array.prototype.map.call(voiceListEl.children, function (card) {
      var el = card._el;
      return {
        title: el.title.value,
        mediaType: el.mediaType.value,
        src: el.src.value,
        thumbnail: el.thumbnail.value,
        published: el.published.checked
      };
    });
  }

  // ---- 創作イラストなどの添付物（8件固定） ----
  var attachListEl = document.getElementById("attachmentList");
  var attachments = (cfg.attachments || []).slice(0, MAX_ATTACH);
  while (attachments.length < MAX_ATTACH) {
    attachments.push({ title: "", image: "", url: "", published: false });
  }

  attachments.forEach(function (w, i) {
    var card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML =
      '<div class="item-head"><span class="badge">添付' + (i + 1) + '</span>' +
      '<label><input type="checkbox" data-at="published"> 公開する</label></div>' +
      '<div class="grid2">' +
      '<div class="field"><label>タイトル</label><input type="text" data-at="title"></div>' +
      '<div class="field"><label>画像ファイル</label><input type="text" data-at="image" data-picker="images"></div>' +
      '</div>' +
      '<div class="field"><label>クリック時に開くURL（空欄ならリンクなし）</label><input type="text" data-at="url"></div>';
    attachListEl.appendChild(card);

    card.querySelector('[data-at="published"]').checked = !!w.published;
    card.querySelector('[data-at="title"]').value = w.title || "";
    card.querySelector('[data-at="image"]').value = w.image || "";
    card.querySelector('[data-at="url"]').value = w.url || "";
    card._el = {
      published: card.querySelector('[data-at="published"]'),
      title: card.querySelector('[data-at="title"]'),
      image: card.querySelector('[data-at="image"]'),
      url: card.querySelector('[data-at="url"]')
    };
    if (window.FilePicker) window.FilePicker.attachAll(card);
  });

  function readAttachments() {
    return Array.prototype.map.call(attachListEl.children, function (card) {
      var el = card._el;
      return {
        title: el.title.value,
        image: el.image.value,
        url: el.url.value,
        published: el.published.checked
      };
    });
  }

  // ---- 保存 ----
  function applyEditsTo(base) {
    base.about = base.about || {};
    base.about.layout = document.getElementById("aboutLayout").value;

    base.room = base.room || {};
    base.room.aboutBackground = document.getElementById("aboutBg").value;
    base.room.aboutOverlay = parseFloat(document.getElementById("aboutOverlay").value) || 0;

    base.profiles = base.profiles || {};
    base.profiles.voice = readProfile("voice");
    base.profiles.guide = readProfile("guide");

    base.voiceSamples = readVoiceSamples();
    base.attachments = readAttachments();
    return base;
  }

  // 固定の入力欄（背景・肖像画）にも「画像を選ぶ」ボタンを付ける
  if (window.FilePicker) window.FilePicker.attachAll(document);

  // ---- シェルから呼ばれる保存の仕組み ----
  window.EDITOR_DIRTY = function () { return dirty; };

  window.EDITOR_SAVE = async function () {
    // 他のノート（ホームページ・コンタクトページ）が後から保存した分も失わないよう、
    // 保存の直前にファイルの今の中身を読み直してから、自分の担当分だけ書き換える
    var fresh = (await window.ConfigIO.loadFresh()) || JSON.parse(JSON.stringify(cfg));
    var merged = applyEditsTo(fresh);
    await window.SaveAPI.save("data/config.js", window.ConfigIO.serialize(merged));
    dirty = false;
  };
})();
