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

function setup() {
  const canvas = createCanvas(800, 400);
  canvas.parent('canvas-container');

  // Referenzen auf Eingabefelder
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
  if (valAngle > 89) valAngle = 89; // 90 Grad ist zu steil, deshalb habe ich auf 89 eingestellt
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
  background(180); // Hintergrundfarbe
  stroke(150); // https://p5js.org/reference/p5/stroke/
  line(0, height - 25, width, height - 25); // https://p5js.org/reference/p5/line/

  // Flugbahnen berechnen
  drawProjectileTrajectory(false); // Ohne Luftwiderstand (blau)
  if (dragToggle.checked) {
    drawProjectileTrajectory(true); // Mit Luftwiderstand (rot)
  }
}

/**
 * Zeichnet die Flugbahn, optional mit Luftwiderstand
 * @param {boolean} withDrag - true = mit Luftwiderstand, false = ohne
 */
function drawProjectileTrajectory(withDrag) {
  // Grad in Bogenmass lösung von https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cos
  // https://github.com/Louis-Finegan/Basic-Projectile-Simulator-Javascript/tree/master
  // https://natureofcode.com/vectors/

  const rad = angleDeg * Math.PI / 180;
  const v0x = velocity * Math.cos(rad);
  const v0y = velocity * Math.sin(rad);

  // Maximale Reichweite ohne Luftwiderstand (nur für Skalierung)
  // https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas
  let maxRange = (v0x / g) * (v0y + Math.sqrt(v0y ** 2 + 2 * g * launchHeight));
  let xScale = (width - 40) / maxRange;
  let yScale = (height - 40) / (launchHeight + (v0y ** 2) / (2 * g));

  if (!withDrag) {
    // Ohne Luftwiderstand (analytische Lösung)
    stroke(30, 144, 255); // Blau
    noFill();
    beginShape();
    for (let t = 0; t <= 5; t += 0.02) {
      let x = v0x * t;
      let y = launchHeight + v0y * t - 0.5 * g * t * t;
      if (y < 0) break;
      let px = 20 + x * xScale;
      let py = height - 25 - y * yScale;
      vertex(px, py);
    }
    endShape();
  } else {
    // Mit Luftwiderstand (numerische Lösung, Euler)
    stroke(220, 50, 50); // Rot
    noFill();

    let dt = 0.01; // Zeitschritt
    let x = 0, y = launchHeight;
    let vx = v0x, vy = v0y;

    beginShape();
    while (y >= 0 && x < maxRange * 1.5) {
      let px = 20 + x * xScale;
      let py = height - 25 - y * yScale;
      vertex(px, py);

      // Betrag der Geschwindigkeit berechnen
      let v = Math.sqrt(vx * vx + vy * vy);
      // Luftwiderstandskraft (Richtung immer entgegen der Bewegung)
      let Fd = 0.5 * rho * v * v * Cd * area;
      let Fdx = -Fd * (vx / v);
      let Fdy = -Fd * (vy / v);

      // Beschleunigungen
      let ax = Fdx / mass;
      let ay = (Fdy - mass * g) / mass;

      // Euler-Schritt
      vx += ax * dt;
      vy += ay * dt;
      x += vx * dt;
      y += vy * dt;
    }
    endShape();
  }
}
