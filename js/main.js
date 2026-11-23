/* Mar de Alcatrazes · scripts do site */

/* ===== 1. Livro com virada de página (PDF.js + StPageFlip) =====
   O PDF precisa estar na mesma pasta do index.html. */
(function () {
  var BOOK = "livro-mar-de-alcatrazes.pdf";
  var PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  var WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  var FLIP = "https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js";
  var reader = document.getElementById("reader"),
    ui = document.getElementById("bookui"),
    fb = document.getElementById("bookfb"),
    stage = document.getElementById("flip"),
    cnt = document.getElementById("cnt"),
    started = false;
  function fallback() {
    ui.hidden = true;
    fb.hidden = false;
  }
  function load(src) {
    return new Promise(function (ok, no) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = ok;
      s.onerror = no;
      document.head.appendChild(s);
    });
  }
  async function init() {
    if (started) return;
    started = true;
    try {
      await load(PDFJS);
      await load(FLIP);
      pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER;
      var pdf = await pdfjsLib.getDocument({ url: BOOK }).promise,
        n = pdf.numPages;
      var M = 21,
        p1 = await pdf.getPage(1),
        v1 = p1.getViewport({ scale: 1 }),
        ratio = (v1.height - 2 * M) / (v1.width - 2 * M);
      stage.innerHTML = "";
      var pages = [],
        done = {};
      for (var i = 0; i < n; i++) {
        var d = document.createElement("div");
        d.className = "pg" + (i === 0 || i === n - 1 ? " hard" : "");
        d.setAttribute("data-density", i === 0 || i === n - 1 ? "hard" : "soft");
        d.appendChild(document.createElement("canvas"));
        stage.appendChild(d);
        pages.push(d);
      }
      async function render(i) {
        if (i < 0 || i >= n || done[i]) return;
        done[i] = 1;
        var p = await pdf.getPage(i + 1),
          b = p.getViewport({ scale: 1 }),
          sc = 900 / (b.width - 2 * M),
          v = p.getViewport({ scale: sc }),
          t = document.createElement("canvas");
        t.width = v.width;
        t.height = v.height;
        await p.render({ canvasContext: t.getContext("2d"), viewport: v }).promise;
        var c = pages[i].firstChild,
          w = Math.round((b.width - 2 * M) * sc),
          h = Math.round((b.height - 2 * M) * sc);
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(t, M * sc, M * sc, w, h, 0, 0, w, h);
      }
      stage.style.setProperty("--r", ratio);
      var W = 500,
        H = Math.round(W * ratio);
      var pf = new St.PageFlip(stage, {
        width: W,
        height: H,
        size: "stretch",
        minWidth: 260,
        maxWidth: 1200,
        minHeight: Math.round(260 * ratio),
        maxHeight: Math.round(1200 * ratio),
        showCover: true,
        maxShadowOpacity: 0.4,
        mobileScrollSupport: false,
        flippingTime: 900,
        useMouseEvents: true,
        clickEventForward: true,
        swipeDistance: 20,
        showPageCorners: true,
        autoSize: true,
      });
      pf.loadFromHTML(pages);
      function sync() {
        var c = pf.getCurrentPageIndex();
        for (var k = c - 2; k <= c + 4; k++) render(k);
        cnt.textContent = c + 1 + " / " + n;
      }
      pf.on("flip", sync);
      sync();
      document.getElementById("prev").onclick = function () {
        pf.flipPrev();
      };
      document.getElementById("next").onclick = function () {
        pf.flipNext();
      };
      document.addEventListener("keydown", function (e) {
        var r = reader.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        if (e.key === "ArrowLeft") pf.flipPrev();
        if (e.key === "ArrowRight") pf.flipNext();
      });
      document.getElementById("fs").onclick = function () {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (reader.requestFullscreen) reader.requestFullscreen();
      };
    } catch (e) {
      console.error("Leitor do livro:", e);
      fallback();
    }
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (es, o) {
        if (es[0].isIntersecting) {
          o.disconnect();
          init();
        }
      },
      { rootMargin: "600px" },
    ).observe(reader);
  } else init();
})();
/* ===== 2. Filme: só carrega o vídeo (Bunny Stream) ao clicar ===== */
(function () {
  var b = document.getElementById("filmPlay"),
    p = document.getElementById("filmPlayer");
  if (!b) return;
  b.addEventListener("click", function () {
    var f = document.createElement("iframe");
    f.src = "https://player.mediadelivery.net/embed/818497/34ddc183-68b2-4f76-a110-600f718e801e?autoplay=true&preload=true&responsive=true";
    f.title = "Documentário Mar de Alcatrazes";
    f.allow = "accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    p.replaceChildren(f);
    f.focus();
  });
})();
/* ===== 3. Menu do celular ===== */
(function () {
  var b = document.getElementById("burger"),
    m = document.getElementById("menu"),
    nav = document.getElementById("nav");
  function set(o) {
    b.setAttribute("aria-expanded", o ? "true" : "false");
    b.setAttribute("aria-label", o ? "Fechar menu" : "Abrir menu");
    m.classList.toggle("open", o);
    document.documentElement.style.overflow = o ? "hidden" : "";
  }
  b.addEventListener("click", function () {
    set(b.getAttribute("aria-expanded") !== "true");
  });
  m.addEventListener("click", function (e) {
    if (e.target.closest("a")) set(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") set(false);
  });
  var mq = matchMedia("(min-width:861px)");
  if (mq.addEventListener)
    mq.addEventListener("change", function (e) {
      if (e.matches) set(false);
    });
})();

/* ===== 4. Textos aparecem ao rolar a página ===== */
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var sel = "main .eyebrow, main h2, main h3, main p, main .lead, main .quote, main .acts";
  var els = Array.prototype.filter.call(document.querySelectorAll(sel), function (el) {
    return !el.closest("#reader, .player, .bookfb, .film .player");
  });
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -4% 0px" },
  );
  els.forEach(function (el) {
    /* escalonamento: irmãos entram um depois do outro */
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) {
      return els.indexOf(c) > -1;
    });
    el.style.setProperty("--d", Math.min(sibs.indexOf(el) * 0.06, 0.24) + "s");
    el.classList.add("rv");
    io.observe(el);
  });
})();
