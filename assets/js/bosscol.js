(function () {
  "use strict";

  var root = document.querySelector(".bc-root");
  if (!root) return;

  var config = window.BOSSCOL_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.classList.add("bc-js");

  var analytics = (function () {
    var id = String(config.metrikaId || "");
    var enabled = /^\d+$/.test(id);
    var lastSent = {};

    if (enabled && config.loadMetrika !== false && typeof window.ym !== "function") {
      (function (m, e, t, r, i, k, a) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
        m[i].l = 1 * new Date();
        k = e.createElement(t); a = e.getElementsByTagName(t)[0];
        k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
      })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
      window.ym(Number(id), "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
    }

    function track(goal, params) {
      var key = goal + "|" + JSON.stringify(params || {});
      var now = Date.now();
      if (lastSent[key] && now - lastSent[key] < 1500) return;
      lastSent[key] = now;

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: goal, params: params || {} });

      if (enabled && typeof window.ym === "function") {
        window.ym(Number(id), "reachGoal", goal, params || {});
      }
    }

    return { track: track, enabled: enabled };
  })();

  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("a");
    if (!link || !root.contains(link)) return;

    var href = link.getAttribute("href") || "";
    var card = link.closest("[data-product]");
    var product = card ? card.getAttribute("data-product") : undefined;

    if (href.indexOf("tel:") === 0) {
      var params = { place: link.getAttribute("data-bc-place") || "other" };
      if (product) params.product = product;
      analytics.track("phone_click", params);
      if (product) analytics.track("product_interest", { product: product });
    } else if (link.hasAttribute("data-bc-doc")) {
      analytics.track("tds_download", { doc: link.getAttribute("data-bc-doc") });
    }
  });

  if (config.privacyUrl) {
    root.querySelectorAll("[data-bc-privacy-link]").forEach(function (a) {
      a.setAttribute("href", config.privacyUrl);
    });
  }

  var header = root.querySelector("[data-bc-header]");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  var burger = root.querySelector("[data-bc-burger]");
  var nav = root.querySelector("[data-bc-nav]");

  function setMenu(open, returnFocus) {
    if (!burger || !nav) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.querySelector(".bc-visually-hidden").textContent = open ? "Закрыть меню" : "Меню";
    nav.classList.toggle("is-open", open);
    if (!open && returnFocus) burger.focus();
  }

  if (burger && nav) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) setMenu(false, true);
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !burger.contains(e.target)) setMenu(false);
    });
    window.matchMedia("(min-width: 1080px)").addEventListener("change", function () { setMenu(false); });
  }

  if ("IntersectionObserver" in window) {
    var links = {};
    root.querySelectorAll(".bc-nav__link").forEach(function (a) {
      links[a.getAttribute("href").slice(1)] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = links[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("is-active"); });
          link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  var reveals = root.querySelectorAll(".bc-reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    reveals.forEach(function (el) {
      var siblings = el.parentElement ? el.parentElement.querySelectorAll(":scope > .bc-reveal") : [];
      var index = Array.prototype.indexOf.call(siblings, el);
      if (index > 0) el.style.setProperty("--bc-delay", Math.min(index, 4) * 0.08 + "s");
    });
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { revealer.observe(el); });
  }

  var callbar = root.querySelector("[data-bc-callbar]");
  var hero = root.querySelector("[data-bc-hero]");
  var contacts = document.getElementById("contacts");
  if (callbar && hero && "IntersectionObserver" in window) {
    var heroVisible = true;
    var contactsVisible = false;
    var updateBar = function () { callbar.classList.toggle("is-visible", !heroVisible && !contactsVisible); };
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting; updateBar();
    }).observe(hero);
    if (contacts) {
      new IntersectionObserver(function (entries) {
        contactsVisible = entries[0].isIntersecting; updateBar();
      }).observe(contacts);
    }
  }

  var filter = root.querySelector("[data-bc-filter]");
  var grid = root.querySelector("[data-bc-grid]");
  if (filter && grid) {
    var products = Array.prototype.slice.call(grid.querySelectorAll("[data-cat]"));
    var buttons = Array.prototype.slice.call(filter.querySelectorAll("[data-bc-filter-value]"));
    buttons.forEach(function (btn) {
      var value = btn.getAttribute("data-bc-filter-value");
      var count = btn.querySelector("[data-bc-count-for]");
      if (count) {
        count.textContent = String(value === "all" ? products.length : products.filter(function (p) { return p.getAttribute("data-cat") === value; }).length);
      }
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        var shown = [];
        products.forEach(function (p) {
          var visible = value === "all" || p.getAttribute("data-cat") === value;
          p.hidden = !visible;
          if (visible) shown.push(p);
        });
        if (window.gsap && !reduceMotion) {
          window.gsap.fromTo(shown, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.04, clearProps: "opacity,transform" });
        }
      });
    });
  }

  (function initMotion() {
    var gsap = window.gsap;
    var ST = window.ScrollTrigger;
    if (!gsap || !ST || reduceMotion) return;

    gsap.registerPlugin(ST);
    if (window.SplitText) gsap.registerPlugin(window.SplitText);
    root.classList.add("bc-motion");

    function revealSplits() {
      root.querySelectorAll("[data-bc-split]").forEach(function (el) {
        var isHero = el.id === "bc-hero-title";
        try {
          window.SplitText.create(el, {
            type: "lines",
            mask: "lines",
            linesClass: "bc-split-line",
            autoSplit: true,
            onSplit: function (self) {
              el.classList.add("is-split");
              return gsap.from(self.lines, {
                yPercent: 110,
                duration: isHero ? 1 : 0.8,
                ease: "power3.out",
                stagger: 0.08,
                delay: isHero ? 0.15 : 0,
                scrollTrigger: isHero ? null : { trigger: el, start: "top 90%", once: true }
              });
            }
          });
        } catch (err) {
          el.classList.add("is-split");
        }
      });
    }

    if (window.SplitText && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(revealSplits);
    } else if (window.SplitText) {
      revealSplits();
    } else {
      root.querySelectorAll("[data-bc-split]").forEach(function (el) { el.classList.add("is-split"); });
    }

    gsap.from("[data-bc-hero-item]", { y: 18, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, delay: 0.35, clearProps: "opacity,transform" });

    var layers = root.querySelectorAll("[data-bc-layer]");
    if (layers.length) {
      var assemble = gsap.timeline({ delay: 0.3 });
      assemble.from(Array.prototype.slice.call(layers).reverse(), {
        y: -60,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12
      });
      assemble.from(root.querySelectorAll("[data-bc-label]"), { opacity: 0, x: -10, duration: 0.5, ease: "power2.out", stagger: 0.08 }, "-=0.4");
    }

    root.querySelectorAll("[data-bc-count]").forEach(function (el) {
      var m = el.textContent.trim().match(/^(\d+)(.*)$/);
      if (!m) return;
      var target = Number(m[1]);
      var suffix = m[2];
      var counter = { value: 0 };
      gsap.to(counter, {
        value: target,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onStart: function () { el.textContent = "0" + suffix; },
        onUpdate: function () { el.textContent = Math.round(counter.value) + suffix; }
      });
    });

    window.addEventListener("load", function () { ST.refresh(); });
  })();

  var cookie = root.querySelector("[data-bc-cookie]");
  if (cookie) {
    var KEY = "bc-cookie-ok";
    var accepted = false;
    try { accepted = window.localStorage.getItem(KEY) === "1"; } catch (err) { }
    if (!accepted) cookie.hidden = false;
    cookie.querySelector("[data-bc-cookie-ok]").addEventListener("click", function () {
      cookie.hidden = true;
      try { window.localStorage.setItem(KEY, "1"); } catch (err) { }
    });
  }

  root.querySelectorAll("[data-bc-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
