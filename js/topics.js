/* ============================================================================
   ぎんがむたんぽぽ・サロン広報（topics.html）用スクリプト
   ・サロンメンバー最大3人（画像・リンク・紹介文・音楽タイトル・試聴プレイヤー）
   ・最近のトピック最大3記事（新しいものが上。いちばん新しい記事にNEWのワッペン）
   音楽は、再生ボタンを押した時点ではじめて読み込みます。
   ============================================================================ */

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG;
  if (!cfg) return;

  var topics = cfg.topics || {};
  var MAX_MEMBERS = 3;
  var MAX_ARTICLES = 3;

  var titleEl = document.getElementById("topicsTitle");
  var plateEl = document.getElementById("salonPlate");

  if (topics.title) {
    titleEl.textContent = topics.title;
    document.title = topics.title + "｜" + cfg.museumName;
  }

  // タイトル下の小さな英字と、ページの説明文（どちらも空欄なら出さない）
  (function fillPlateText() {
    var kicker = document.getElementById("salonKicker");
    var lead = document.getElementById("salonLead");
    if (kicker) {
      kicker.textContent = topics.kicker || "";
      kicker.hidden = !topics.kicker;
    }
    if (lead) {
      lead.textContent = topics.lead || "";
      lead.hidden = !topics.lead;
    }
  })();

  // ==========================================================
  // 創作サロン・ぎんがむたんぽぽのロゴ
  // 置き場所は data/config.js の topics.logo.position で切り替え
  // ==========================================================
  (function placeSalonLogo() {
    var logo = topics.logo || {};
    if (!logo.image) return;

    var page = document.querySelector(".topics-page");
    var position = logo.position || "title-top";
    var width = typeof logo.width === "number" ? logo.width : 150;

    var box = document.createElement("div");
    box.className = "salon-logo salon-logo-" + position;
    box.style.setProperty("--salon-logo-w", width + (position === "watermark" ? "%" : "px"));

    var img = document.createElement("img");
    img.src = logo.image;
    img.alt = position === "watermark" ? "" : "創作サロン・ぎんがむたんぽぽ";
    if (position === "watermark") img.setAttribute("aria-hidden", "true");
    box.appendChild(img);

    if (position === "watermark") {
      document.body.appendChild(box);
    } else if (position === "page-bottom") {
      page.appendChild(box);
    } else if (position === "title-left") {
      // タイトルと横並びにするため、見出しごと専用の行で包む
      var row = document.createElement("div");
      row.className = "topics-title-row";
      titleEl.parentNode.insertBefore(row, titleEl);
      row.appendChild(box);
      row.appendChild(titleEl);
    } else {
      // 銘板の上端に、封蝋のように重ねる。
      // ロゴの高さぶんだけ銘板の上を空けて、文字と重ならないようにする。
      titleEl.parentNode.insertBefore(box, titleEl);
      if (plateEl) {
        // 銘板の中は、ロゴと文字が重ならないぶんだけ上を空ける
        plateEl.style.paddingTop = Math.round(width * 0.58 + 16) + "px";
        // 銘板の上も、はみ出したロゴがナビに重ならないだけ空ける
        plateEl.style.marginTop = Math.round(width * 0.62) + "px";
      }
    }
  })();

  // 内部ページへのリンクは同じタブ、外部サイトは新しいタブで開く
  function setLink(a, url) {
    a.href = url;
    if (/^https?:/i.test(url)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  }

  function formatTime(sec) {
    if (!isFinite(sec)) return "0:00";
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  // ゲージ付きの音楽プレイヤー（押すまで音源を読み込まない）
  function createPlayer(src, label) {
    var wrap = document.createElement("div");
    wrap.className = "music-player";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "music-play";
    btn.setAttribute("aria-label", (label || "音楽") + "を再生");
    btn.textContent = "▶";

    var gauge = document.createElement("input");
    gauge.type = "range";
    gauge.className = "music-gauge";
    gauge.min = "0";
    gauge.max = "100";
    gauge.value = "0";
    gauge.step = "0.1";
    gauge.setAttribute("aria-label", "再生位置");

    var time = document.createElement("span");
    time.className = "music-time";
    time.textContent = "0:00";

    wrap.appendChild(btn);
    wrap.appendChild(gauge);
    wrap.appendChild(time);

    var audio = null;

    function setGauge() {
      if (!audio || !audio.duration) return;
      gauge.value = String((audio.currentTime / audio.duration) * 100);
      wrap.style.setProperty("--played", gauge.value + "%");
      time.textContent = formatTime(audio.currentTime) + " / " + formatTime(audio.duration);
    }

    function ensureAudio() {
      if (audio) return audio;
      audio = new Audio();
      audio.preload = "metadata";
      audio.src = src;
      audio.addEventListener("timeupdate", setGauge);
      audio.addEventListener("loadedmetadata", setGauge);
      audio.addEventListener("ended", function () {
        btn.textContent = "▶";
        wrap.classList.remove("is-playing");
      });
      return audio;
    }

    btn.addEventListener("click", function () {
      var a = ensureAudio();
      if (a.paused) {
        a.play().catch(function () {});
        btn.textContent = "⏸";
        wrap.classList.add("is-playing");
      } else {
        a.pause();
        btn.textContent = "▶";
        wrap.classList.remove("is-playing");
      }
    });

    gauge.addEventListener("input", function () {
      var a = ensureAudio();
      if (a.duration) {
        a.currentTime = (parseFloat(gauge.value) / 100) * a.duration;
        wrap.style.setProperty("--played", gauge.value + "%");
      }
    });

    return wrap;
  }

  // ==========================================================
  // サロンメンバー
  // ==========================================================
  var memberListEl = document.getElementById("memberList");
  var members = (topics.members || [])
    .filter(function (m) { return m.published; })
    .slice(0, MAX_MEMBERS);

  members.forEach(function (m) {
    var card = document.createElement("div");
    card.className = "member-card";

    if (m.image) {
      var frame;
      if (m.url) {
        frame = document.createElement("a");
        setLink(frame, m.url);
      } else {
        frame = document.createElement("div");
      }
      frame.className = "member-image";
      var img = document.createElement("img");
      img.src = m.image;
      img.alt = m.name || "";
      img.loading = "lazy";
      img.decoding = "async";
      frame.appendChild(img);
      card.appendChild(frame);
    }

    if (m.name) {
      var name = document.createElement("p");
      name.className = "member-name";
      name.textContent = m.name;
      card.appendChild(name);
    }

    if (m.intro) {
      var intro = document.createElement("p");
      intro.className = "member-intro";
      intro.textContent = m.intro;
      card.appendChild(intro);
    }

    if (m.musicTitle || m.musicSrc) {
      var music = document.createElement("div");
      music.className = "member-music";

      var mt = document.createElement("p");
      mt.className = "member-music-title";
      mt.textContent = m.musicTitle || "イメージ音楽";
      music.appendChild(mt);

      if (m.musicSrc) music.appendChild(createPlayer(m.musicSrc, m.musicTitle || m.name));
      card.appendChild(music);
    }

    memberListEl.appendChild(card);
  });

  if (members.length === 0) memberListEl.remove();

  // ==========================================================
  // 最近のトピック（新しい順）
  // ==========================================================
  var articleListEl = document.getElementById("articleList");
  var articles = (topics.articles || [])
    .filter(function (a) { return a.published; })
    .slice(0, MAX_ARTICLES);

  // 日付が入っているものは新しい順に並べ替える（日付がなければ入力順のまま）
  articles.sort(function (a, b) {
    var da = Date.parse(a.date || "");
    var db = Date.parse(b.date || "");
    if (isNaN(da) && isNaN(db)) return 0;
    if (isNaN(da)) return 1;
    if (isNaN(db)) return -1;
    return db - da;
  });

  // 一筆描き風のワッペン（NEW）
  function newBadge() {
    var span = document.createElement("span");
    span.className = "new-badge";
    span.innerHTML =
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      '<path d="M60 7 C74 10 70 2 80 12 C90 22 92 14 95 27 C98 40 106 39 101 52' +
      ' C96 65 104 70 95 79 C86 88 90 97 77 100 C64 103 64 112 52 107' +
      ' C40 102 33 110 27 99 C21 88 12 90 12 77 C12 64 4 60 12 50' +
      ' C20 40 14 33 24 25 C34 17 33 8 46 9 C54 9.6 54 5.8 60 7 Z"/>' +
      "</svg>" +
      '<span class="new-badge-text">NEW</span>';
    return span;
  }

  articles.forEach(function (a, i) {
    var card = document.createElement("article");
    card.className = "article-card";
    if (i === 0) card.classList.add("is-new");

    if (a.image) {
      var thumb = document.createElement("div");
      thumb.className = "article-image";
      var img = document.createElement("img");
      img.src = a.image;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      thumb.appendChild(img);
      card.appendChild(thumb);
    }

    var body = document.createElement("div");
    body.className = "article-body";

    if (a.date) {
      var date = document.createElement("p");
      date.className = "article-date";
      date.textContent = a.date;
      body.appendChild(date);
    }

    if (a.title) {
      var h3 = document.createElement("h3");
      h3.className = "article-title";
      if (a.url) {
        var link = document.createElement("a");
        setLink(link, a.url);
        link.textContent = a.title;
        h3.appendChild(link);
      } else {
        h3.textContent = a.title;
      }
      body.appendChild(h3);
    }

    if (a.text) {
      var p = document.createElement("p");
      p.className = "article-text";
      p.textContent = a.text;
      body.appendChild(p);
    }

    card.appendChild(body);
    if (i === 0) card.appendChild(newBadge());
    articleListEl.appendChild(card);
  });

  if (articles.length === 0) articleListEl.remove();
})();
