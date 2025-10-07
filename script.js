$(function () {
  const screen = $("#screen");

  // 表示・ASCII演算子
  const OPS_DISPLAY = ["+", "-", "×", "÷"];
  const OPS_ASCII   = ["+", "-", "*", "/"];
  const ALL_OPS     = new Set([...OPS_DISPLAY, ...OPS_ASCII]);

  const isOp = (ch) => ALL_OPS.has(ch);

  // 表示を × ÷ に統一
  const toDisplayOp = (ch) => (ch === "*" ? "×" : ch === "/" ? "÷" : ch);

  // 評価用に変換
  const toEvalExpr = (s) => s.replace(/×/g, "*").replace(/÷/g, "/");

  // 末尾の不正（演算子・.・=・＝）を削る
  const trimTrailingInvalid = (s) => {
    while (s.length) {
      const last = s.at(-1);
      if (isOp(last) || last === "." || last === "=" || last === "＝") s = s.slice(0, -1);
      else break;
    }
    return s;
  };


  const getLastSegment = (s) => (s.split(/[+\-×÷*/]/).pop() || "");

  // 許可文字のバリデーション
  const isExprSafe = (s) => /^[\d\s.+\-*/×÷]+$/.test(s);

  // 先頭ゼロ正規化（0埋め整数を安全に）
  const normalizeLeadingZeros = (s) =>
    s.replace(/(^|[+\-×÷*/])(-?)0+(?=\d+(?:\.\d+)?)/g, "$1$2");

  const MAX_LEN = 64;
  const isError = () => screen.val() === "Error";


  const TRAIL_OP_RE = /[+\-×÷*/＝=]+$/;

  $(".keys").on("click", "button", function () {
    const rawValue = $(this).attr("data-value");
    const action   = $(this).attr("data-action");
    let cur = screen.val();

    if (isError()) cur = "";

    // クリア
    if (action === "clear") {
      screen.val("");
      return;
    }

    // イコール（計算）
    if (action === "equals") {
      let expr = trimTrailingInvalid(cur);
      if (!expr || expr === "-" || !isExprSafe(expr)) {
        screen.val("Error"); return;
      }
      try {
        expr = normalizeLeadingZeros(expr);
        expr = toEvalExpr(expr);
        const result = Function(`"use strict";return (${expr})`)();
        if (!Number.isFinite(result)) { screen.val("Error"); return; }
        screen.val(String(result));
      } catch {
        screen.val("Error");
      }
      return;
    }

    // 値入力
    if (rawValue !== undefined) {

      if (rawValue === "=" || rawValue === "＝") return;

      const value = toDisplayOp(rawValue); // * / を × ÷ に即時変換

      // 演算子
      if (isOp(value)) {
        const op = toDisplayOp(value);

        // 先頭は '-' のみ許可
        if (cur.length === 0) { if (op === "-") screen.val("-"); return; }

        const tail = cur.match(TRAIL_OP_RE); // 末尾の演算子かたまり
        if (!tail) {

          const next = cur + op;
          if (next.length <= MAX_LEN) screen.val(next);
          return;
        }

        const tailStr = tail[0];

        if (op === "-") {
          if (tailStr.endsWith("-")) {

            return;
          }

          const lastOp = toDisplayOp(tailStr.at(-1));
          const next = cur.replace(TRAIL_OP_RE, lastOp + "-");
          if (next.length <= MAX_LEN) screen.val(next);
          return;
        }

        const next = cur.replace(TRAIL_OP_RE, op);
        if (next.length <= MAX_LEN) screen.val(next);
        return;
      }

      // 小数点
      if (value === ".") {
        const seg = getLastSegment(cur);
        if (seg.includes(".")) return;
        const insert = seg === "" || seg === "-" ? "0." : ".";
        const next = cur + insert;
        if (next.length <= MAX_LEN) screen.val(next);
        return;
      }

      // 数字・"00"
      const next = cur + value;
      if (next.length <= MAX_LEN) screen.val(next);
    }
  });
});
