let scene, camera, renderer, sun;
let planets = [];
let speedMultipliers = {};
let isPaused = false;
let darkMode = true;

const planetData = [
  { name: "Mercury", distance: 10, size: 0.5, color: 0xaaaaaa, speed: 0.04 },
  { name: "Venus", distance: 15, size: 0.7, color: 0xffcc66, speed: 0.015 },
  { name: "Earth", distance: 20, size: 1, color: 0x3399ff, speed: 0.01 },
  { name: "Mars", distance: 25, size: 0.9, color: 0xff3300, speed: 0.008 },
  { name: "Jupiter", distance: 32, size: 2, color: 0xff9966, speed: 0.005 },
  { name: "Saturn", distance: 40, size: 1.8, color: 0xffff99, speed: 0.003 },
  { name: "Uranus", distance: 47, size: 1.2, color: 0x66ccff, speed: 0.002 },
  { name: "Neptune", distance: 55, size: 1.1, color: 0x3333ff, speed: 0.0015 }
];

init();
animate();

function updateLabelColors(color) {
  planets.forEach((planet) => {
    const sprite = planet.children.find(child => child instanceof THREE.Sprite);
    if (sprite) {
      const canvas = sprite.material.map.image;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "bold 24px Arial";
      ctx.shadowColor = color === "#fff" ? "#000" : "#fff";
      ctx.shadowBlur = 6;
      ctx.fillStyle = color;
      ctx.fillText(planet.userData.name, 10, 40);
      sprite.material.map.needsUpdate = true;
    }
  });
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 30, 130);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.getElementById("container").appendChild(renderer.domElement);

  const light = new THREE.PointLight(0xffffff, 2, 500);
  light.position.set(0, 0, 0);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.2));

  const sunGeometry = new THREE.SphereGeometry(4, 64, 64);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  const glowMaterial = new THREE.SpriteMaterial({
    map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/lensflare/lensflare0.png'),
    color: 0xffff00,
    transparent: true,
    blending: THREE.AdditiveBlending
  });
  const glow = new THREE.Sprite(glowMaterial);
  glow.scale.set(30, 30, 1);
  sun.add(glow);

  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
  const starVertices = [];
  for (let i = 0; i < 9000; i++) {
    starVertices.push((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  planetData.forEach(data => {
    const orbitGeometry = new THREE.RingGeometry(data.distance - 0.05, data.distance + 0.05, 64);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);

    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: data.color, emissive: data.color, shininess: 10 });
    const planet = new THREE.Mesh(geometry, material);
    planet.userData = { ...data, angle: Math.random() * Math.PI * 2 };
    speedMultipliers[data.name] = 1;
    scene.add(planet);
    planets.push(planet);

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(data.name, 10, 40);
    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(labelMaterial);
    sprite.scale.set(8, 2.5, 1);
    sprite.position.y = data.size + 2;
    planet.add(sprite);

    const label = document.createElement("label");
    label.innerText = `${data.name}`;
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0.1;
    slider.max = 3;
    slider.step = 0.1;
    slider.value = 1;
    slider.className = "slider";
    slider.oninput = () => speedMultipliers[data.name] = parseFloat(slider.value);
    const wrapper = document.createElement("div");
    wrapper.className = "slider-wrapper";
    wrapper.appendChild(label);
    wrapper.appendChild(slider);
    document.getElementById("control-panel").appendChild(wrapper);
  });

  document.getElementById("pause-btn").onclick = () => {
    isPaused = !isPaused;
    document.getElementById("pause-btn").innerText = isPaused ? "▶️ Resume" : "⏸️ Pause";
  };

 document.getElementById("theme-toggle").onclick = () => {
  darkMode = !darkMode;
  scene.background = new THREE.Color(darkMode ? 0x000000 : 0xffffff);
  document.body.classList.toggle("light", !darkMode);
  updateLabelColors(darkMode ? "#fff" : "#000");

  // Update ring colors
  scene.traverse((child) => {
    if (child.isMesh && child.geometry.type === "RingGeometry") {
      child.material.color.set(darkMode ? 0xffffff : 0x222222); // dark ring for light mode
    }
  });

  const themeBtn = document.getElementById("theme-toggle");
  themeBtn.innerText = darkMode ? "🌃 Dark Mode" : "🌞 Light Mode";
  starMaterial.color.set(darkMode ? 0xffffff : 0x000000);
  
};


  document.getElementById("reset-camera").onclick = () => {
    camera.position.set(0, 30, 130);
    camera.lookAt(0, 0, 0);
  };

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.padding = "6px 10px";
  tooltip.style.background = "#111";
  tooltip.style.color = "#fff";
  tooltip.style.borderRadius = "6px";
  tooltip.style.fontSize = "13px";
  tooltip.style.display = "none";
  tooltip.style.pointerEvents = "none";
  tooltip.style.zIndex = 10;
  document.body.appendChild(tooltip);

  window.addEventListener("mousemove", e => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);
    if (intersects.length > 0) {
      tooltip.innerText = intersects[0].object.userData.name;
      tooltip.style.left = e.clientX + 15 + "px";
      tooltip.style.top = e.clientY + "px";
      tooltip.style.display = "block";
    } else {
      tooltip.style.display = "none";
    }
  });

  window.addEventListener("click", () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);
    if (intersects.length > 0) {
      const { x, y, z } = intersects[0].object.position;
      camera.position.set(x + 10, y + 5, z + 10);
      camera.lookAt(x, y, z);
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    planets.forEach(planet => {
      let { distance, speed, angle, name } = planet.userData;
      angle += speed * speedMultipliers[name];
      planet.position.x = distance * Math.cos(angle);
      planet.position.z = distance * Math.sin(angle);
      planet.userData.angle = angle;
      planet.rotation.y += 0.01;
    });
  }
  renderer.render(scene, camera);
}