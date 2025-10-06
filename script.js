// jQueryの処理（演算子連続対策 + 安全性・UX 強化）
$(function () {
  const screen = $("#screen");

  // 表示・ASCII演算子
  const OPS_DISPLAY = ["+", "-", "×", "÷"];
  const OPS_ASCII   = ["+", "-", "*", "/"];
  const ALL_OPS     = new Set([...OPS_DISPLAY, ...OPS_ASCII]);

  const isOp = (ch) => ALL_OPS.has(ch);

  // 表示を × ÷ に統一
  const toDisplayOp = (ch) => (ch === "*" ? "×" : ch === "/" ? "÷" : ch);

  // eval 用に変換
  const toEvalExpr = (s) => s.replace(/×/g, "*").replace(/÷/g, "/");

  // 末尾の不正（演算子 or .）を削る
  const trimTrailingInvalid = (s) => {
    while (s.length) {
      const last = s.at(-1);
      if (isOp(last) || last === ".") s = s.slice(0, -1);
      else break;
    }
    return s;
  };

  // 小数点制御用：最後の数値セグメント（符号付き）を取得
  // 区切りは表示/ASCIIの全演算子
  const getLastSegment = (s) => (s.split(/[+\-×÷*/]/).pop() || "");

  // 許可文字のバリデーション（数字・空白・.・+ - * / × ÷ のみ）
  const isExprSafe = (s) => /^[\d\s.+\-*/×÷]+$/.test(s);

  // エラー状態か？
  const isError = () => screen.val() === "Error";

  // 桁数上限（必要なら）
  const MAX_LEN = 64;

  $(".keys button").on("click", function () {
    const value  = $(this).data("value");
    const action = $(this).data("action");
    let cur = screen.val();

    // Error 表示中に数字/小数点/演算子を押したらクリアして続行
    if (isError()) cur = "";

    if (action === "clear") {
      screen.val("");
      return;
    }

    if (action === "equals") {
      let expr = trimTrailingInvalid(cur);
      if (!expr || expr === "-") {
        screen.val("Error");
        return;
      }
      if (!isExprSafe(expr)) {
        screen.val("Error");
        return;
      }
      try {
        expr = toEvalExpr(expr);
        // 評価
        const result = Function(`"use strict";return (${expr})`)();
        // 非有限値はエラー
        if (!Number.isFinite(result)) {
          screen.val("Error");
          return;
        }
        screen.val(String(result));
      } catch {
        screen.val("Error");
      }
      return;
    }

    if (value !== undefined) {
      // 入力が演算子
      if (isOp(value)) {
        const op = toDisplayOp(value);

        if (cur.length === 0) {
          // 先頭は '-' のみ許可（負数の入力）
          if (op === "-") screen.val("-");
          return;
        }

        const last = cur.at(-1);

        if (isOp(last)) {
          // 「直前が演算子」のとき
          if (op === "-" && last !== "-") {
            // 直後の負数を許可（例: 1×-2）
            screen.val(cur + "-");
          } else {
            // それ以外は単純置換（連続演算子対策）
            screen.val(cur.slice(0, -1) + op);
          }
        } else {
          // 通常追加
          const next = cur + op;
          if (next.length <= MAX_LEN) screen.val(next);
        }
        return;
      }

      // 入力が小数点
      if (value === ".") {
        const seg = getLastSegment(cur);
        if (seg.includes(".")) return;                    // 重複禁止
        const insert = seg === "" || seg === "-" ? "0." : ".";
        const next = cur + insert;
        if (next.length <= MAX_LEN) screen.val(next);
        return;
      }

      // 数字など
      const next = cur + value;
      if (next.length <= MAX_LEN) screen.val(next);
    }
  });
});
