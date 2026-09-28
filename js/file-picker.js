/* ============================================================================
   asaHPエディター共通：「画像を選ぶ」ボタン
   ------------------------------------------------------------------------
   ファイル名を手で入力する代わりに、パソコンの中の画像（音声）を選ぶと、
   そのファイルを assets/images（または assets/audio）へコピーして、
   入力欄にそのファイル名を自動で入れる。
   ============================================================================ */

window.FilePicker = (function () {
  "use strict";

  async function upload(file, kind) {
    var res = await fetch(
      "/upload?kind=" + encodeURIComponent(kind) + "&name=" + encodeURIComponent(file.name),
      { method: "POST", body: file }
    );
    if (!res.ok) throw new Error("アップロードに失敗しました（" + res.status + "）");
    return (await res.text()).trim();
  }

  // 入力欄の隣に「画像を選ぶ」ボタンと、選んだ画像の小さなプレビューを付ける
  // kind: "images"（既定） / "audio"
  function attach(input, kind) {
    if (!input || input._pickerAttached) return;
    input._pickerAttached = true;
    kind = kind || "images";

    var isAudio = kind === "audio";

    var row = document.createElement("div");
    row.className = "picker-row";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn picker-btn";
    btn.textContent = isAudio ? "音声を選ぶ" : "画像を選ぶ";

    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = isAudio ? "audio/*,video/*" : "image/*";
    fileInput.style.display = "none";

    var thumb = document.createElement("span");
    thumb.className = "picker-thumb";

    var status = document.createElement("span");
    status.className = "picker-status";

    row.appendChild(btn);
    row.appendChild(fileInput);
    row.appendChild(thumb);
    row.appendChild(status);
    input.parentNode.insertBefore(row, input.nextSibling);

    function refreshThumb() {
      thumb.innerHTML = "";
      if (isAudio || !input.value) return;
      var img = document.createElement("img");
      img.src = "../" + input.value;
      img.alt = "";
      img.onerror = function () { thumb.innerHTML = ""; };
      thumb.appendChild(img);
    }

    btn.addEventListener("click", function () { fileInput.click(); });

    fileInput.addEventListener("change", async function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      status.textContent = "取り込み中…";
      try {
        var savedPath = await upload(file, kind);
        input.value = savedPath;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        status.textContent = "取り込みました";
        refreshThumb();
        setTimeout(function () { status.textContent = ""; }, 2500);
      } catch (e) {
        status.textContent = e && e.message ? e.message : "失敗しました";
      }
      fileInput.value = "";
    });

    input.addEventListener("input", refreshThumb);
    refreshThumb();
  }

  // data-picker 属性が付いた入力欄に、まとめてボタンを付ける
  function attachAll(rootEl) {
    (rootEl || document).querySelectorAll("[data-picker]").forEach(function (input) {
      attach(input, input.getAttribute("data-picker"));
    });
  }

  return { attach: attach, attachAll: attachAll };
})();
