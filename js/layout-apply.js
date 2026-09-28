/* ホームページ専用：data/layout.js の SITE_LAYOUT を、実際の額縁の位置として
   肖像リンク（#portraitFrame）と展示額縁（#exhibitGallery .slot）に反映する。
   画面幅（スマホ／PC）が変わるたびに、自動で該当するレイアウトへ切り替える。 */
(function () {
  "use strict";

  function isPC() {
    return window.matchMedia("(min-width: 900px) and (min-aspect-ratio: 5/4)").matches;
  }

  function setBox(el, box) {
    if (!el || !box) return;
    el.style.left = box.left + "%";
    el.style.top = box.top + "%";
    el.style.width = box.width + "%";
    el.style.height = box.height + "%";
    el.style.borderRadius = box.round ? "50%" : "";
  }

  function apply() {
    var layout = window.SITE_LAYOUT;
    if (!layout) return;
    var mode = isPC() ? "pc" : "mobile";
    var current = layout[mode];
    if (!current) return;

    setBox(document.getElementById("portraitFrame"), current.portrait);
    setBox(document.getElementById("sideDecorSlot"), current.sideDecor);

    var slotEls = document.querySelectorAll("#exhibitGallery .slot");
    slotEls.forEach(function (el, i) {
      var box = current.slots && current.slots[i];
      if (!box) { el.style.display = "none"; return; }
      el.style.display = "";
      setBox(el, box);
    });
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(apply, 120);
  });
  window.addEventListener("orientationchange", apply);

  window.applySiteLayout = apply;
})();
