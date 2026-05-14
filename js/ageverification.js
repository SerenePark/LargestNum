(function ($) {
  "use strict";

  var LANG_KEY = "agever_lang";
  var COOKIE_NAME = "agever_cookie_consent";
  var COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;
  var CAPTCHA_PROCESS_MS = 1000;
  var AD_CLOSE_REVEAL_MS = 2000;

  var STRINGS = {
    ko: {
      "page.title": "연령 확인",
      "page.heading": "연령 확인",
      "page.subtitle": "나이를 입력한 뒤 아래 버튼을 눌러주세요.",
      "form.ageLabel": "나이",
      "form.placeholder": "예: 20",
      "form.verifyBtn": "연령 확인",
      "cookie.title": "쿠키가 필요합니다",
      "cookie.body":
        "연령 확인 결과를 보여드리려면 최소한의 쿠키 저장이 필요합니다. 동의하시면 결과 화면으로 이동합니다.",
      "cookie.cancel": "취소",
      "cookie.confirm": "확인",
      "captcha.lead": "보안 확인 (연출용)",
      "captcha.notRobot": "로봇이 아닙니다",
      "captcha.securityLabel": "보안",
      "captcha.processing": "확인 중…",
      "captcha.disclaimer": "이 단계는 실제 봇 검사가 아니라 화면 연출입니다.",
      "ad.alt": "점핑캣 아케이드 광고",
      "ad.closeAria": "광고 닫기",
      "result.adultTitle": "당신은 성인입니다",
      "result.adultSub": "만 18세 이상으로 확인되었습니다.",
      "result.minorTitle": "당신은 미성년자입니다",
      "result.minorSub": "만 18세 이하로 확인되었습니다.",
      "result.ok": "확인",
      "result.closeAria": "닫기",
      "donate.orgLine": "희망나눔 휴먼니터리",
      "donate.title": "기부에 동참해 주세요",
      "donate.subtitle":
        "어려움을 겪는 이웃을 위해 안전하게 기부할 수 있습니다. 금액을 선택한 뒤 결제 정보를 입력해 주세요.",
      "donate.amountLabel": "기부 금액",
      "donate.amt1": "₩10,000",
      "donate.amt2": "₩30,000",
      "donate.amt3": "₩50,000",
      "donate.cardLabel": "카드 번호",
      "donate.expLabel": "만료",
      "donate.cvcLabel": "CVC",
      "donate.nameLabel": "카드 소유자 이름",
      "donate.namePh": "홍길동",
      "donate.secureNote": "256-bit SSL 암호화로 보호됩니다. PCI DSS 준수 처리.",
      "donate.disclaimer":
        "이 창은 연령 확인 데모의 연출용이며, 실제 기부·결제·카드 승인은 이루어지지 않습니다. 입력 정보는 서버로 전송되지 않습니다.",
      "donate.skip": "나중에 하기",
      "donate.submit": "기부하기",
      "donate.processing": "처리 중…",
      "donate.thanksTitle": "감사합니다",
      "donate.thanksSub":
        "데모 연출로 실제 결제는 진행되지 않았습니다. 곧 연령 확인 결과를 보여 드립니다.",
      "donate.thanksBtn": "연령 결과 보기",
      "donate.closeAria": "닫기",
    },
    en: {
      "page.title": "Age verification",
      "page.heading": "Age verification",
      "page.subtitle": "Enter your age and tap the button below.",
      "form.ageLabel": "Age",
      "form.placeholder": "e.g. 20",
      "form.verifyBtn": "Verify age",
      "cookie.title": "Cookies required",
      "cookie.body":
        "We save a small cookie to show your age check result. If you agree, we’ll continue to the next step.",
      "cookie.cancel": "Cancel",
      "cookie.confirm": "OK",
      "captcha.lead": "Security check (display only)",
      "captcha.notRobot": "I'm not a robot",
      "captcha.securityLabel": "Sec",
      "captcha.processing": "Verifying…",
      "captcha.disclaimer": "This step is for show only — not a real bot check.",
      "ad.alt": "Jumping Cat Arcade ad",
      "ad.closeAria": "Close ad",
      "result.adultTitle": "You are an adult.",
      "result.adultSub": "Verified as age 18 or older.",
      "result.minorTitle": "You are a minor.",
      "result.minorSub": "Verified as age 18 or under.",
      "result.ok": "OK",
      "result.closeAria": "Close",
      "donate.orgLine": "HopeBridge Humanitarian",
      "donate.title": "Please consider a gift",
      "donate.subtitle":
        "Support neighbors in need with a secure, one-tap donation. Choose an amount and enter your card details.",
      "donate.amountLabel": "Donation amount",
      "donate.amt1": "$10",
      "donate.amt2": "$25",
      "donate.amt3": "$50",
      "donate.cardLabel": "Card number",
      "donate.expLabel": "Expires",
      "donate.cvcLabel": "CVC",
      "donate.nameLabel": "Name on card",
      "donate.namePh": "Jane Doe",
      "donate.secureNote": "Protected with 256-bit SSL. PCI DSS–style processing (demo).",
      "donate.disclaimer":
        "This window is part of an age-check demo only. No real donation, charge, or card authorization occurs. Nothing you type is sent to a server.",
      "donate.skip": "Maybe later",
      "donate.submit": "Donate",
      "donate.processing": "Processing…",
      "donate.thanksTitle": "Thank you",
      "donate.thanksSub":
        "This was a demo—no payment was taken. Your age result is next.",
      "donate.thanksBtn": "See age result",
      "donate.closeAria": "Close",
    },
  };

  var $modal = $("#result-modal");
  var $cookieModal = $("#cookie-consent-modal");
  var $captchaModal = $("#fake-captcha-modal");
  var $adModal = $("#interstitial-ad-modal");
  var $adClose = $("#interstitial-ad-close");
  var $adImage = $("#interstitial-ad-image");
  var $donationModal = $("#donation-modal");
  var $captchaTrigger = $("#fake-captcha-trigger");
  var $captchaProcessing = $("#fake-captcha-processing");
  var $message = $("#modal-message");
  var $sub = $("#modal-sub");
  var $icon = $("#modal-lucide-icon");
  var $input = $("#age-input");
  var $confetti = $("#modal-confetti");
  var $floatFx = $("#modal-float-fx");

  var pendingIsAdult = null;
  var pendingAfterAd = null;
  var pendingDonationIsAdult = null;
  var captchaBusy = false;
  var captchaTimer = null;
  var adRevealTimer = null;
  var donationSubmitBusy = false;
  var donationProcessTimer = null;

  function clearDonationProcessTimer() {
    if (donationProcessTimer !== null) {
      clearTimeout(donationProcessTimer);
      donationProcessTimer = null;
    }
  }

  function getLang() {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "ko";
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang === "en" ? "en" : "ko");
    applyLang();
  }

  function t(key) {
    var lang = getLang();
    var pack = STRINGS[lang];
    if (pack && Object.prototype.hasOwnProperty.call(pack, key)) {
      return pack[key];
    }
    return STRINGS.ko[key] !== undefined ? STRINGS.ko[key] : key;
  }

  function applyLang() {
    var lang = getLang();
    $("#root-html").attr("lang", lang === "en" ? "en" : "ko");
    document.title = t("page.title");

    $("[data-i18n]").each(function () {
      var key = $(this).attr("data-i18n");
      if (key) {
        $(this).text(t(key));
      }
    });
    $("[data-i18n-alt]").each(function () {
      var key = $(this).attr("data-i18n-alt");
      if (key) {
        $(this).attr("alt", t(key));
      }
    });
    $("[data-i18n-aria]").each(function () {
      var key = $(this).attr("data-i18n-aria");
      if (key) {
        $(this).attr("aria-label", t(key));
      }
    });
    $("[data-i18n-placeholder]").each(function () {
      var key = $(this).attr("data-i18n-placeholder");
      if (key) {
        $(this).attr("placeholder", t(key));
      }
    });

    $input.attr("placeholder", t("form.placeholder"));
    updateAdImageSrc();
    refreshOpenResultTexts();

    $(".lang-btn").removeClass("is-active");
    $(".lang-btn[data-lang=\"" + lang + "\"]").addClass("is-active");

    if (window.lucide && typeof lucide.createIcons === "function") {
      lucide.createIcons();
    }
  }

  function updateAdImageSrc() {
    if (!$adImage.length) {
      return;
    }
    var lang = getLang();
    var src = lang === "en" ? $adImage.attr("data-src-en") : $adImage.attr("data-src-ko");
    if (src) {
      $adImage.attr("src", src);
    }
    $adImage.attr("alt", t("ad.alt"));
  }

  function refreshOpenResultTexts() {
    if (!$modal.hasClass("is-open")) {
      return;
    }
    var r = $modal.attr("data-result");
    if (r === "adult") {
      $message.text(t("result.adultTitle"));
      $sub.text(t("result.adultSub"));
    } else if (r === "minor") {
      $message.text(t("result.minorTitle"));
      $sub.text(t("result.minorSub"));
    }
  }

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

  var urlLang = getRequest("lang");
  if (urlLang === "en" || urlLang === "ko") {
    localStorage.setItem(LANG_KEY, urlLang);
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
      $message.text(t("result.adultTitle"));
      $sub.text(t("result.adultSub"));
      setIcon("party-popper");
      spawnConfetti();
    } else {
      $modal.addClass("theme-minor");
      $message.text(t("result.minorTitle"));
      $sub.text(t("result.minorSub"));
      setIcon("heart-handshake");
      spawnMinorFloat();
    }

    $modal.attr("data-result", isAdult ? "adult" : "minor");

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
    $modal.removeAttr("data-result");
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
    if (!$modal.hasClass("is-open") && !$cookieModal.hasClass("is-open") && !$adModal.hasClass("is-open") && !$donationModal.hasClass("is-open")) {
      $("body").css("overflow", "");
    }
  }

  function dismissCaptchaWithoutResult() {
    pendingIsAdult = null;
    closeFakeCaptchaModal();
  }

  function clearAdRevealTimer() {
    if (adRevealTimer !== null) {
      clearTimeout(adRevealTimer);
      adRevealTimer = null;
    }
  }

  function openInterstitialAd(isAdult) {
    clearAdRevealTimer();
    pendingAfterAd = isAdult;
    updateAdImageSrc();
    $adModal.removeClass("hidden is-close-ready").addClass("is-open");
    $adModal.attr("aria-hidden", "false");
    $adClose.prop("disabled", true).attr("aria-hidden", "true");
    $("body").css("overflow", "hidden");

    adRevealTimer = setTimeout(function () {
      adRevealTimer = null;
      $adModal.addClass("is-close-ready");
      $adClose.prop("disabled", false).attr("aria-hidden", "false");
      if (window.lucide && typeof lucide.createIcons === "function") {
        lucide.createIcons();
      }
    }, AD_CLOSE_REVEAL_MS);
  }

  function closeInterstitialAdAndShowResult() {
    if (!$adModal.hasClass("is-close-ready")) {
      return;
    }
    var next = pendingAfterAd;
    if (next === null) {
      return;
    }
    pendingAfterAd = null;
    clearAdRevealTimer();
    $adModal.removeClass("is-open is-close-ready").addClass("hidden");
    $adModal.attr("aria-hidden", "true");
    $adClose.prop("disabled", true).attr("aria-hidden", "true");
    openDonationModal(next);
  }

  function resetDonationUi() {
    clearDonationProcessTimer();
    $donationModal.removeClass("is-thanks");
    donationSubmitBusy = false;
    $("#donation-submit-btn").prop("disabled", false).text(t("donate.submit"));
    $(".donation-amt-btn").removeClass("is-selected");
    $(".donation-amt-btn").first().addClass("is-selected");
  }

  function openDonationModal(isAdult) {
    pendingDonationIsAdult = isAdult;
    resetDonationUi();
    $donationModal.removeClass("hidden").addClass("is-open");
    $donationModal.attr("aria-hidden", "false");
    $("body").css("overflow", "hidden");
    if (window.lucide && typeof lucide.createIcons === "function") {
      lucide.createIcons();
    }
  }

  function closeDonationModalAndShowResult() {
    clearDonationProcessTimer();
    var next = pendingDonationIsAdult;
    pendingDonationIsAdult = null;
    donationSubmitBusy = false;
    resetDonationUi();
    $donationModal.removeClass("is-open is-thanks").addClass("hidden");
    $donationModal.attr("aria-hidden", "true");
    $("body").css("overflow", "");
    if (next !== null && next !== undefined) {
      openModal(next);
    }
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
      openInterstitialAd(next);
    }, CAPTCHA_PROCESS_MS);
  }

  function openCookieModal(isAdult) {
    pendingIsAdult = isAdult;
    $cookieModal.removeClass("hidden").addClass("is-open");
    $cookieModal.attr("aria-hidden", "false");
    if (!$modal.hasClass("is-open") && !$captchaModal.hasClass("is-open") && !$adModal.hasClass("is-open") && !$donationModal.hasClass("is-open")) {
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
    if (!$modal.hasClass("is-open") && !$captchaModal.hasClass("is-open") && !$adModal.hasClass("is-open") && !$donationModal.hasClass("is-open")) {
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

  $("#lang-toggle").on("click", ".lang-btn", function () {
    setLang($(this).attr("data-lang"));
  });

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

  $adClose.on("click", function () {
    closeInterstitialAdAndShowResult();
  });

  $("#donation-skip-btn, #donation-close-skip").on("click", function () {
    if (!$donationModal.hasClass("is-open")) {
      return;
    }
    closeDonationModalAndShowResult();
  });

  $(document).on("click", ".donation-amt-btn", function () {
    $(".donation-amt-btn").removeClass("is-selected");
    $(this).addClass("is-selected");
  });

  $("#donation-submit-btn").on("click", function () {
    if (donationSubmitBusy || $donationModal.hasClass("is-thanks") || !$donationModal.hasClass("is-open")) {
      return;
    }
    donationSubmitBusy = true;
    var $btn = $(this);
    $btn.prop("disabled", true).text(t("donate.processing"));
    clearDonationProcessTimer();
    donationProcessTimer = setTimeout(function () {
      donationProcessTimer = null;
      donationSubmitBusy = false;
      if (!$donationModal.hasClass("is-open")) {
        return;
      }
      $btn.prop("disabled", false).text(t("donate.submit"));
      $donationModal.addClass("is-thanks");
      if (window.lucide && typeof lucide.createIcons === "function") {
        lucide.createIcons();
      }
    }, 1600);
  });

  $("#donation-thanks-continue").on("click", function () {
    closeDonationModalAndShowResult();
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
    if ($adModal.hasClass("is-open")) {
      if ($adModal.hasClass("is-close-ready")) {
        closeInterstitialAdAndShowResult();
      }
      return;
    }
    if ($donationModal.hasClass("is-open")) {
      closeDonationModalAndShowResult();
      return;
    }
    if ($modal.hasClass("is-open")) {
      closeModal();
    }
  });

  applyLang();

  if (window.lucide && typeof lucide.createIcons === "function") {
    lucide.createIcons();
  }
})(jQuery);
