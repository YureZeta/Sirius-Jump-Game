// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Elementos
const menu = document.getElementById("menu");
const gameOverScreen = document.getElementById("gameOverScreen");
const rankingScreen = document.getElementById("rankingScreen");
const instructionsScreen = document.getElementById("instructionsScreen");
const rankingList = document.getElementById("rankingList");
const welcomeMessage = document.getElementById("welcomeMessage");

const playerNameInput = document.getElementById("playerNameInput");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const rankingBtn = document.getElementById("rankingBtn");
const backToMenuFromRanking = document.getElementById("backToMenuFromRanking");
const clearRankingBtn = document.getElementById("clearRankingBtn");
const instructionsBtn = document.getElementById("instructionsBtn");
const backToMenuFromInstructions = document.getElementById("backToMenuFromInstructions");

// Sons
const jumpSound = new Audio("Sons/Pulo.wav");
const menuSound = new Audio("Sons/Menu&Ranking.mp3");
const gameplaySound = new Audio("Sons/GamePlay.mp3");
const gameOverSound = new Audio("Sons/GameOver.mp3");
const pontoSound = new Audio("Sons/Ponto.mp3");

// Imagens do robô (animações)
const roboPulo = new Image();
roboPulo.src = "Imagens/pulo.png";

const roboQueda = new Image();
roboQueda.src = "Imagens/queda.png";

const BIRD_SIZE = 20;

// Variáveis do jogo
let bird, pipes, score, gameInterval, playerName;
let frameCount = 0;
let ultimoEstadoPulo = false;
let tempoUltimoPulo = 0;

// Mostrar menu inicial
menu.style.display = "block";
playSound(menuSound);

// Função para tocar som de forma organizada
function playSound(sound, loop = false) {
  if (loop) sound.loop = true;
  else sound.loop = false;

  sound.currentTime = 0;
  sound.play().catch(err => console.log(err));
}

// --- Funções do jogo ---
function startGame() {
  let name = playerNameInput.value.trim();
  if (!name || name.length < 2) {
    alert("Digite um nome com pelo menos 2 caracteres!");
    return;
  }
  playerName = name;

  menu.style.display = "none";
  rankingScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  instructionsScreen.style.display = "none";

  welcomeMessage.textContent = `Boa sorte, ${playerName}!`;
  welcomeMessage.classList.remove("hidden");
  playSound(menuSound);

  setTimeout(() => {
    welcomeMessage.classList.add("hidden");
    canvas.style.display = "block";

    bird = { x: 50, y: 150, width: BIRD_SIZE, height: BIRD_SIZE, gravity: 0.5, lift: -8, velocity: 0 };
    pipes = [];
    score = 0;
    frameCount = 0;

    menuSound.pause();

    document.addEventListener("keydown", fly);
    gameInterval = setInterval(updateGame, 20);
  }, 2000);
}

let gameplayStarted = false; // nova variável para controlar se o som começou

function fly(e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    bird.velocity = bird.lift;
    jumpSound.currentTime = 0;
    jumpSound.play();

    // Inicia a gameplay apenas no primeiro pulo
    if (!gameplayStarted) {
      gameplaySound.currentTime = 0;
      gameplaySound.loop = true;
      gameplaySound.play().catch(err => console.log(err));
      gameplayStarted = true;
    }
  }
}


function updateGame() {
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  frameCount++;
  if (frameCount % 90 === 0) {
    const topHeight = Math.random() * 200 + 50;
    pipes.push({ x: canvas.width, topHeight: topHeight, bottomY: topHeight + 120, width: 40, passed: false });
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.x -= 2;

    // Colisão
    if (
      bird.x < pipe.x + pipe.width &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY)
    ) {
      endGame();
      return;
    }

    // Pontuação
    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      score++;
      pontoSound.currentTime = 0;
      pontoSound.play();
    }

    // Remove canos fora da tela
    if (pipe.x + pipe.width < 0) pipes.splice(i, 1);
  }

  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    endGame();
    return;
  }

  drawGame();
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Escolhe imagem do robô conforme movimento
  if (bird.velocity < -2) {
    ultimoEstadoPulo = true;
    tempoUltimoPulo = Date.now();
  } else if (Date.now() - tempoUltimoPulo > 200) {
    ultimoEstadoPulo = false;
  }

  let roboAtual = ultimoEstadoPulo ? roboPulo : roboQueda;
  ctx.drawImage(roboAtual, bird.x, bird.y, BIRD_SIZE, BIRD_SIZE);

  // Desenha canos
  ctx.fillStyle = "green";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, canvas.height - pipe.bottomY);
  });

  // Pontuação
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 25);
}

function endGame() {
  clearInterval(gameInterval);
  document.removeEventListener("keydown", fly);

  // Para o som da gameplay
  gameplaySound.pause();

  playSound(gameOverSound);

  canvas.style.display = "none";
  gameOverScreen.style.display = "block";
  document.getElementById("finalScore").innerText = `Pontuação: ${score}`;

  saveScore(playerName, score);
}


// --- Ranking ---
function saveScore(name, points) {
  if (!name || typeof points !== "number" || points < 0) return;
  let ranking = JSON.parse(localStorage.getItem("flappyRanking")) || [];
  ranking.push({ name, points });
  ranking.sort((a, b) => b.points - a.points);
  localStorage.setItem("flappyRanking", JSON.stringify(ranking.slice(0, 10)));
}

function showRanking() {
  menu.style.display = "none";
  gameOverScreen.style.display = "none";
  canvas.style.display = "none";
  instructionsScreen.style.display = "none";
  rankingScreen.style.display = "block";

  playSound(menuSound);

  const ranking = JSON.parse(localStorage.getItem("flappyRanking")) || [];
  if (ranking.length === 0) {
    rankingList.innerHTML = "<li>Nenhum ponto registrado ainda.</li>";
    return;
  }

  rankingList.innerHTML = ranking
    .filter(r => r && r.name && typeof r.points === "number")
    .map((r, i) => `<li>${i + 1}. ${r.name} - ${r.points} pts</li>`)
    .join("");
}

function clearRanking() {
  if (confirm("Tem certeza que deseja limpar o ranking?")) {
    localStorage.removeItem("flappyRanking");
    rankingList.innerHTML = "";
  }
}

// --- Botões ---
startBtn.onclick = startGame;
restartBtn.onclick = () => {
  playerNameInput.value = "";
  menu.style.display = "block";
  gameOverScreen.style.display = "none";
  playSound(menuSound);
};
backToMenuBtn.onclick = () => {
  gameOverScreen.style.display = "none";
  menu.style.display = "block";
  playSound(menuSound);
};
rankingBtn.onclick = showRanking;
backToMenuFromRanking.onclick = () => {
  rankingScreen.style.display = "none";
  menu.style.display = "block";
  playSound(menuSound);
};
clearRankingBtn.onclick = clearRanking;

// --- Instruções ---
instructionsBtn.onclick = () => {
  menu.style.display = "none";
  instructionsScreen.style.display = "block";
  playSound(menuSound);
};

backToMenuFromInstructions.onclick = () => {
  instructionsScreen.style.display = "none";
  menu.style.display = "block";
  playSound(menuSound);
};

