(function ($) {
  "use strict";

  var COOKIE_NAME = "agever_cookie_consent";
  var COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;
  var CAPTCHA_PROCESS_MS = 2000;

  var $modal = $("#result-modal");
  var $cookieModal = $("#cookie-consent-modal");
  var $captchaModal = $("#fake-captcha-modal");
  var $captchaTrigger = $("#fake-captcha-trigger");
  var $captchaProcessing = $("#fake-captcha-processing");
  var $message = $("#modal-message");
  var $sub = $("#modal-sub");
  var $icon = $("#modal-lucide-icon");
  var $input = $("#age-input");
  var $confetti = $("#modal-confetti");
  var $floatFx = $("#modal-float-fx");

  var pendingIsAdult = null;
  var captchaBusy = false;
  var captchaTimer = null;

  function getRequest(name) {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get(name);
    if (raw === null || raw === undefined) {
      return "";
    }
    var div = document.createElement("div");
    div.textContent = raw;
    return div.innerHTML;
  }

  function getCookie(name) {
    var escaped = name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
    var match = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  }

  function hasCookieConsent() {
    return getCookie(COOKIE_NAME) === "1";
  }

  function setCookieConsent() {
    var secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      COOKIE_NAME +
      "=1; path=/; max-age=" +
      COOKIE_MAX_AGE_SEC +
      "; SameSite=Lax" +
      secure;
  }

  var prefillAge = getRequest("age");
  if (prefillAge !== "" && /^\d+$/.test(prefillAge)) {
    $input.val(prefillAge);
  }

  function clearFx() {
    $confetti.empty();
    $floatFx.empty();
  }

  function spawnConfetti() {
    var colors = ["#fbbf24", "#f59e0b", "#fde68a", "#fcd34d", "#fb923c", "#fff7ed", "#ffffff"];
    var count = 96;
    var i;
    for (i = 0; i < count; i++) {
      var drift = (Math.random() - 0.5) * 180;
      var extraClass = "";
      var r = Math.random();
      if (r > 0.72) {
        extraClass = " confetti-piece--ribbon";
      } else if (r > 0.45) {
        extraClass = " confetti-piece--round";
      }
      var el = $("<span/>", { class: "confetti-piece" + extraClass });
      el.css({
        "--drift": drift + "px",
        left: Math.random() * 100 + "%",
        background: colors[Math.floor(Math.random() * colors.length)],
        animationDuration: 2.2 + Math.random() * 2.8 + "s",
        animationDelay: Math.random() * 0.55 + "s",
        width: (r > 0.72 ? 3 + Math.random() * 5 : 4 + Math.random() * 10) + "px",
        height: (r > 0.72 ? 10 + Math.random() * 16 : 4 + Math.random() * 9) + "px",
      });
      $confetti.append(el);
    }
  }

  function spawnMinorFloat() {
    var colors = ["#a5b4fc", "#818cf8", "#c4b5fd", "#38bdf8", "#e9d5ff"];
    var count = 56;
    var i;
    for (i = 0; i < count; i++) {
      var size = 3 + Math.random() * 9;
      var el = $("<span/>", { class: "float-sparkle" });
      el.css({
        left: Math.random() * 100 + "%",
        width: size + "px",
        height: size + "px",
        color: colors[Math.floor(Math.random() * colors.length)],
        background: "currentColor",
        animationDuration: 4.5 + Math.random() * 5 + "s",
        animationDelay: Math.random() * 2 + "s",
      });
      $floatFx.append(el);
    }
  }

  function setIcon(name) {
    $icon.attr("data-lucide", name);
    if (window.lucide && typeof lucide.createIcons === "function") {
      lucide.createIcons();
    }
  }

  function openModal(isAdult) {
    $modal.removeClass("theme-adult theme-minor");
    clearFx();

    if (isAdult) {
      $modal.addClass("theme-adult");
      $message.text("당신은 성인입니다");
      $sub.text("만 18세 이상으로 확인되었습니다.");
      setIcon("party-popper");
      spawnConfetti();
    } else {
      $modal.addClass("theme-minor");
      $message.text("당신은 미성년자입니다");
      $sub.text("만 18세 이하로 확인되었습니다.");
      setIcon("heart-handshake");
      spawnMinorFloat();
    }

    $modal.removeClass("hidden").addClass("is-open");
    $modal.attr("aria-hidden", "false");
    $("body").css("overflow", "hidden");

    var panel = $modal.find(".modal-panel")[0];
    if (panel) {
      panel.style.animation = "none";
      void panel.offsetHeight;
      panel.style.animation = "";
    }

    var flash = $modal.find(".modal-flash")[0];
    if (flash) {
      flash.style.animation = "none";
      void flash.offsetHeight;
      flash.style.animation = "";
    }

    $modal.find(".modal-ripple").each(function () {
      this.style.animation = "none";
      void this.offsetHeight;
      this.style.animation = "";
    });
  }

  function closeModal() {
    $modal.removeClass("is-open").addClass("hidden");
    $modal.attr("aria-hidden", "true");
    $("body").css("overflow", "");
    clearFx();
  }

  function clearCaptchaTimer() {
    if (captchaTimer !== null) {
      clearTimeout(captchaTimer);
      captchaTimer = null;
    }
  }

  function resetCaptchaUi() {
    clearCaptchaTimer();
    captchaBusy = false;
    $captchaModal.removeClass("is-busy");
    $captchaTrigger.prop("disabled", false).removeClass("is-checked");
    $captchaProcessing.removeClass("is-active");
  }

  function openFakeCaptchaModal() {
    if (pendingIsAdult === null) {
      return;
    }
    resetCaptchaUi();
    $captchaModal.removeClass("hidden").addClass("is-open");
    $captchaModal.attr("aria-hidden", "false");
    $("body").css("overflow", "hidden");
    var panel = $captchaModal.find(".fake-captcha-panel")[0];
    if (panel) {
      panel.style.animation = "none";
      void panel.offsetHeight;
      panel.style.animation = "";
    }
    if (window.lucide && typeof lucide.createIcons === "function") {
      lucide.createIcons();
    }
  }

  function closeFakeCaptchaModal() {
    resetCaptchaUi();
    $captchaModal.removeClass("is-open").addClass("hidden");
    $captchaModal.attr("aria-hidden", "true");
    if (!$modal.hasClass("is-open") && !$cookieModal.hasClass("is-open")) {
      $("body").css("overflow", "");
    }
  }

  function dismissCaptchaWithoutResult() {
    pendingIsAdult = null;
    closeFakeCaptchaModal();
  }

  function onFakeCaptchaClick() {
    if (captchaBusy || pendingIsAdult === null) {
      return;
    }
    captchaBusy = true;
    $captchaModal.addClass("is-busy");
    $captchaTrigger.prop("disabled", true).addClass("is-checked");
    $captchaProcessing.addClass("is-active");
    if (window.lucide && typeof lucide.createIcons === "function") {
      lucide.createIcons();
    }

    captchaTimer = setTimeout(function () {
      captchaTimer = null;
      var next = pendingIsAdult;
      pendingIsAdult = null;
      resetCaptchaUi();
      $captchaModal.removeClass("is-open").addClass("hidden");
      $captchaModal.attr("aria-hidden", "true");
      openModal(next);
    }, CAPTCHA_PROCESS_MS);
  }

  function openCookieModal(isAdult) {
    pendingIsAdult = isAdult;
    $cookieModal.removeClass("hidden").addClass("is-open");
    $cookieModal.attr("aria-hidden", "false");
    if (!$modal.hasClass("is-open") && !$captchaModal.hasClass("is-open")) {
      $("body").css("overflow", "hidden");
    }
    var panel = $cookieModal.find(".cookie-consent-panel")[0];
    if (panel) {
      panel.style.animation = "none";
      void panel.offsetHeight;
      panel.style.animation = "";
    }
    if (window.lucide && typeof lucide.createIcons === "function") {
      lucide.createIcons();
    }
  }

  function closeCookieModal() {
    $cookieModal.removeClass("is-open").addClass("hidden");
    $cookieModal.attr("aria-hidden", "true");
    pendingIsAdult = null;
    if (!$modal.hasClass("is-open") && !$captchaModal.hasClass("is-open")) {
      $("body").css("overflow", "");
    }
  }

  function onCookieConsentOk() {
    if (pendingIsAdult === null) {
      return;
    }
    setCookieConsent();
    $cookieModal.removeClass("is-open").addClass("hidden");
    $cookieModal.attr("aria-hidden", "true");
    openFakeCaptchaModal();
  }

  function verify() {
    var raw = $.trim($input.val());
    var age = parseInt(raw, 10);

    if (raw === "" || isNaN(age) || age < 0) {
      $("body").addClass("shake-input");
      setTimeout(function () {
        $("body").removeClass("shake-input");
      }, 500);
      $input.focus();
      return;
    }

    var isAdult = age >= 18;
    pendingIsAdult = isAdult;

    if (hasCookieConsent()) {
      openFakeCaptchaModal();
      return;
    }

    openCookieModal(isAdult);
  }

  $("#verify-btn").on("click", verify);

  $input.on("keydown", function (e) {
    if (e.key === "Enter") {
      verify();
    }
  });

  $("#cookie-consent-ok").on("click", onCookieConsentOk);

  $cookieModal.on("click", "[data-cookie-dismiss]", function () {
    closeCookieModal();
  });

  $captchaTrigger.on("click", onFakeCaptchaClick);

  $captchaModal.on("click", "[data-captcha-dismiss]", function () {
    if (captchaBusy) {
      return;
    }
    dismissCaptchaWithoutResult();
  });

  $modal.on("click", "[data-modal-dismiss]", closeModal);

  $(document).on("keydown", function (e) {
    if (e.key !== "Escape") {
      return;
    }
    if ($cookieModal.hasClass("is-open")) {
      closeCookieModal();
      return;
    }
    if ($captchaModal.hasClass("is-open")) {
      if (!captchaBusy) {
        dismissCaptchaWithoutResult();
      }
      return;
    }
    if ($modal.hasClass("is-open")) {
      closeModal();
    }
  });

  if (window.lucide && typeof lucide.createIcons === "function") {
    lucide.createIcons();
  }
})(jQuery);
