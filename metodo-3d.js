// Seção "O método": objeto 3D que muda de forma conforme o scroll (Three.js)
(function () {
  var section = document.querySelector('.metodo__scroll');
  var canvas = document.getElementById('metodo-3d');
  var steps = document.querySelectorAll('.step');
  var counter = document.querySelector('.metodo__counter b');
  var bar = document.querySelector('.metodo__progress span');
  if (!section || !canvas) return;

  var progress = 0;
  var active = 0;

  function readScroll() {
    var r = section.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    progress = Math.min(1, Math.max(0, -r.top / (total || 1)));
    var idx = Math.min(steps.length - 1, Math.floor(progress * steps.length));
    if (idx !== active) {
      steps.forEach(function (s) { s.classList.remove('was-active'); });
      steps[active].classList.remove('is-active');
      if (idx > active) steps[active].classList.add('was-active');
      steps[idx].classList.add('is-active');
      active = idx;
      if (counter) counter.textContent = '0' + (idx + 1);
    }
    if (bar) bar.style.transform = 'scaleY(' + progress + ')';
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  // Sem Three.js (CDN fora do ar): as etapas continuam funcionando sem o 3D
  if (!window.THREE) { canvas.style.display = 'none'; return; }

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  var key = new THREE.PointLight(0xff4b14, 2.2, 30);
  key.position.set(4, 5, 6);
  scene.add(key);
  var rim = new THREE.PointLight(0xffffff, 0.9, 30);
  rim.position.set(-6, -2, 4);
  scene.add(rim);

  var black = new THREE.MeshStandardMaterial({ color: 0x0d0a0a, metalness: 0.85, roughness: 0.25 });
  var red = new THREE.MeshStandardMaterial({ color: 0xe8381a, metalness: 0.4, roughness: 0.3, emissive: 0x5a0b07 });

  // 01 Posicionamento: alvo em anéis concêntricos
  var target = new THREE.Group();
  [2.2, 1.55, 0.9].forEach(function (rad, i) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.09 + i * 0.02, 32, 160), i === 1 ? red : black);
    ring.userData.spin = (i % 2 ? -1 : 1) * (0.3 + i * 0.15);
    target.add(ring);
  });
  target.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 48), red));

  // 02 Narrativa: diamante lapidado (o valor que a história revela)
  var narrative = new THREE.Group();
  var gemMat = new THREE.MeshStandardMaterial({ color: 0x1a0d0c, metalness: 0.9, roughness: 0.15, flatShading: true });
  var gem = new THREE.Group();
  var crown = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.6, 0.6, 10, 1), gemMat);
  crown.position.y = 0.3;
  var pavilion = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.9, 10, 1), gemMat);
  pavilion.rotation.x = Math.PI;
  pavilion.position.y = -0.95;
  gem.add(crown, pavilion);
  var edgeMat = new THREE.LineBasicMaterial({ color: 0xe8381a, transparent: true, opacity: 0.9 });
  [crown, pavilion].forEach(function (m) {
    var e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeMat);
    e.position.copy(m.position); e.rotation.copy(m.rotation);
    gem.add(e);
  });
  narrative.add(gem);
  // brilhos que orbitam e piscam ao redor do diamante
  var sparkles = [];
  for (var k = 0; k < 6; k++) {
    var sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), red);
    sp.userData = { a: k / 6 * Math.PI * 2, r: 2.3 + (k % 2) * 0.35, y: (k % 3 - 1) * 0.6 };
    narrative.add(sp);
    sparkles.push(sp);
  }
  var halo = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.02, 16, 200), red);
  halo.rotation.x = Math.PI / 2;
  narrative.add(halo);

  // 03 Presença e consistência: espiral de barras que crescem
  var growth = new THREE.Group();
  for (var i = 0; i < 14; i++) {
    var h = 0.3 + i * 0.22;
    var b = new THREE.Mesh(new THREE.BoxGeometry(0.32, h, 0.32), i % 3 === 2 ? red : black);
    var a = i * 0.5;
    b.position.set(Math.cos(a) * 1.8, h / 2 - 1.8, Math.sin(a) * 1.8);
    growth.add(b);
  }

  // Poeira de partículas ao fundo
  var pts = new THREE.BufferGeometry();
  var arr = new Float32Array(300 * 3);
  for (var p = 0; p < arr.length; p++) arr[p] = (Math.random() - 0.5) * 14;
  pts.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  var dust = new THREE.Points(pts, new THREE.PointsMaterial({ color: 0xff6a3d, size: 0.03, transparent: true, opacity: 0.6 }));
  scene.add(dust);

  var shapes = [target, narrative, growth];
  shapes.forEach(function (g) { scene.add(g); });

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  var smooth = 0;
  var clock = new THREE.Clock();
  function tick() {
    var t = clock.getElapsedTime();
    smooth += (progress - smooth) * 0.08;
    var pos = smooth * (shapes.length - 1); // 0 → 2

    shapes.forEach(function (g, i) {
      var w = Math.max(0, 1 - Math.abs(pos - i)); // peso de cada forma
      var s = 0.001 + Math.pow(w, 1.5);
      g.scale.setScalar(s);
      g.visible = w > 0.01;
      g.rotation.y = t * 0.25 + smooth * Math.PI * 2;
      g.rotation.x = 0.35 + Math.sin(t * 0.4) * 0.1 + (pos - i) * 0.8;
    });
    target.children.forEach(function (c) { if (c.userData.spin) c.rotation.x = t * c.userData.spin; });
    gem.rotation.y = t * 0.6;
    gem.position.y = Math.sin(t * 1.2) * 0.15;
    edgeMat.opacity = 0.55 + Math.sin(t * 2.4) * 0.35;
    sparkles.forEach(function (sp, k) {
      var a = sp.userData.a + t * 0.5;
      sp.position.set(Math.cos(a) * sp.userData.r, sp.userData.y + Math.sin(t * 1.5 + k) * 0.2, Math.sin(a) * sp.userData.r);
      sp.rotation.y = t * 3;
      sp.scale.setScalar(0.6 + Math.max(0, Math.sin(t * 2 + k * 1.3)) * 1.2);
    });
    dust.rotation.y = t * 0.02 + smooth;
    key.position.x = 4 + Math.sin(t * 0.6) * 2;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
})();
