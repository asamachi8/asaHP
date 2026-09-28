/* ============================================================================
   asaHPエディター共通：ローカルサーバーへファイルを保存するヘルパー
   ------------------------------------------------------------------------
   .devserver/server.ps1 の POST /save?path=... へ書き込む。
   asaHPエディター.lnk からローカルサーバー経由で開いている場合のみ使える
   （.html を直接ダブルクリックして開いた場合は使えない）。
   ============================================================================ */

window.SaveAPI = (function () {
  "use strict";

  function isAvailable() {
    return location.protocol === "http:" || location.protocol === "https:";
  }

  async function save(relPath, text) {
    var res = await fetch("/save?path=" + encodeURIComponent(relPath), {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: text
    });
    if (!res.ok) {
      throw new Error(relPath + " の保存に失敗しました（サーバー応答: " + res.status + "）");
    }
  }

  return { isAvailable: isAvailable, save: save };
})();
