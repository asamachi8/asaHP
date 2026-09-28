/* ============================================================================
   幻想肖像画美術館 ポートフォリオ　CONTACTページ用スクリプト
   ・data/config.js の contact.fields から、記入項目を組み立てる
   ・「依頼用テンプレートを挿入」ボタン
   ・Googleフォームへ、隠しiframe経由でデータを送信（ページ遷移なし）
   ============================================================================ */

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG;
  if (!cfg || !cfg.contact) return;

  var contactCfg = cfg.contact;

  // ---- 説明文（仕様文） ----
  var leadEl = document.getElementById("contactLead");
  if (leadEl && contactCfg.leadText) leadEl.textContent = contactCfg.leadText;

  // ---- Googleフォーム連携のオン／オフ ----
  // オフのときは、送信先がないフォームを見せても混乱するので、
  // フォームごと隠して案内文だけを出す。
  var gformCfg = contactCfg.googleForm || {};
  if (gformCfg.published === false) {
    var formOff = document.getElementById("contactForm");
    var closedEl = document.getElementById("contactClosed");
    if (formOff) formOff.hidden = true;
    if (leadEl) leadEl.hidden = true;
    if (closedEl) {
      closedEl.textContent = contactCfg.closedText || "お問い合わせフォームは、ただいま準備中です。";
      closedEl.hidden = false;
    }
    return;
  }

  // ---- 記入項目を組み立てる ----
  var fieldsContainer = document.getElementById("contactFields");
  var fields = contactCfg.fields || [];
  var templateBtnRef = null;
  var templateFieldRef = null;

  if (fieldsContainer) {
    fields.forEach(function (field, i) {
      var wrap = document.createElement("div");
      wrap.className = "form-field";

      var id = "field_" + (field.key || i);

      var label = document.createElement("label");
      label.setAttribute("for", id);
      label.textContent = field.label || field.key;
      wrap.appendChild(label);

      var input;
      if (field.type === "textarea") {
        input = document.createElement("textarea");
      } else {
        input = document.createElement("input");
        input.type = field.type || "text";
      }
      input.id = id;
      input.name = field.entryId || field.key || id;
      if (field.required) input.required = true;
      var autocompleteMap = { name: "name", email: "email", tel: "tel" };
      if (autocompleteMap[field.key]) input.autocomplete = autocompleteMap[field.key];
      wrap.appendChild(input);

      if (field.template) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "template-insert-btn";
        btn.textContent = "依頼用テンプレートを挿入";
        wrap.appendChild(btn);
        templateBtnRef = btn;
        templateFieldRef = input;
      }

      fieldsContainer.appendChild(wrap);
    });
  }

  // ---- 依頼用テンプレート挿入ボタン ----
  if (templateBtnRef && templateFieldRef) {
    templateBtnRef.addEventListener("click", function () {
      if (templateFieldRef.value.trim() !== "") {
        var ok = window.confirm("入力内容が上書きされます。よろしいですか？");
        if (!ok) return;
      }
      templateFieldRef.value = contactCfg.requestTemplate || "";
      templateFieldRef.focus();
    });
  }

  // ---- Googleフォームへの送信（隠しiframeへPOST） ----
  var form = document.getElementById("contactForm");
  var statusEl = document.getElementById("formStatus");
  var submitBtn = document.getElementById("formSubmitBtn");

  if (!form || !contactCfg.googleForm) return;

  var gform = contactCfg.googleForm;

  form.action = gform.actionUrl;
  form.method = "POST";
  form.target = "hiddenSubmitFrame";

  // 隠しiframeを用意（ページ遷移せずに送信するため）
  var hiddenFrame = document.createElement("iframe");
  hiddenFrame.name = "hiddenSubmitFrame";
  hiddenFrame.style.display = "none";
  document.body.appendChild(hiddenFrame);

  var isConfigured =
    gform.actionUrl.indexOf("【") === -1 &&
    fields.every(function (f) { return (f.entryId || "").indexOf("【") === -1; });

  form.addEventListener("submit", function (e) {
    if (!isConfigured) {
      e.preventDefault();
      if (statusEl) {
        statusEl.textContent = "送信先が未設定です。data/config.js の googleForm / entryId の設定を行ってください。";
        statusEl.dataset.state = "error";
      }
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = "送信中…";
      statusEl.dataset.state = "";
    }

    // hiddenFrame への送信完了（load）を待ってから完了メッセージを表示
    hiddenFrame.addEventListener("load", function onLoad() {
      hiddenFrame.removeEventListener("load", onLoad);
      if (statusEl) {
        statusEl.textContent = "送信しました。ありがとうございます。";
        statusEl.dataset.state = "ok";
      }
      form.reset();
      if (submitBtn) submitBtn.disabled = false;
    });

    // このあとブラウザが通常どおりフォームを iframe 宛に送信する
  });
})();
