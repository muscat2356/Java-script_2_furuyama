// jQueryの処理
$(function() {
  const screen = $("#screen");

  $(".keys button").on("click", function() {
    const value = $(this).data("value");
    const action = $(this).data("action");

    if (action === "clear") {
      screen.val("");
    }
    else if (action === "equals") {
      try {
        let expr = screen.val().replace(/×/g, "*").replace(/÷/g, "/");
        screen.val(eval(expr));
      } catch (e) {
        screen.val("Error");
      }
    }
    else if (value !== undefined) {
      screen.val(screen.val() + value);
    }
  });
});
