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

  root.querySelectorAll("[data-bc-card]").forEach(function (card) {
    var front = card.querySelector(".bc-card__front");
    var back = card.querySelector(".bc-card__back");
    var toggles = card.querySelectorAll("[data-bc-flip]");
    if (!front || !back || toggles.length < 2) return;

    function setFlipped(flipped, moveFocus) {
      card.classList.toggle("is-flipped", flipped);
      front.inert = flipped;
      back.inert = !flipped;
      toggles[0].setAttribute("aria-expanded", String(flipped));
      if (moveFocus) (flipped ? toggles[1] : toggles[0]).focus({ preventScroll: true });
    }

    setFlipped(false);
    toggles.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        setFlipped(!card.classList.contains("is-flipped"), true);
      });
    });
    front.addEventListener("click", function (e) {
      if (!e.target.closest("a, button")) setFlipped(true, false);
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && card.classList.contains("is-flipped")) setFlipped(false, true);
    });
  });

  (function initMotion() {
    var gsap = window.gsap;
    var ST = window.ScrollTrigger;
    if (!gsap || !ST || reduceMotion) return;

    gsap.registerPlugin(ST);
    if (window.SplitText) gsap.registerPlugin(window.SplitText);
    root.classList.add("bc-motion");

    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var hero = root.querySelector("[data-bc-hero]");

    if (fine && window.Lenis) {
      var lenis = new window.Lenis({ duration: 1.15, anchors: { offset: -88 } });
      document.documentElement.style.scrollBehavior = "auto";
      lenis.on("scroll", ST.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

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
                yPercent: 115,
                duration: isHero ? 1.15 : 0.9,
                ease: "power4.out",
                stagger: 0.09,
                delay: isHero ? 0.25 : 0,
                scrollTrigger: isHero ? null : { trigger: el, start: "top 88%", once: true }
              });
            }
          });
        } catch (err) {
          el.classList.add("is-split");
        }
      });
    }

    if (window.SplitText) {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(revealSplits);
      } else {
        revealSplits();
      }
    } else {
      root.querySelectorAll("[data-bc-split]").forEach(function (el) { el.classList.add("is-split"); });
    }

    function draw(selector, options) {
      var paths = root.querySelectorAll(selector);
      paths.forEach(function (p) {
        var len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.to(paths, Object.assign({ strokeDashoffset: 0, ease: "power2.inOut" }, options));
    }

    draw("[data-bc-draw] path", { duration: 2.6, stagger: 0.07, delay: 0.1 });
    draw(".bc-plank__grain path", { duration: 1.8, stagger: 0.06, delay: 0.7 });

    var visual = root.querySelector("[data-bc-tilt]");
    var intro = gsap.timeline({ delay: 0.2 });
    if (visual) {
      intro.from(visual, { scale: 0.86, autoAlpha: 0, duration: 1.3, ease: "expo.out" }, 0.1);
      intro.fromTo(".bc-plank__mark", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power3.inOut", clearProps: "clipPath" }, 0.7);
      intro.from(".bc-seal", { scale: 0, rotation: -120, duration: 1, ease: "back.out(1.7)" }, 1.1);
    }
    intro.from(".bc-hero .bc-eyebrow, .bc-hero .bc-lead, .bc-hero__actions, .bc-hero__hours", {
      y: 24, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.1
    }, 0.55);

    if (visual && hero) {
      if (fine) {
        gsap.set(visual, { transformPerspective: 900 });
        var rotX = gsap.quickTo(visual, "rotationX", { duration: 0.9, ease: "power3" });
        var rotY = gsap.quickTo(visual, "rotationY", { duration: 0.9, ease: "power3" });
        hero.addEventListener("pointermove", function (e) {
          var r = visual.getBoundingClientRect();
          rotY(((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 26);
          rotX(-((e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 20);
        });
        hero.addEventListener("pointerleave", function () { rotX(0); rotY(0); });
      }
      gsap.to(visual, {
        yPercent: -14,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
      });
    }

    var ticker = root.querySelector("[data-bc-ticker]");
    var tickerAnim = ticker && ticker.getAnimations ? ticker.getAnimations()[0] : null;
    if (tickerAnim) {
      ST.create({
        trigger: ticker,
        start: "top bottom",
        end: "bottom top",
        onUpdate: function (self) {
          var velocity = self.getVelocity();
          if (Math.abs(velocity) < 30) return;
          var boost = Math.min(Math.abs(velocity) / 250, 7);
          tickerAnim.playbackRate = (velocity > 0 ? 1 : -1) * (1 + boost);
          gsap.to(tickerAnim, { playbackRate: 1, duration: 1, ease: "power2.out", overwrite: true });
        }
      });
    }

    var list = root.querySelector("[data-bc-line]");
    var hangers = root.querySelectorAll(".bc-hanger");
    if (list && hangers.length) {
      hangers.forEach(function (h) { h.classList.remove("bc-reveal"); });
      gsap.from(hangers, {
        y: -70,
        rotation: function (i) { return i % 2 ? 7 : -7; },
        autoAlpha: 0,
        duration: 1.7,
        ease: "elastic.out(1, 0.45)",
        stagger: 0.14,
        clearProps: "transform",
        scrollTrigger: { trigger: list, start: "top 82%", once: true },
        onComplete: function () { if (fine) startSwing(); }
      });
    }

    function startSwing() {
      var active = false;
      var states = Array.prototype.map.call(hangers, function (h, i) {
        var s = { el: h, angle: 0, speed: 0, phase: i * 1.7 };
        h.addEventListener("pointermove", function (e) {
          s.speed = Math.max(-90, Math.min(90, s.speed + e.movementX * 0.9));
        });
        return s;
      });
      ST.create({ trigger: list, start: "top bottom", end: "bottom top", onToggle: function (self) { active = self.isActive; } });
      gsap.ticker.add(function (time, delta) {
        if (!active) return;
        var dt = Math.min(delta, 50) / 1000;
        states.forEach(function (s) {
          var target = Math.sin(time * 0.9 + s.phase) * 0.9;
          s.speed += (-38 * (s.angle - target) - 3.2 * s.speed) * dt;
          s.angle += s.speed * dt;
          gsap.set(s.el, { rotation: s.angle });
        });
      });
    }

    root.querySelectorAll("[data-bc-count]").forEach(function (el) {
      var m = el.textContent.trim().match(/^(\d+)(.*)$/);
      if (!m) return;
      var target = Number(m[1]);
      var suffix = m[2];
      var counter = { value: 0 };
      gsap.to(counter, {
        value: target,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onStart: function () { el.textContent = "0" + suffix; },
        onUpdate: function () { el.textContent = Math.round(counter.value) + suffix; }
      });
    });

    var dark = root.querySelector("[data-bc-dark]");
    if (dark) {
      gsap.fromTo(dark,
        { clipPath: "inset(0% 5% 0% 5% round 48px)" },
        { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: dark, start: "top 95%", end: "top 25%", scrub: true } }
      );
    }

    var progress = root.querySelector("[data-bc-progress]");
    if (progress) {
      gsap.fromTo(progress, { scaleX: 0 }, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: ".bc-steps", start: "top 80%", end: "bottom 65%", scrub: true }
      });
    }

    var contactCard = root.querySelector(".bc-contact-card");
    if (contactCard) {
      gsap.fromTo(contactCard, { scale: 0.93 }, {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: contactCard, start: "top bottom", end: "top 45%", scrub: true }
      });
    }

    if (fine) {
      root.querySelectorAll(".bc-hero__actions .bc-btn--primary, .bc-header__call").forEach(function (btn) {
        var moveX = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3" });
        var moveY = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3" });
        btn.addEventListener("pointermove", function (e) {
          var r = btn.getBoundingClientRect();
          moveX((e.clientX - (r.left + r.width / 2)) * 0.25);
          moveY((e.clientY - (r.top + r.height / 2)) * 0.35);
        });
        btn.addEventListener("pointerleave", function () { moveX(0); moveY(0); });
      });
    }

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
