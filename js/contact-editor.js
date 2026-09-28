/* ============================================================================
   asaHPエディター：コンタクトページ ノート（tools/contact.html 用）
   ============================================================================ */

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG;
  if (!cfg) return;

  var contactCfg = cfg.contact || {};
  var dirty = false;
  function markDirty() { dirty = true; }
  document.body.addEventListener("input", markDirty, true);
  document.body.addEventListener("change", markDirty, true);
  document.body.addEventListener("click", function (e) {
    if (e.target.closest && (e.target.closest("[data-remove]") || e.target.id === "addFieldBtn")) markDirty();
  }, true);

  document.getElementById("contactBg").value = (cfg.room && cfg.room.contactBackground) || "";
  document.getElementById("contactOverlay").value =
    cfg.room && typeof cfg.room.contactOverlay === "number" ? cfg.room.contactOverlay : 0.55;
  document.getElementById("leadText").value = contactCfg.leadText || "";
  document.getElementById("requestTemplate").value = contactCfg.requestTemplate || "";
  document.getElementById("actionUrl").value =
    (contactCfg.googleForm && contactCfg.googleForm.actionUrl) || "";

  var DEFAULT_CLOSED_TEXT = "お問い合わせフォームは、ただいま準備中です。";
  document.getElementById("formPublished").checked =
    !(contactCfg.googleForm && contactCfg.googleForm.published === false);
  document.getElementById("closedText").value = contactCfg.closedText || DEFAULT_CLOSED_TEXT;

  // ---- 記入項目（追加・削除できる） ----
  var listEl = document.getElementById("fieldList");
  var fieldSeq = 0;

  function addFieldCard(field) {
    field = field || { key: "", label: "", type: "text", required: false, entryId: "", template: false };
    var n = ++fieldSeq;
    var card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML =
      '<div class="item-head">' +
        '<span class="badge">項目 ' + n + '</span>' +
        '<label><input type="checkbox" data-f="required"> 必須</label>' +
        '<label><input type="checkbox" data-f="template"> テンプレートボタンを付ける</label>' +
        '<button type="button" class="btn danger" data-remove>削除</button>' +
      '</div>' +
      '<div class="row3">' +
        '<div class="field"><label>項目名（画面表示）</label><input type="text" data-f="label"></div>' +
        '<div class="field"><label>管理用キー（半角英字）</label><input type="text" data-f="key"></div>' +
        '<div class="field"><label>入力形式</label><select data-f="type">' +
          '<option value="text">1行（text）</option>' +
          '<option value="email">メール（email）</option>' +
          '<option value="tel">電話番号（tel）</option>' +
          '<option value="textarea">複数行（textarea）</option>' +
        '</select></div>' +
      '</div>' +
      '<div class="field"><label>Googleフォームの entry 番号</label><input type="text" data-f="entryId" placeholder="entry.123456789"></div>';
    listEl.appendChild(card);

    card.querySelector('[data-f="label"]').value = field.label || "";
    card.querySelector('[data-f="key"]').value = field.key || "";
    card.querySelector('[data-f="type"]').value = field.type || "text";
    card.querySelector('[data-f="entryId"]').value = field.entryId || "";
    card.querySelector('[data-f="required"]').checked = !!field.required;
    card.querySelector('[data-f="template"]').checked = !!field.template;

    card.querySelector("[data-remove]").addEventListener("click", function () {
      card.remove();
    });
  }

  (contactCfg.fields || []).forEach(addFieldCard);

  document.getElementById("addFieldBtn").addEventListener("click", function () {
    addFieldCard();
  });

  function readFields() {
    return Array.prototype.map.call(listEl.children, function (card) {
      return {
        key: card.querySelector('[data-f="key"]').value.trim(),
        label: card.querySelector('[data-f="label"]').value,
        type: card.querySelector('[data-f="type"]').value,
        required: card.querySelector('[data-f="required"]').checked,
        entryId: card.querySelector('[data-f="entryId"]').value,
        template: card.querySelector('[data-f="template"]').checked
      };
    });
  }

  // ---- 保存 ----
  function applyEditsTo(base) {
    base.room = base.room || {};
    base.room.contactBackground = document.getElementById("contactBg").value;
    base.room.contactOverlay = parseFloat(document.getElementById("contactOverlay").value) || 0;

    base.contact = base.contact || {};
    base.contact.leadText = document.getElementById("leadText").value;
    base.contact.fields = readFields();
    base.contact.requestTemplate = document.getElementById("requestTemplate").value;
    base.contact.closedText = document.getElementById("closedText").value || DEFAULT_CLOSED_TEXT;
    base.contact.googleForm = {
      actionUrl: document.getElementById("actionUrl").value,
      published: document.getElementById("formPublished").checked
    };
    return base;
  }

  // 背景画像の入力欄に「画像を選ぶ」ボタンを付ける
  if (window.FilePicker) window.FilePicker.attachAll(document);

  // ---- シェルから呼ばれる保存の仕組み ----
  window.EDITOR_DIRTY = function () { return dirty; };

  window.EDITOR_SAVE = async function () {
    var fresh = (await window.ConfigIO.loadFresh()) || JSON.parse(JSON.stringify(cfg));
    var merged = applyEditsTo(fresh);
    await window.SaveAPI.save("data/config.js", window.ConfigIO.serialize(merged));
    dirty = false;
  };
})();
