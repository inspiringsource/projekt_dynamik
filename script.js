// Simulationsparameter
const g = 9.81;        // Schwerefeld der Erde
const rho = 1.225;     // Luftdichte (kg/m³)
const Cd = 0.47;       // Luftwiderstandsbeiwert
const diameter = 0.10; // Durchmesser des Balls 10cm = 0.10 m

// Fläche des Balls (A = pi * r^2)
const area = Math.PI * 0.05 ** 2; // Querschnittsfläche (r=0.05m)
const mass = 0.2;      // Masse des Balls 200g = 0.2 kg
const launchHeight = 2.5; // Abwurfhöhe in Metern

// Standardwerte
let angleDeg  = 45; // Abwurfwinkel in Grad
let velocity = 20;  // Abwurfgeschwindigkeit in m/s

// Variablen für die Eingabefelder
let angleInput, velocityInput;

// Ergebnisse für Tabelle und Zusammenfassung
let trajectoryRows = [];
let optimalResult = null;

function setup() {
  const canvas = createCanvas(800, 400);
  canvas.parent('canvas-container');

  angleInput = document.getElementById('angleInput');
  velocityInput = document.getElementById('velocityInput');

  angleInput.addEventListener('change', updateParams);
  velocityInput.addEventListener('change', updateParams);

  noLoop();

  updateSummaryTableDt01();
  updateSummaryTableDt001();
  updateSummaryTableCoarse();
  updateSummaryTableFine();
}


function updateParams() {
  let valAngle = Number(angleInput.value);
  if (valAngle < 5) valAngle = 5;
  if (valAngle > 80) valAngle = 80;
  angleDeg = valAngle;
  angleInput.value = valAngle;

  let valVel = Number(velocityInput.value);
  if (valVel < 5) valVel = 5;
  if (valVel > 50) valVel = 50;
  velocity = valVel;
  velocityInput.value = valVel;

  redraw();

  updateSummaryTableDt01();
  updateSummaryTableDt001();
  updateSummaryTableCoarse();
  updateSummaryTableFine();
}

document.addEventListener("DOMContentLoaded", function () {
  const velocities = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  const angles     = [30.26, 38.16, 40.38, 40.67, 40.09, 39.53, 38.95, 38.15, 37.37, 36.67];
  const ranges     = [4.28, 11.47, 21.30, 32.54, 44.15, 55.52, 66.32, 76.45, 85.89, 94.65];

  const trace1 = {
    x: velocities,
    y: ranges,
    name: 'Maximale Reichweite [m]',
    yaxis: 'y1',
    mode: 'markers+lines',
    marker: { color: 'blue', size: 8 },
    line: { dash: 'solid' }
  };

  const trace2 = {
    x: velocities,
    y: angles,
    name: 'Optimaler Winkel in Grad',
    yaxis: 'y2',
    mode: 'markers+lines',
    marker: { color: 'red', size: 8 },
    line: { dash: 'dot' }
  };

  const layout = {
    title: 'Maximale Reichweite und Winkel gegen Anfangsgeschwindigkeit',
    xaxis: { title: 'Anfangsgeschwindigkeit V [m/s]' },
    yaxis: { title: 'Maximale Reichweite [m]', side: 'left', showgrid: true },
    yaxis2: {
      title: 'Optimaler Winkel in Grad',
      overlaying: 'y',
      side: 'right',
      showgrid: false
    },
    legend: { x: 0.1, y: 1.1, orientation: 'h' }
  };

  Plotly.newPlot('scatter-plot', [trace1, trace2], layout);
});



// Numerische Lösung mit Luftwiderstand (Euler-Verfahren)
// Siehe: https://en.wikipedia.org/wiki/Euler_method
function computeNumericTrajectory(angle, v, dt = 0.01) {
  const rad = angle * Math.PI / 180;
  const v0x = v * Math.cos(rad);
  const v0y = v * Math.sin(rad);
  let x = 0, y = launchHeight;
  let vx = v0x, vy = v0y;
  let traj = [];
  while (y >= 0 && x < 2000) {
    traj.push({x, y});
    let speed = Math.sqrt(vx * vx + vy * vy);
    let Fd = 0.5 * rho * speed * speed * Cd * area;
    let Fdx = -Fd * (vx / speed);
    let Fdy = -Fd * (vy / speed);
    let ax = Fdx / mass;
    let ay = (Fdy - mass * g) / mass; // Luftwiderstand und Schwerkraft
    vx += ax * dt;
    vy += ay * dt;
    x += vx * dt;
    y += vy * dt;
  }
  return { trajectory: traj, range: x };
}

// "Normal": dt = 0.01
function findOptimalAngleEulerDt01(v) {
  let maxRange = 0, optimalAngle = 45;
  for (let a = 30; a <= 50; a += 0.01) {
    let result = computeNumericTrajectory(a, v, 0.001);
    if (result.range > maxRange) {
      maxRange = result.range;
      optimalAngle = a;
    }
  }
  return { optimalAngle, maxRange };
}

// "Feinabstimmung (fine)": dt = 0.001
function findOptimalAngleEulerDt001(v) {
  let maxRange = 0, optimalAngle = 45;
  for (let a = 30; a <= 50; a += 0.1) {
    let result = computeNumericTrajectory(a, v, 0.001);
    if (result.range > maxRange) {
      maxRange = result.range;
      optimalAngle = a;
    }
  }
  return { optimalAngle, maxRange };
}


function updateSummaryTableDt01() {
  const velocities = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  const tbody = document.querySelector("#summary-table-dt01 tbody");
  if (!tbody) return;
  tbody.innerHTML = '';
  velocities.forEach(v => {
    const { optimalAngle, maxRange } = findOptimalAngleEulerDt01(v);
    tbody.innerHTML += `
      <tr>
        <td>${v}</td>
        <td>${optimalAngle.toFixed(2)}°</td>
        <td>${maxRange.toFixed(2)} m</td>
      </tr>
    `;
  });
}

function updateSummaryTableDt001() {
  const velocities = [10, 20, 30, 40, 50];
  const tbody = document.querySelector("#summary-table-dt001 tbody");
  if (!tbody) return;
  tbody.innerHTML = '';
  velocities.forEach(v => {
    const { optimalAngle, maxRange } = findOptimalAngleEulerDt001(v);
    tbody.innerHTML += `
      <tr>
        <td>${v}</td>
        <td>${optimalAngle.toFixed(2)}°</td>
        <td>${maxRange.toFixed(2)} m</td>
      </tr>
    `;
  });
}



// Suche optimalen Winkel für maximale Reichweite: Schrittweite 0.1 Grad
// Siehe: https://stackoverflow.com/questions/68731306/how-to-find-optimal-projectile-angle-with-air-resistance
function findOptimalAngleEuler(v) {
  let maxRange = 0, optimalAngle = 45;
  for (let a = 30; a <= 50; a += 0.1) {
    let result = computeNumericTrajectory(a, v);
    if (result.range > maxRange) {
      maxRange = result.range;
      optimalAngle = a;
    }
  }
  return { optimalAngle, maxRange };
}

// Fein: Schrittweite 0.01 Grad
function findOptimalAngleEulerFine(v) {
  let maxRange = 0, optimalAngle = 45;
  for (let a = 30; a <= 50; a += 0.01) {
    let result = computeNumericTrajectory(a, v);
    if (result.range > maxRange) {
      maxRange = result.range;
      optimalAngle = a;
    }
  }
  return { optimalAngle, maxRange };
}


// Pfad auf das Canvas zeichnen (gemeinsame Skalierung)
// Quelle für Skalierung: https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas
function drawPath(trajectory, col, maxRange, maxHeight) {
  stroke(col);
  noFill();
  beginShape();
  textSize(14);
  textAlign(RIGHT, BOTTOM);
  text("Reichweite [m]", width - 10, height - 5);
  textAlign(LEFT, TOP);
  text("___", 10, 280); 
  text("    2.5 [m]", 20, 295); 
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
    else style = "color:green;";
    tbody.innerHTML += `
      <tr style="${style}">
        <td>${row.v.toFixed(2)}</td>
        <td>${row.alpha.toFixed(1)}°</td>
        <td>${row.reichweite.toFixed(2)} m</td>
      </tr>
    `;
  });
}


function updateSummaryTableCoarse() {
  const velocities = [10, 20, 30, 40, 50];
  const tbody = document.querySelector("#summary-table-coarse tbody");
  if (!tbody) return;
  tbody.innerHTML = '';
  velocities.forEach(v => {
    const { optimalAngle, maxRange } = findOptimalAngleEuler(v);
    tbody.innerHTML += `
      <tr>
        <td>${v}</td>
        <td>${optimalAngle.toFixed(2)}°</td>
        <td>${maxRange.toFixed(2)} m</td>
      </tr>
    `;
  });
}

function updateSummaryTableFine() {
  const velocities = [10, 20, 30, 40, 50];
  const tbody = document.querySelector("#summary-table-fine tbody");
  if (!tbody) return;
  tbody.innerHTML = '';
  velocities.forEach(v => {
    const { optimalAngle, maxRange } = findOptimalAngleEulerFine(v);
    tbody.innerHTML += `
      <tr>
        <td>${v}</td>
        <td>${optimalAngle.toFixed(2)}°</td>
        <td>${maxRange.toFixed(2)} m</td>
      </tr>
    `;
  });
}



function draw() {
  background(180);
  stroke(150);
  line(0, height - 25, width, height - 25);

  // --- Nur numerische Trajektorien (mit Luftwiderstand) ---
  const { optimalAngle, maxRange: optMaxRange } = findOptimalAngleEuler(velocity);
  const delta = 3; // Schrittweite in Grad (ein Winkel davor und danach)
  let angles = [
    optimalAngle - delta,
    optimalAngle,
    optimalAngle + delta
  ];

  // Den gewählten Winkel einfügen, falls er nicht dabei ist
  if (!angles.some(a => Math.abs(a - angleDeg) < 1e-3)) {
    let closest = angles.reduce((a, b) =>
      Math.abs(a - angleDeg) < Math.abs(b - angleDeg) ? a : b
    );
    angles[angles.indexOf(closest)] = angleDeg;
  }

  // Trajektorien berechnen
  let numericTrajs = angles.map(a => computeNumericTrajectory(a, velocity));

  // Maximale Werte für Skalierung bestimmen
  let maxRange = 0, maxHeight = 0;
  numericTrajs.forEach(traj => {
    traj.trajectory.forEach(pt => {
      if (pt.x > maxRange) maxRange = pt.x;
      if (pt.y > maxHeight) maxHeight = pt.y;
    });
  });

  // Tabelle vorbereiten
  trajectoryRows = [];

  // Trajektorien zeichnen und Tabelleneinträge speichern
  angles.forEach((a, i) => {
    const traj = numericTrajs[i];
    let isOptimal = Math.abs(a - optimalAngle) < 1e-3;
    let isChosen = Math.abs(a - angleDeg) < 1e-3;
    let col;
    if (isChosen) col = color(0, 0, 255);       // Blau: Gewählt
    else if (isOptimal) col = color(255, 0, 0); // Rot: Optimal
    else col = color(0, 180, 0);                // Grün: Andere
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

  // Zusammenfassungszeile
  optimalResult = {
    v: velocity,
    optimalAngle: optimalAngle,
    maxRange: optMaxRange
  };
  updateResultTable();

}