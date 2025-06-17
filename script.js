// Simulationsparameter
const g = 9.81;        // Schwerefeld der Erde
const rho = 1.225;     // Luftdichte
const Cd = 0.47;       // Luftwiderstandsbeiwert
const diameter = 0.10; // Durchmesser des Balls 10cm = 0.10 m

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/PI
const area = Math.PI * 0.05 ** 2; // Querschnittsfläche
const mass = 0.2;      // Masse des Balls 200g = 0.2 kg
const launchHeight = 2.5; // Abwurfhöhe in Metern

// Testwerte (Standardwerte)
let angleDeg  = 45; // Abwurfwinkel in Grad
let velocity = 20; // Abwurfgeschwindigkeit in m/s

// Variablen für die Eingabefelder
let angleInput, velocityInput, dragToggle;

// Ergebnisse für Tabelle
let trajectoryRows = [];
let optimalResult = null;

function setup() {
  const canvas = createCanvas(800, 400);
  canvas.parent('canvas-container');

  angleInput = document.getElementById('angleInput');
  velocityInput = document.getElementById('velocityInput');
  dragToggle = document.getElementById('dragToggle');

  angleInput.addEventListener('change', updateParams);
  velocityInput.addEventListener('change', updateParams);
  dragToggle.addEventListener('change', redraw);

  noLoop();
}

function updateParams() {
  let valAngle = Number(angleInput.value);
  if (valAngle < 5) valAngle = 5;
  if (valAngle > 89) valAngle = 89;
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

  // 1. Ohne Luftwiderstand (analytisch, blau) 
  const analytic = computeAnalyticTrajectory(angleDeg, velocity);
  drawPath(analytic.trajectory, color(30, 144, 255));

  // 2. Mit Luftwiderstand (Euler-Verfahren, rot/orange) 
  const { optimalAngle, maxRange, steps } = findOptimalAngleEuler(velocity);

  // Für die Tabelle
  trajectoryRows = [];

  // Alle 5 numerischen Trajektorien (zwei vor, optimal, zwei nach)
  const delta = 3; // Schrittweite in Grad
  let angles = [
    optimalAngle - 2 * delta,
    optimalAngle - delta,
    optimalAngle,
    optimalAngle + delta,
    optimalAngle + 2 * delta
  ];

  // Falls der gewählte Winkel NICHT in den 5, dann ersetzen wir den nahesten mit dem gewählten
  if (!angles.some(a => Math.abs(a - angleDeg) < 1e-3)) {
    let closest = angles.reduce((a, b) =>
      Math.abs(a - angleDeg) < Math.abs(b - angleDeg) ? a : b
    );
    angles[angles.indexOf(closest)] = angleDeg;
  }

  // Numerische Flüge berechnen und zeichnen
  let chosenIdx = -1, optimalIdx = -1;
  angles.forEach((a, i) => {
    const traj = computeNumericTrajectory(a, velocity);
    let col = (Math.abs(a - optimalAngle) < 1e-3)
      ? color(255, 0, 0)
      : (Math.abs(a - angleDeg) < 1e-3)
        ? color(0, 0, 255)
        : color(255, 140, 0);
    drawPath(traj.trajectory, col);

    if (Math.abs(a - angleDeg) < 1e-3) chosenIdx = i;
    if (Math.abs(a - optimalAngle) < 1e-3) optimalIdx = i;

    trajectoryRows.push({
      methode: 'Mit Luftwiderstand',
      v: velocity,
      alpha: a,
      reichweite: traj.range,
      isOptimal: Math.abs(a - optimalAngle) < 1e-3,
      isChosen: Math.abs(a - angleDeg) < 1e-3
    });
  });

  // Tabelle: ohne Luftwiderstand 
  trajectoryRows.unshift({
    methode: 'Ohne Luftwiderstand',
    v: velocity,
    alpha: angleDeg,
    reichweite: analytic.range,
    isOptimal: false,
    isChosen: false
  });

  // Zusammenfassungszeile oben speichern 
  optimalResult = {
    v: velocity,
    optimalAngle: optimalAngle,
    maxRange: maxRange
  };

  updateResultTable();
}

// ohne Luftwiderstand.

function computeAnalyticTrajectory(angle, v) {
  const rad = angle * Math.PI / 180;
  const v0x = v * Math.cos(rad);
  const v0y = v * Math.sin(rad);
  let traj = [];
  let maxRange = (v0x / g) * (v0y + Math.sqrt(v0y ** 2 + 2 * g * launchHeight));
  for (let t = 0; t <= 10; t += 0.02) {
    let x = v0x * t;
    let y = launchHeight + v0y * t - 0.5 * g * t * t;
    if (y < 0) break;
    traj.push({x, y});
  }
  return { trajectory: traj, range: maxRange };
}

/**
 * Numerische Lösung mit Luftwiderstand (Euler).
 */
function computeNumericTrajectory(angle, v) {
  const rad = angle * Math.PI / 180;
  const v0x = v * Math.cos(rad);
  const v0y = v * Math.sin(rad);
  let x = 0, y = launchHeight;
  let vx = v0x, vy = v0y;
  let dt = 0.01;
  let traj = [];
  while (y >= 0 && x < 2000) {
    traj.push({x, y});
    let speed = Math.sqrt(vx * vx + vy * vy);
    let Fd = 0.5 * rho * speed * speed * Cd * area;
    let Fdx = -Fd * (vx / speed);
    let Fdy = -Fd * (vy / speed);
    let ax = Fdx / mass;
    let ay = (Fdy - mass * g) / mass;
    vx += ax * dt;
    vy += ay * dt;
    x += vx * dt;
    y += vy * dt;
  }
  return { trajectory: traj, range: x };
}

/**
 * optimalen Winkel für maximale Reichweite (mit Luftwiderstand)
 * https://stackoverflow.com/questions/68731306/how-to-find-optimal-projectile-angle-with-air-resistance
 */
function findOptimalAngleEuler(v) {
  let maxRange = 0, optimalAngle = 45, steps = [];
  for (let a = 5; a <= 89; a += 1) {
    let result = computeNumericTrajectory(a, v);
    steps.push({angle: a, range: result.range});
    if (result.range > maxRange) {
      maxRange = result.range;
      optimalAngle = a;
    }
  }
  return { optimalAngle, maxRange, steps };
}

// auf Canvas zeichnen
function drawPath(trajectory, col) {
  stroke(col);
  noFill();
  beginShape();
  trajectory.forEach(({x, y}) => {
    // Skalierung (siehe: https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas)
    let maxRange = Math.max(...trajectory.map(p => p.x));
    let maxHeight = Math.max(...trajectory.map(p => p.y));
    let xScale = (width - 40) / (maxRange || 1);
    let yScale = (height - 40) / (maxHeight + 1e-6);
    let px = 20 + x * xScale;
    let py = height - 25 - y * yScale;
    vertex(px, py);
  });
  endShape();
}

/**
 * Ergebnistabelle aktualisieren
 * Methoden und Werte in Deutsch.
 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement
 */
function updateResultTable() {
  const summary = document.getElementById("summary-line");
  if (summary && optimalResult) {
    summary.textContent =
      `Optimaler Winkel für Geschwindigkeit ${optimalResult.v} [m/s] ist ` +
      `${optimalResult.optimalAngle.toFixed(1)}° mit einer Reichweite von ` +
      `${optimalResult.maxRange.toFixed(2)} [m].`;
  }

  const tbody = document.querySelector("#result-table tbody");
  if (!tbody) return;
  tbody.innerHTML = '';
  trajectoryRows.forEach(row => {
    let style = "";
    if (row.isOptimal) style = "color:red;font-weight:bold;";
    else if (row.isChosen) style = "color:blue;";
    tbody.innerHTML += `
      <tr style="${style}">
        <td>${row.methode}</td>
        <td>${row.v.toFixed(2)}</td>
        <td>${row.alpha.toFixed(1)}°</td>
        <td>${row.reichweite.toFixed(2)} m</td>
      </tr>
    `;
  });
}