$(function () {
  const screen = $("#screen");

  const OPS_DISPLAY = ["+", "-", "×", "÷"];
  const OPS_ASCII   = ["+", "-", "*", "/"];
  const ALL_OPS     = new Set([...OPS_DISPLAY, ...OPS_ASCII]);
  const isOp = (ch) => ALL_OPS.has(ch);
  const toDisplayOp = (ch) => (ch === "*" ? "×" : ch === "/" ? "÷" : ch);
  const toEvalExpr  = (s) => s.replace(/×/g, "*").replace(/÷/g, "/");

  const trimTrailingInvalid = (s) => {
    while (s.length) {
      const last = s.charAt(s.length - 1);
      if (isOp(last) || last === "." || last === "=" || last === "＝") s = s.slice(0, -1);
      else break;
    }
    return s;
  };

  const getLastSegment = (s) => (s.split(/[+\-×÷*/]/).pop() || "");
  const isExprSafe = (s) => /^[\d\s.+\-*/×÷]+$/.test(s);
  const normalizeLeadingZeros = (s) =>
    s.replace(/(^|[+\-×÷*/])(-?)0+(?=\d+(?:\.\d+)?)/g, "$1$2");

  const MAX_LEN = 64;
  const isError = () => screen.val() === "Error";

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

    // 計算
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
      const value = toDisplayOp(rawValue);
      const last  = cur.charAt(cur.length - 1);

      // 演算子入力
      if (isOp(value)) {
        // 先頭は '-' のみ許可
        if (cur.length === 0) {
          if (value === "-") screen.val("-");
          return;
        }

        // 直前が演算子なら置き換え（連続防止）
        if (isOp(last)) {
          const next = cur.slice(0, -1) + value;
          screen.val(next);
          return;
        }

        // 通常追加
        if (cur.length + 1 <= MAX_LEN) screen.val(cur + value);
        return;
      }

      // 小数点
      if (value === ".") {
        const seg = getLastSegment(cur);
        if (seg.includes(".")) return;
        const insert = seg === "" || seg === "-" ? "0." : ".";
        if (cur.length + insert.length <= MAX_LEN) screen.val(cur + insert);
        return;
      }

      // 数字入力
      if (cur.length + value.length <= MAX_LEN) screen.val(cur + value);
    }
  });
});

