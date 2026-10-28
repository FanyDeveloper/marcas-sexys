// Preloader, marcas empilhadas com scroll travado e animações de entrada
(function () {

  // SMOOTH SCROLL (Lenis): rolagem suave, travada enquanto o preloader está na tela
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.2, smoothWheel: true, anchors: true });
    lenis.stop();
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(performance.now());
  }

  // PRELOADER: contador 0 → 100 que acompanha o carregamento, depois a cortina sobe
  var pre = document.querySelector('.preloader');
  if (pre) {
    var count = pre.querySelector('.preloader__count');
    var line = pre.querySelector('.preloader__line span');
    var shown = 0, loaded = false, start = performance.now();
    var MIN = 1800;
    window.addEventListener('load', function () { loaded = true; });
    (function step(now) {
      var byTime = Math.min(1, (now - start) / MIN);
      var goal = loaded ? byTime : Math.min(byTime, 0.9);
      shown += (goal - shown) * 0.12;
      if (goal === 1 && shown > 0.995) shown = 1;
      count.textContent = Math.round(shown * 100);
      line.style.transform = 'scaleX(' + shown + ')';
      if (shown < 1) return requestAnimationFrame(step);
      pre.classList.add('is-done');
      document.body.classList.remove('is-loading');
      if (lenis) lenis.start();
      setTimeout(function () { pre.remove(); }, 1400);
    })(start);
  }

  // FADE-IN: elementos .reveal surgem ao entrar na tela
  var reveals = document.querySelectorAll('.reveal, .footer');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.2 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // MARCAS: a seção trava e cada card sobe por cima do anterior
  var pin = document.querySelector('.traj__pin');
  var rows = document.querySelectorAll('.brand-row');
  if (!pin || !rows.length) return;
  var desktop = matchMedia('(min-width: 1001px)');
  var n = rows.length;

  function update() {
    if (!desktop.matches) {
      rows.forEach(function (r) { r.style.transform = r.style.filter = ''; });
      return;
    }
    var r = pin.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / (total || 1)) * 1.12); // folga no fim
    var pos = p * (n - 1); // 0 → 3
    rows.forEach(function (row, i) {
      var enter = Math.min(1, Math.max(0, pos - (i - 1)));     // 0 = fora, 1 = no lugar
      var depth = Math.min(n - 1 - i, Math.max(0, pos - i));   // quantos cards estão por cima
      var y = i === 0 ? 0 : (1 - easeOut(enter)) * 115;
      var scale = 1 - depth * 0.045;
      row.style.transform = 'translateY(' + y + '%) scale(' + scale + ')';
      row.style.filter = 'brightness(' + (1 - Math.min(1, depth) * 0.5) + ')';
    });
  }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
