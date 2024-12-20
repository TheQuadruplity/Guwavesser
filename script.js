const canvas = document.getElementById("drawingCanvas");

const boxConfig = document.getElementById("config");

const buttonPlay = document.getElementById("play");
const buttonCheck = document.getElementById("check");
const buttonReload = document.getElementById("reload");
const sliderResolution = document.getElementById("resolution");
const sliderPoints = document.getElementById("points");
const optionPitch = document.getElementById("pitch");
const optionEasing = document.getElementById("easing");
const optionLine = document.getElementById("line");
const sliderVolume = document.getElementById("volume");
const sliderDuration = document.getElementById("duration");
const expandBtn = document.getElementById("expandBtn");
const waveBox = document.getElementById("wave-box");

const displayResolution = document.getElementById("resolutionValue");
const displayPoints = document.getElementById("pointsValue");
const displayVolume = document.getElementById("volumeValue");
const displayDuration = document.getElementById("durationValue");
const statistics = document.getElementById("statistics");
const accuracy = document.getElementById("accuracy");
const configAlert = document.getElementById("configAlert");

const ctx = canvas.getContext("2d");
let cw = canvas.clientWidth;
let ch = canvas.clientHeight;
let isDraw = true;
let resolution = 100;
let points = 3;
let pitch = 1;
let volume = 0.5;
let duration = 2;
let nowWave = new Array(resolution).fill(0);
let nowAns = new Array(resolution).fill(0);
let lines = new Array(points).fill(0);
let isDrawing = false;
let xb = -1;
let yb = -1;
let currenthi = 0;
let isExpanded = false;
let help = false;

function generateWave(n) {
  // Generate random y values between 0 and 1
  const y = Array.from({ length: n }, () => Math.random());

  // Generate random x values between 0 and 1, sorted, with first x = 0 and last x = 1
  let x = Array.from({ length: n - 2 }, () => Math.random());
  x = [0, ...x.sort(), 1]; // Ensure first is 0 and last is 1
  lines = x;

  const yInterp = [];

  // Helper function for cubic interpolation between two points with stationary points (tangents are zero)
  function cubicHermiteStationary(p0, p1, t) {
    const t2 = t * t;
    const t3 = t2 * t;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h01 = -2 * t3 + 3 * t2;

    return h00 * p0 + h01 * p1;
  }

  // Interpolate y values between the known points using cubic Hermite interpolation with stationary points
  for (let i = 0; i < resolution; i++) {
    // Calculate the corresponding position on the x-axis (from 0 to 1)
    const xInterp = i / (resolution - 1);

    // Find the two surrounding points in the original data
    for (let j = 0; j < n - 1; j++) {
      if (x[j] <= xInterp && xInterp <= x[j + 1]) {
        // Normalize t to the range [0, 1] between the two x points
        const t = (xInterp - x[j]) / (x[j + 1] - x[j]);

        // Perform cubic Hermite interpolation with stationary points
        const yValue = cubicHermiteStationary(y[j], y[j + 1], t);
        yInterp.push(yValue * pitch + (1 - pitch) / 2);
        break;
      }
    }
  }

  return yInterp;
}

function generateWaveSnap(n) {
  // Generate random y values between 0 and 1
  const y = Array.from({ length: n }, () => Math.random());

  // Generate random x values between 0 and 1, sorted, with first x = 0 and last x = 1
  let x = Array.from({ length: n - 2 }, () => Math.random());
  x = [0, ...x.sort(), 1]; // Ensure first is 0 and last is 1
  lines = x;

  const yInterp = [];
  let c = 0;
  for (let i = 0; i < resolution; i++) {
    const xInterp = i / (resolution - 1);
    if (xInterp > x[c + 1]) {
      c++;
    }
    yInterp.push(y[c]);
  }

  return yInterp;
}

function generateWaveLinear(n) {
  // Generate random y values between 0 and 1
  const y = Array.from({ length: n }, () => Math.random());

  // Generate random x values between 0 and 1, sorted, with first x = 0 and last x = 1
  let x = Array.from({ length: n - 2 }, () => Math.random());
  x = [0, ...x.sort(), 1]; // Ensure first is 0 and last is 1
  lines = x;

  const yInterp = [];
  for (let i = 0; i < resolution; i++) {
    // Calculate the corresponding position on the x-axis (from 0 to 1)
    const xInterp = i / (resolution - 1);

    // Find the two surrounding points in the original data
    for (let j = 0; j < n - 1; j++) {
      if (x[j] <= xInterp && xInterp <= x[j + 1]) {
        // Normalize t to the range [0, 1] between the two x points
        const t =
          ((xInterp - x[j]) / (x[j + 1] - x[j])) * (y[j + 1] - y[j]) + y[j];

        yInterp.push(t * pitch + (1 - pitch) / 2);
        break;
      }
    }
  }
  return yInterp;
}

function easeGen(size, type, stiff) {
  let val = Array.from({ length: size }, (v, i) => i / (size - 1));
  const pow = stiff / (1 - stiff);
  switch (type) {
    case 0: //ease in
      return val.map((x) => Math.pow(x, pow));
    case 1: //ease out
      return val.map((x) => 1 - Math.pow(1 - x, pow));
    case 2: //ease io
      return val.map((x) =>
        x < 0.5
          ? Math.pow(2, pow - 1) * Math.pow(x, pow)
          : 1 - Math.pow(-2 * x + 2, pow) / 2
      );
  }
}

function easeFunc(x, type, stiff) {
  const pow = stiff / (1 - stiff);
  switch (type) {
    case 0: //ease in
      return Math.pow(x, pow);
    case 1: //ease out
      return 1 - Math.pow(1 - x, pow);
    case 2: //ease io
      return x < 0.5
        ? Math.pow(2, pow - 1) * Math.pow(x, pow)
        : 1 - Math.pow(-2 * x + 2, pow) / 2;
  }
}

function generateWaveEasing(n) {
  const y = Array.from({ length: n }, () => Math.random());
  let x = Array.from({ length: n - 2 }, () => Math.random());
  x = [0, ...x.sort(), 1];
  lines = x;
  const easeType = Array.from({ length: n - 1 }, () =>
    Math.floor(Math.random() * 3)
  );
  const easeStiff = Array.from(
    { length: n - 1 },
    () => Math.random() * 0.9 + 0.05
  );

  const yInterp = [];

  for (let i = 0; i < resolution; i++) {
    const xInterp = i / (resolution - 1);
    for (let j = 0; j < n - 1; j++) {
      if (x[j] <= xInterp && xInterp <= x[j + 1]) {
        yInterp.push(
          easeFunc(
            (xInterp - x[j]) / (x[j + 1] - x[j]),
            easeType[j],
            easeStiff[j]
          ) *
            (y[j + 1] - y[j]) +
            y[j]
        );
      }
    }
  }
  return yInterp;
}

function generateSound(wave, duration, volume) {
  // make sure volume is below 0.5
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const sampleRate = audioCtx.sampleRate;

  const numberOfSamples = Math.ceil(sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, numberOfSamples, sampleRate);
  const data = buffer.getChannelData(0);

  const m = wave.length;
  const scale = (m - 1) / (numberOfSamples - 1);

  let phase = 0; // Initialize phase
  const baseFrequency = 220; // Starting frequency

  for (let i = 0; i < numberOfSamples; i++) {
    const pos = i * scale;
    const leftIndex = Math.floor(pos);
    const rightIndex = Math.ceil(pos);
    let waveValue;

    if (leftIndex === rightIndex) {
      waveValue = wave[leftIndex];
    } else {
      // Linearly interpolate between wave[leftIndex] and wave[rightIndex]
      const t = pos - leftIndex;
      waveValue = (1 - t) * wave[leftIndex] + t * wave[rightIndex];
    }

    const frequency = baseFrequency * Math.pow(2, waveValue * 3); // Exponential scaling of frequency
    const phaseIncrement = (2 * Math.PI * frequency) / sampleRate; // Increment phase smoothly based on frequency

    // Calculate amplitude based on the current phase
    const amplitude = Math.sin(phase) * volume;

    // Store the sample
    data[i] = amplitude;

    // Update the phase for the next sample
    phase += phaseIncrement;

    // Keep the phase in the range [0, 2π] to avoid overflow
    if (phase > 2 * Math.PI) {
      phase -= 2 * Math.PI;
    }
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();

  setTimeout(() => {
    source.stop();
  }, duration * 1000);
}

function playSound(wave, duration, volume) {
  generateSound(wave, duration, volume);
  const movingLine = document.getElementById("movingLine");
  movingLine.style.animation = "moveLine " + duration + "s linear forwards";

  movingLine.addEventListener("animationend", function () {
    movingLine.style.animation = ""; // Reset animasi setelah selesai
  });
}

function drawWave(wave, color = "#ffffff") {
  const wi = cw / (wave.length - 1);
  ctx.strokeStyle = color; // Color of the line
  ctx.lineWidth = 2; // Line width

  ctx.beginPath();
  for (let i = 0; i < wave.length - 1; i++) {
    ctx.moveTo(i * wi, (1 - wave[i]) * ch);
    ctx.lineTo((i + 1) * wi, (1 - wave[i + 1]) * ch);
  }
  ctx.stroke();
}

function drawHelper() {
  if (!help) return;
  ctx.strokeStyle = "#404040"; // Color of the line
  ctx.lineWidth = 2; // Line width

  for (let i = 1; i < lines.length - 1; i++) {
    ctx.beginPath();
    ctx.moveTo(lines[i] * cw, 0);
    ctx.lineTo(lines[i] * cw, ch);
    ctx.stroke();
  }
}

function mouseDraw(e) {
  if (isDraw) isDrawing = true;
  xb = -1;
  yb = -1;
}

function mouseMove(e) {
  if (!isDrawing) return;

  ctx.clearRect(0, 0, cw, ch);
  drawHelper();

  x = e.offsetX;
  y = e.offsetY;

  xn = Math.round((x * resolution) / cw);
  yn = 1 - y / ch;

  if (xb != -1) {
    const dif = Math.abs(xn - xb) + 1;
    const dir = Math.sign(xn - xb);
    const ydiff = yn - yb;
    for (let i = 0; i < dif; i++) {
      nowWave[i * dir + xb] = yb + (ydiff / dif) * i;
    }
  } else {
    nowWave[xn] = 1 - y / ch;
  }
  yb = yn;
  xb = xn;
  drawWave(nowWave);
}

function mouseStop(e) {
  isDrawing = false;
  xb = -1;
  yb = -1;
}

function calculateScore(wav, ans) {
  let diff = 0;
  for (let i = 0; i < resolution; i++) {
    diff += Math.abs(wav[i] - ans[i]);
  }
  diff /= resolution;

  let scdiff = Math.exp(Math.log(0.965) * 1296 * diff * diff);

  // Membulatkan distance error dan distance score ke 3 titik belakang koma
  let roundedDiff = (diff * 36).toFixed(3);
  let roundedScdiff = (scdiff * 100).toFixed(3);

  statistics.innerHTML =
    `Distance error: ${roundedDiff} semitone(s)<br>Distance score: ${roundedScdiff}%<br>best: ${(
      currenthi * 100
    ).toFixed(3)}%` + (currenthi < scdiff ? "<br>NEW BEST!" : "");

  currenthi = currenthi < scdiff ? scdiff : currenthi;
  return roundedScdiff;
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  cw = canvas.clientWidth;
  ch = canvas.clientHeight;
}

function reload() {
  switch (optionEasing.value) {
    case "snap":
      nowAns = generateWaveSnap(points);
      break;
    case "cubic":
      nowAns = generateWave(points);
      break;
    case "linear":
      nowAns = generateWaveLinear(points);
      break;
    case "ease":
      nowAns = generateWaveEasing(points);
      break;
  }
  //nowAns = nowAns.fill(0.5);
  nowWave = new Array(resolution).fill(0);
  ctx.clearRect(0, 0, cw, ch);
  drawHelper();
  isDraw = true;
  // Hilangkan animasi dan reset akurasi
  accuracy.classList.remove("visible");
  accuracy.style.width = "0"; // Reset lebar ke 0%
  accuracy.style.background = ""; // Reset gradient background

  // Sembunyikan kesimpulan
  conclusion.style.display = "none"; // Sembunyikan kesimpulan lagi
  configAlert.hidden = true;

  statistics.innerHTML = "Best: " + (currenthi * 100).toFixed(3) + "%";
}

function check() {
  drawWave(nowAns, "#00ff00");
  score = calculateScore(nowWave, nowAns);
  isDraw = false;
  const widthPercentage = (score / 100) * 80; // 80% adalah lebar max dari box
  accuracy.style.width = widthPercentage + "%";

  accuracy.textContent = Math.floor(score * 100) / 100 + "%";

  // Ubah background gradient agar sesuai dengan score
  const gradientPercentage = score / 100; // Adjust color gradient based on score
  accuracy.style.background = `linear-gradient(to right, #00ff00, #ffff00 ${gradientPercentage}%, #ff0000)`;

  // Tampilkan elemen accuracy dengan animasi
  accuracy.classList.add("visible");

  // Ubah teks kesimpulan berdasarkan nilai akurasi
  let conclusionText = "";

  if (score < 40) {
    // Sarkas untuk skor < 40
    const conclusionList = [
      "Are you even trying?",
      "Maybe this game isn't for you.",
      "Well, at least you showed up.",
      "I've seen worse... but not by much.",
      "Keep going, you’ll hit rock bottom soon!",
    ];
    conclusionText =
      conclusionList[Math.floor(Math.random() * conclusionList.length)];
  } else if (score >= 40 && score <= 60) {
    // Kesimpulan untuk skor 40-60
    const conclusionList = [
      "Not bad for beginners.",
      "You're making progress… I guess.",
      "You could do better, but this is fine… I suppose.",
      "A solid effort... for a first-timer.",
      "You're halfway there! Too bad it's the wrong half.",
    ];
    conclusionText =
      conclusionList[Math.floor(Math.random() * conclusionList.length)];
  } else if (score > 60 && score <= 70) {
    // Kesimpulan untuk skor 60-70
    const conclusionList = [
      "Not bad, could have been better if you paid more attention.",
      "Almost there, but not quite. Focus a little more.",
      "Pretty decent, but I bet you can do better.",
      "You’re getting the hang of it, don’t stop now.",
      "You're improving… slowly, but surely.",
    ];
    conclusionText =
      conclusionList[Math.floor(Math.random() * conclusionList.length)];
  } else if (score > 70 && score <= 80) {
    // Kesimpulan untuk skor 70-80
    const conclusionList = [
      "I'm proud of you.",
      "Not bad at all, keep it up!",
      "You’re starting to impress me.",
      "Good job, but don’t get too comfortable.",
      "Nicely done! You're getting closer.",
    ];
    conclusionText =
      conclusionList[Math.floor(Math.random() * conclusionList.length)];
  } else if (score > 80 && score <= 90) {
    // Kesimpulan untuk skor 80-90
    const conclusionList = [
      "Brilliant.",
      "Well done! Almost flawless.",
      "You're shining now!",
      "That’s some serious talent right there.",
      "You’re making this look easy.",
    ];
    conclusionText =
      conclusionList[Math.floor(Math.random() * conclusionList.length)];
  } else if (score > 90 && score <= 97) {
    // Kesimpulan untuk skor 90-97
    const conclusionList = [
      "Impressive! But just a little shy of perfection.",
      "Great job! You're almost at the top.",
      "You're really good, but there's still room for improvement.",
      "So close to being perfect, just a little more effort!",
      "Almost flawless, but not quite. Keep pushing!",
    ];
    conclusionText =
      conclusionList[Math.floor(Math.random() * conclusionList.length)];
  } else if (score > 97 && score < 100) {
    // Kesimpulan untuk skor 97-99
    const conclusionList = [
      "Maybe try harder config.",
      "So close to 100%, but not there yet.",
      "Almost perfect, just a tiny bit more effort.",
      "Perfection is so close you can almost touch it!",
    ];
    conclusionText =
      conclusionList[Math.floor(Math.random() * conclusionList.length)];
  } else if (score == 100) {
    // Kesimpulan untuk skor 100
    const conclusionList = [
      "Nice hack!",
      "Perfect! Did you cheat?",
      "100%! Are you even human?",
    ];
    conclusionText =
      conclusionList[Math.floor(Math.random() * conclusionList.length)];
  }

  // Update kesimpulan dan tampilkan
  conclusion.querySelector("p").textContent = conclusionText;
  conclusion.style.display = "block"; // Tampilkan kesimpulan
}

// Event Listeners
canvas.addEventListener("mousedown", mouseDraw);
canvas.addEventListener("mousemove", mouseMove);
canvas.addEventListener("mouseup", mouseStop);
canvas.addEventListener("mouseleave", mouseStop);
expandBtn.addEventListener("click", function () {
  if (isExpanded) {
    // Jika sudah expand, kembalikan ke ukuran awal
    waveBox.style.maxHeight = "400px";
    expandBtn.innerHTML = '<img src="down.png" alt="Expand" />'; // Ubah icon menjadi panah ke bawah
  } else {
    // Jika belum expand, ubah menjadi fit-content
    waveBox.style.maxHeight = "fit-content";
    expandBtn.innerHTML = '<img src="up.svg" alt="Collapse" />'; // Ubah icon menjadi panah ke atas
  }

  // Toggle status expanded
  isExpanded = !isExpanded;
});

boxConfig.onchange = () => {
  configAlert.hidden = false;
};

buttonCheck.onclick = check;
buttonPlay.onclick = () => {
  playSound(nowAns, duration, volume);
};
buttonReload.onclick = () => {
  reload();
  playSound(nowAns, duration, volume);
};
window.addEventListener("resize", resizeCanvas);

sliderResolution.oninput = () => {
  resolution = 25 * Math.pow(2, Number(sliderResolution.value));
  displayResolution.textContent = resolution;
};
sliderPoints.oninput = () => {
  points = Number(sliderPoints.value);
  displayPoints.textContent = points;
};
optionPitch.onchange = () => {
  pitch = Number(optionPitch.value);
};
optionLine.onchange = () => {
  help = optionLine.checked;
};
sliderVolume.oninput = () => {
  volume = sliderVolume.value;
  displayVolume.textContent = Math.round(volume * 100) + "%";
};
sliderDuration.oninput = () => {
  duration = Number(sliderDuration.value);
  displayDuration.textContent = duration + " s";
};

// Initial
resizeCanvas();
reload();

// Get all card elements
const cards = document.querySelectorAll(".card");

// Loop through each card and add a click event listener
cards.forEach((card) => {
  card.addEventListener("click", () => {
    // Toggle the 'expanded' class on click
    card.classList.toggle("expanded");
  });
});
