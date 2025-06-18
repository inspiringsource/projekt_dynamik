// Simulationsparameter
const g = 9.81;        // Schwerefeld der Erde
const rho = 1.225;     // Luftdichte (kg/m³)
const Cd = 0.47;       // Luftwiderstandsbeiwert
const diameter = 0.10; // Durchmesser des Balls 10cm = 0.10 m

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/PI
const area = Math.PI * 0.05 ** 2; // Querschnittsfläche (r=0.05m)
const mass = 0.2;      // Masse des Balls 200g = 0.2 kg
const launchHeight = 2.5; // Abwurfhöhe in Metern

// Standardwerte
let angleDeg  = 45; // Abwurfwinkel in Grad
let velocity = 20;  // Abwurfgeschwindigkeit in m/s

// Variablen für die Eingabefelder
let angleInput, velocityInput, dragToggle;

// Ergebnisse für Tabelle und Zusammenfassung
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

  // ---- Alle Trajektorien für gemeinsame Skalierung berechnen ----
  // 1. Analytisch (ohne Luftwiderstand, blau)
  const analytic = computeAnalyticTrajectory(angleDeg, velocity);

  // 2. Numerisch (mit Luftwiderstand, verschiedene Winkel)
  const { optimalAngle, maxRange: optMaxRange } = findOptimalAngleEuler(velocity);
  const delta = 3; // Schrittweite in Grad (zwei darunter, optimal, zwei darüber)
  let angles = [
    // optimalAngle - 2 * delta,
    optimalAngle - delta,
    optimalAngle,
    optimalAngle + delta,
    // optimalAngle + 2 * delta
  ];

  // Falls gewählter Winkel nicht dabei, ersetze den nächsten durch gewählten Winkel
  if (!angles.some(a => Math.abs(a - angleDeg) < 1e-3)) {
    let closest = angles.reduce((a, b) =>
      Math.abs(a - angleDeg) < Math.abs(b - angleDeg) ? a : b
    );
    angles[angles.indexOf(closest)] = angleDeg;
  }

  // Alle Trajektorien sammeln
  let allTrajectories = [analytic.trajectory];
  let numericTrajs = angles.map(a => computeNumericTrajectory(a, velocity));
  numericTrajs.forEach(t => allTrajectories.push(t.trajectory));

  // Maximale Werte (für gemeinsame Skalierung)
  let maxRange = 0, maxHeight = 0;
  allTrajectories.forEach(traj => {
    traj.forEach(pt => {
      if (pt.x > maxRange) maxRange = pt.x;
      if (pt.y > maxHeight) maxHeight = pt.y;
    });
  });

  // ---- Trajektorien zeichnen ohne Luftwiderstand ----
  drawPath(analytic.trajectory, color(130), maxRange, maxHeight); // Grau

  // Tabelle vorbereiten
  trajectoryRows = [];

  // Numerische Flüge
  angles.forEach((a, i) => {
    const traj = numericTrajs[i];
    let isOptimal = Math.abs(a - optimalAngle) < 1e-3;
    let isChosen = Math.abs(a - angleDeg) < 1e-3;
    let col;
    if (isChosen) col = color(0, 0, 255);       // Blau: Gewählt
    else if (isOptimal) col = color(255, 0, 0); // Rot: Optimal
    else col = color(0, 180, 0);                // Grün: Sonstige numerische Fälle
    drawPath(traj.trajectory, col, maxRange, maxHeight);

    trajectoryRows.push({
      methode: 'Mit Luftwiderstand',
      v: velocity,
      alpha: a,
      reichweite: traj.range,
      isOptimal: isOptimal,
      isChosen: isChosen
    });
  });

  // Analytischer Wert (immer oben in der Tabelle)
  trajectoryRows.unshift({
    methode: 'Ohne Luftwiderstand',
    v: velocity,
    alpha: angleDeg,
    reichweite: analytic.range,
    isOptimal: false,
    isChosen: false
  });

  // Zusammenfassungszeile
  optimalResult = {
    v: velocity,
    optimalAngle: optimalAngle,
    maxRange: optMaxRange
  };

  updateResultTable();
}

// Analytische Lösung ohne Luftwiderstand (Formeln siehe: https://github.com/Louis-Finegan/Basic-Projectile-Simulator-Javascript)
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

// Numerische Lösung mit Luftwiderstand (Euler-Verfahren, siehe: https://en.wikipedia.org/wiki/Euler_method)
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

// Suche optimalen Winkel für maximale Reichweite (mit Luftwiderstand)
// Siehe: https://stackoverflow.com/questions/68731306/how-to-find-optimal-projectile-angle-with-air-resistance
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

// Pfad auf das Canvas zeichnen (gemeinsame Skalierung: https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas)
function drawPath(trajectory, col, maxRange, maxHeight) {
  stroke(col);
  noFill();
  beginShape();
  textSize(14);
  textAlign(RIGHT, BOTTOM);
  text("x [m]", width - 10, height - 5);
  textAlign(LEFT, TOP);
  text("y [m]", 30, 10); 
  trajectory.forEach(({x, y}) => {
    let xScale = (width - 40) / (maxRange || 1);
    let yScale = (height - 40) / (maxHeight + 1e-6);
    let px = 20 + x * xScale;
    let py = height - 25 - y * yScale;
    vertex(px, py);
  });
  endShape();
}

// Tabelle und Zusammenfassungszeile aktualisieren
// Methoden und Werte in Deutsch
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement
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
