/**
 * ich möchte noch hinzufügen
 * zwei Winkel vor dem opt Winkel,
 * und zwei Winkel nach dem opt Winkel...
**/

// Simulationsparameter
const g = 9.81;        // Schwerefeld der Erde
const rho = 1.225;     // Luftdichte
const Cd = 0.47;       // Luftwiderstandsbeiwert für Kugel
const diameter = 0.10; // Durchmesser des Balls in m (10 cm)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/PI
const area = Math.PI * 0.05 ** 2; // Querschnittsfläche
const mass = 0.2;      // Masse des Balls in kg
const launchHeight = 2.5; // Abwurfhöhe in m

// https://en.wikipedia.org/wiki/Projectile_motion
let angleDeg  = 45; // Abwurfwinkel in Grad
let velocity = 20;  // Abwurfgeschwindigkeit in m/s

// Variablen für UI
let angleInput, velocityInput, dragToggle;

function setup() {
  // p5.js Canvas initialisieren
  // https://p5js.org/
  const canvas = createCanvas(800, 400);
  canvas.parent('canvas-container');

  // UI-Elemente
  angleInput = document.getElementById('angleInput');
  velocityInput = document.getElementById('velocityInput');
  dragToggle = document.getElementById('dragToggle');

  // Eventlistener
  angleInput.addEventListener('change', updateParams);
  velocityInput.addEventListener('change', updateParams);
  dragToggle.addEventListener('change', redraw);

  noLoop();
}

function updateParams() {
  let valAngle = Number(angleInput.value);
  if (valAngle < 5) valAngle = 5;
  if (valAngle > 89) valAngle = 89; // https://stackoverflow.com/q/23104582
  angleDeg = valAngle;
  angleInput.value = valAngle;

  let valVel = Number(velocityInput.value);
  if (valVel < 5) valVel = 5;
  if (valVel > 50) valVel = 50;
  velocity = valVel;
  velocityInput.value = valVel;

  redraw();
}

function draw() {
  background(180);
  stroke(150);
  line(0, height - 25, width, height - 25);

  drawProjectileTrajectory(false); // Ohne Luftwiderstand (blau)
  if (dragToggle.checked) drawProjectileTrajectory(true); // Mit Luftwiderstand (rot)

  updateResultTable(); // Ergebnisse aktualisieren
}

/**
 * Projektilbahn zeichnen (analytisch oder numerisch)
 * Links:
 *   - https://en.wikipedia.org/wiki/Projectile_motion (analytisch)
 *   - https://en.wikipedia.org/wiki/Euler_method (numerisch)
 *   - https://stackoverflow.com/q/23104582
 */
function drawProjectileTrajectory(withDrag) {
  const rad = angleDeg * Math.PI / 180;
  const v0x = velocity * Math.cos(rad);
  const v0y = velocity * Math.sin(rad);

  // Scaling an image to fit on canvas
  let maxRange = (v0x / g) * (v0y + Math.sqrt(v0y ** 2 + 2 * g * launchHeight));
  if (!isFinite(maxRange) || maxRange < 0.5) maxRange = 0.5;
  let xScale = (width - 40) / maxRange;
  let yScale = (height - 40) / (launchHeight + (v0y ** 2) / (2 * g));

  // Ergebnis-Variablen
  let range = 0;
  let maxHeight = launchHeight;
  let flightTime = 0;

  if (!withDrag) {
    // Analytisch: https://en.wikipedia.org/wiki/Projectile_motion
    stroke(30, 144, 255); // Blau
    noFill();
    beginShape();
    for (let t = 0; t <= 10; t += 0.02) {
      let x = v0x * t;
      let y = launchHeight + v0y * t - 0.5 * g * t * t;
      if (y < 0) {
        flightTime = t;
        break;
      }
      if (y > maxHeight) maxHeight = y;
      range = x;
      let px = 20 + x * xScale;
      let py = height - 25 - y * yScale;
      vertex(px, py);
    }
    endShape();
    window.analyticResults = { range, height: maxHeight, time: flightTime };
  } else {
    // https://en.wikipedia.org/wiki/Euler_method (Euler-Verfahren)
    stroke(220, 50, 50); // Rot
    noFill();
    let dt = 0.01;
    let x = 0, y = launchHeight;
    let vx = v0x, vy = v0y;
    maxHeight = y;
    let t = 0;
    beginShape();
    while (y >= 0 && x < maxRange * 1.5) {
      let px = 20 + x * xScale;
      let py = height - 25 - y * yScale;
      vertex(px, py);
      let v = Math.sqrt(vx * vx + vy * vy);
      let Fd = 0.5 * rho * v * v * Cd * area;
      let Fdx = -Fd * (vx / v);
      let Fdy = -Fd * (vy / v);
      let ax = Fdx / mass;
      let ay = (Fdy - mass * g) / mass;
      vx += ax * dt;
      vy += ay * dt;
      x += vx * dt;
      y += vy * dt;
      if (y > maxHeight) maxHeight = y;
      t += dt;
    }
    endShape();
    window.numericResults = { range: x, height: maxHeight, time: t };
  }
}

// Ergebnisse unter dem Canvas anzeigen
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement
// https://stackoverflow.com/questions/39552186/how-to-create-a-html-table-with-javascript
function updateResultTable() {
  const tbody = document.querySelector("#result-table tbody");
  if (!tbody) return;
  tbody.innerHTML = `
    <tr style="color: blue">
      <td>Analytisch (ohne Luftwiderstand)</td>
      <td>${window.analyticResults?.range?.toFixed(2) || '-'}</td>
      <td>${window.analyticResults?.height?.toFixed(2) || '-'}</td>
      <td>${window.analyticResults?.time?.toFixed(2) || '-'}</td>
    </tr>
    <tr style="color: red">
      <td>Numerisch (mit Luftwiderstand)</td>
      <td>${window.numericResults?.range?.toFixed(2) || '-'}</td>
      <td>${window.numericResults?.height?.toFixed(2) || '-'}</td>
      <td>${window.numericResults?.time?.toFixed(2) || '-'}</td>
    </tr>
  `;
}
