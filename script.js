// Simulationsparameter
const g = 9.81;        // Schwerefeld der Erde
const rho = 1.225;     // Luftdichte
const Cd = 0.47;       // Luftwiderstandsbeiwert
const diameter = 0.10; // Durchmesser des Balls 10cm = 0.10 m

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/PI
const area = Math.PI * 0.05 ** 2; // Querschnittsfläche 
const mass = 0.2;      // Masse des Balls 200g = 0.2 kg
const launchHeight = 2.5; // abwurfhöhe in metern

// Testwerte
let angleDeg  = 45; // Abwurfwinkel in Grad
let velocity = 20; // Abwurfgeschwindigkeit in m/s

// https://github.com/Louis-Finegan/Basic-Projectile-Simulator-Javascript/tree/master
// https://natureofcode.com/vectors/
const rad = angleDeg * Math.PI / 180; // Umrechnung Grad in Bogenmass
const v0x = velocity * Math.cos(rad); // x-Richtung: Anfangsgeschwindigkeit 
const v0y = velocity * Math.sin(rad); // y-Richtung: Anfangsgeschwindigkeit

// p5 Setup-Funktion
function setup() {
  const canvas = createCanvas(800, 400);
  canvas.parent('canvas-container'); 


// https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas
// Proportional in die Grösse der Zeichenfläche relative zu Canvas und angabenen Werten
let maxRange = (v0x / g) * (v0y + Math.sqrt(v0y ** 2 + 2 * g * launchHeight));
let xScale = (width - 40) / maxRange;
let yScale = (height - 40) / (launchHeight + (v0y ** 2) / (2 * g));

// einfaches Projektile zeichnen
function drawSimpleProjectile() {
    background(180); // Hintergrundfarbe
    stroke(150); // https://p5js.org/reference/p5/stroke/
    line(0, height - 25, width, height - 25); // https://p5js.org/reference/p5/line/
}

// p5 rufe Funktion einstelungen
  stroke(30, 144, 255);
  noFill();
  beginShape();
  for (let t = 0; t <= 5; t += 0.02) { // schrittweite 0.02 Sekunden
    let x = v0x * t;
    let y = launchHeight + v0y * t - 0.5 * g * t * t;
    if (y < 0) break; // aufschlag punkt 
    // canvas anpassen / skalieren
    let px = 20 + x * xScale;
    let py = height - 25 - y * yScale;
    vertex(px, py);
  }
  endShape();


// p5 rufe Funktion draw()
window.draw = function() {
  drawSimpleProjectile();
};
