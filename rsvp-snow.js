const header = document.querySelector('.rsvp-header');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function snowGust() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  const bounds = header.getBoundingClientRect();
  const width = window.innerWidth;
  const height = window.innerHeight;
  const ratio = Math.min(devicePixelRatio, 1.25);
  canvas.className = 'rsvp-snow';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.scale(ratio, ratio);
  document.body.append(canvas);

  const sourceX = bounds.left + bounds.width * .87;
  const sourceY = bounds.top + bounds.height * .27;
  const snow = Array.from({ length: width < 540 ? 55 : 90 }, () => ({
    start: Math.random() * 1050,
    x: Math.random() * 48 - 24,
    y: Math.random() * 30 - 15,
    speed: .24 + Math.random() * .5,
    drift: Math.random() * 1.18 - .57,
    size: .65 + Math.random() * 2.2,
    phase: Math.random() * Math.PI * 2,
  }));

  const began = performance.now();
  function render(now) {
    const elapsed = now - began;
    if (elapsed > 3650 || reducedMotion.matches) {
      canvas.remove();
      return;
    }

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#f7fbff';
    for (const flake of snow) {
      const age = elapsed - flake.start;
      if (age < 0 || age > 2550) continue;
      const travel = age / 2600;
      const x = sourceX + flake.x - age * flake.speed * width / 820
        + Math.sin(flake.phase + age / 260) * 25 * travel;
      const y = sourceY + flake.y + age * flake.drift * height / 940 + Math.sin(travel * 3) * 75;
      context.globalAlpha = Math.min(1, age / 155, (2550 - age) / 850) * .8;
      context.beginPath();
      context.ellipse(x, y, flake.size * (1 + travel * 1.9), flake.size, -.34, 0, Math.PI * 2);
      context.fill();
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

if (header && 'IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting || reducedMotion.matches) return;
    observer.disconnect();
    snowGust();
  }, { threshold: .55 });
  observer.observe(header);
}
