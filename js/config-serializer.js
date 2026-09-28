/* ============================================================================
   asaHPエディター共通：data/config.js の読み書き用ヘルパー
   ------------------------------------------------------------------------
   複数のノート（ホームページ・自己紹介ページ・コンタクトページ）が同じ
   config.js を保存できるように、保存の直前に「サーバー上の今の中身」を
   読み直してから、自分が担当する項目だけを上書きする。
   ============================================================================ */

window.ConfigIO = (function () {
  "use strict";

  // 実ファイルのテキストから SITE_CONFIG オブジェクトを取り出す
  // （JSONではなく本物のJSとして実行するので、手動編集後のコメント等があっても読める）
  function parseConfigText(text) {
    try {
      var sandboxWindow = {};
      var fn = new Function("window", text + "\nreturn window.SITE_CONFIG;");
      var result = fn(sandboxWindow);
      return result || null;
    } catch (e) {
      return null;
    }
  }

  // サーバー上の config.js を読み直す。読めなければ null
  // （呼び出し側で、今メモリ上にある window.SITE_CONFIG にフォールバックすること）
  async function loadFresh() {
    try {
      var res = await fetch("../data/config.js?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return null;
      var text = await res.text();
      return parseConfigText(text);
    } catch (e) {
      return null;
    }
  }

  function serialize(cfg) {
    var json = JSON.stringify(cfg, null, 2);
    return (
      "/* ============================================================================\n" +
      "   幻想肖像画美術館 ポートフォリオ　設定ファイル (config.js)\n" +
      "   ------------------------------------------------------------------------\n" +
      "   このファイルは asaHPエディターで保存されました。\n" +
      "   手動で書き換えてもかまいませんが、次に asaHPエディターで保存すると、\n" +
      "   このコメントのような説明文は書き直され、値だけが引き継がれます。\n" +
      "   ============================================================================ */\n\n" +
      "window.SITE_CONFIG = " + json + ";\n"
    );
  }

  return { parseConfigText: parseConfigText, loadFresh: loadFresh, serialize: serialize };
})();
