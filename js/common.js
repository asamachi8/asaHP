/* 全ページ共通：config.js の room 設定を CSS 変数として反映する
   （背景画像の差し替え・明るさ調整・CONTACT背景の暗さ調整） */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG;
  if (!cfg || !cfg.room) return;

  var room = cfg.room;
  var root = document.documentElement;

  var DEFAULTS = {
    backgroundMobile: "assets/images/room_mobile.jpg",
    backgroundPC: "assets/images/room_pc.jpg",
    heroImage: "assets/images/hero_exterior.jpg",
    contactBackground: "assets/images/contact_bg.jpg"
  };

  var CSS_VARS = {
    backgroundMobile: "--room-bg-mobile",
    backgroundPC: "--room-bg-pc",
    heroImage: "--hero-bg",
    contactBackground: "--contact-bg"
  };

  Object.keys(CSS_VARS).forEach(function (key) {
    var value = room[key];
    if (!value || value === DEFAULTS[key]) return;
    root.style.setProperty(CSS_VARS[key], 'url("' + new URL(value, document.baseURI).href + '")');
  });

  if (typeof room.brightness === "number") {
    root.style.setProperty("--img-brightness", String(room.brightness));
  }
  if (typeof room.contactOverlay === "number") {
    root.style.setProperty("--contact-overlay", String(room.contactOverlay));
  }

  // ABOUTページの背景（空欄なら設定しない＝紺色のグラデーションのみ）
  if (room.aboutBackground) {
    root.style.setProperty("--about-bg", 'url("' + new URL(room.aboutBackground, document.baseURI).href + '")');
  }
  if (typeof room.aboutOverlay === "number") {
    root.style.setProperty("--about-overlay", String(room.aboutOverlay));
  }

  // トピック（サロン広報）ページの背景
  if (room.topicsBackground) {
    root.style.setProperty("--topics-bg", 'url("' + new URL(room.topicsBackground, document.baseURI).href + '")');
  }
  if (typeof room.topicsOverlay === "number") {
    root.style.setProperty("--topics-overlay", String(room.topicsOverlay));
  }
})();
