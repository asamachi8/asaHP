/* ============================================================================
   asaHPエディター：トピックページ ノート（tools/topics.html 用）
   ============================================================================ */

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG;
  if (!cfg) return;

  var MAX_MEMBERS = 3;
  var MAX_ARTICLES = 3;
  var topics = cfg.topics || {};

  var dirty = false;
  function markDirty() { dirty = true; }
  document.body.addEventListener("input", markDirty, true);
  document.body.addEventListener("change", markDirty, true);

  document.getElementById("topicsTitle").value = topics.title || "";
  document.getElementById("topicsBg").value = (cfg.room && cfg.room.topicsBackground) || "";
  document.getElementById("topicsOverlay").value =
    cfg.room && typeof cfg.room.topicsOverlay === "number" ? cfg.room.topicsOverlay : 0.45;

  var logo = topics.logo || {};
  document.getElementById("topicsLogo").value = logo.image || "";
  document.getElementById("topicsLogoPosition").value = logo.position || "title-top";
  document.getElementById("topicsLogoWidth").value =
    typeof logo.width === "number" ? logo.width : 150;

  // ---- サロンメンバー（3人ぶん固定） ----
  var memberListEl = document.getElementById("memberList");
  var members = (topics.members || []).slice(0, MAX_MEMBERS);
  while (members.length < MAX_MEMBERS) {
    members.push({ name: "", image: "", url: "", intro: "", musicTitle: "", musicSrc: "", published: false });
  }

  members.forEach(function (m, i) {
    var card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML =
      '<div class="item-head"><span class="badge">メンバー' + (i + 1) + "</span>" +
      '<label><input type="checkbox" data-m="published"> 公開する</label></div>' +
      '<div class="grid2">' +
        '<div class="field"><label>名前</label><input type="text" data-m="name"></div>' +
        '<div class="field"><label>画像</label><input type="text" data-m="image" data-picker="images"></div>' +
      "</div>" +
      '<div class="field"><label>画像をクリックしたときに開くURL（空欄ならリンクなし）</label><input type="text" data-m="url"></div>' +
      '<div class="field"><label>簡単な本人紹介</label><textarea data-m="intro"></textarea></div>' +
      '<div class="grid2">' +
        '<div class="field"><label>音楽タイトル</label><input type="text" data-m="musicTitle"></div>' +
        '<div class="field"><label>イメージ音楽（mp3など）</label><input type="text" data-m="musicSrc" data-picker="audio"></div>' +
      "</div>";
    memberListEl.appendChild(card);

    card.querySelector('[data-m="published"]').checked = !!m.published;
    card.querySelector('[data-m="name"]').value = m.name || "";
    card.querySelector('[data-m="image"]').value = m.image || "";
    card.querySelector('[data-m="url"]').value = m.url || "";
    card.querySelector('[data-m="intro"]').value = m.intro || "";
    card.querySelector('[data-m="musicTitle"]').value = m.musicTitle || "";
    card.querySelector('[data-m="musicSrc"]').value = m.musicSrc || "";

    if (window.FilePicker) window.FilePicker.attachAll(card);
  });

  function readMembers() {
    return Array.prototype.map.call(memberListEl.children, function (card) {
      return {
        name: card.querySelector('[data-m="name"]').value,
        image: card.querySelector('[data-m="image"]').value,
        url: card.querySelector('[data-m="url"]').value,
        intro: card.querySelector('[data-m="intro"]').value,
        musicTitle: card.querySelector('[data-m="musicTitle"]').value,
        musicSrc: card.querySelector('[data-m="musicSrc"]').value,
        published: card.querySelector('[data-m="published"]').checked
      };
    });
  }

  // ---- トピック記事（3件ぶん固定） ----
  var articleListEl = document.getElementById("articleList");
  var articles = (topics.articles || []).slice(0, MAX_ARTICLES);
  while (articles.length < MAX_ARTICLES) {
    articles.push({ date: "", title: "", image: "", text: "", url: "", published: false });
  }

  articles.forEach(function (a, i) {
    var card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML =
      '<div class="item-head"><span class="badge">記事' + (i + 1) + "</span>" +
      '<label><input type="checkbox" data-a="published"> 公開する</label></div>' +
      '<div class="grid2">' +
        '<div class="field"><label>日付（例: 2026-10-01）</label><input type="text" data-a="date" placeholder="2026-10-01"></div>' +
        '<div class="field"><label>画像（1記事につき1枚）</label><input type="text" data-a="image" data-picker="images"></div>' +
      "</div>" +
      '<div class="field"><label>記事タイトル</label><input type="text" data-a="title"></div>' +
      '<div class="field"><label>本文</label><textarea data-a="text"></textarea></div>' +
      '<div class="field"><label>もっと読む先のURL（空欄ならリンクなし）</label><input type="text" data-a="url"></div>';
    articleListEl.appendChild(card);

    card.querySelector('[data-a="published"]').checked = !!a.published;
    card.querySelector('[data-a="date"]').value = a.date || "";
    card.querySelector('[data-a="image"]').value = a.image || "";
    card.querySelector('[data-a="title"]').value = a.title || "";
    card.querySelector('[data-a="text"]').value = a.text || "";
    card.querySelector('[data-a="url"]').value = a.url || "";

    if (window.FilePicker) window.FilePicker.attachAll(card);
  });

  function readArticles() {
    return Array.prototype.map.call(articleListEl.children, function (card) {
      return {
        date: card.querySelector('[data-a="date"]').value,
        title: card.querySelector('[data-a="title"]').value,
        image: card.querySelector('[data-a="image"]').value,
        text: card.querySelector('[data-a="text"]').value,
        url: card.querySelector('[data-a="url"]').value,
        published: card.querySelector('[data-a="published"]').checked
      };
    });
  }

  // ページ背景やロゴなど、カードの外にある入力欄にも「画像を選ぶ」ボタンを付ける
  if (window.FilePicker) window.FilePicker.attachAll(document);

  // ---- 保存 ----
  function applyEditsTo(base) {
    base.room = base.room || {};
    base.room.topicsBackground = document.getElementById("topicsBg").value;
    base.room.topicsOverlay = parseFloat(document.getElementById("topicsOverlay").value) || 0;

    base.topics = base.topics || {};
    base.topics.title = document.getElementById("topicsTitle").value;
    base.topics.logo = {
      image: document.getElementById("topicsLogo").value,
      width: parseInt(document.getElementById("topicsLogoWidth").value, 10) || 150,
      position: document.getElementById("topicsLogoPosition").value
    };
    base.topics.members = readMembers();
    base.topics.articles = readArticles();
    return base;
  }

  window.EDITOR_DIRTY = function () { return dirty; };

  window.EDITOR_SAVE = async function () {
    var fresh = (await window.ConfigIO.loadFresh()) || JSON.parse(JSON.stringify(cfg));
    var merged = applyEditsTo(fresh);
    await window.SaveAPI.save("data/config.js", window.ConfigIO.serialize(merged));
    dirty = false;
  };
})();
