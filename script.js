// script.js - versão corrigida (visibilidade controlada por style.display)

// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Elementos UI
const menu = document.getElementById("menu");
const difficultyScreen = document.getElementById("difficultyScreen");
const welcomeMessage = document.getElementById("welcomeMessage");
const countdown = document.getElementById("countdown");
const gameOverScreen = document.getElementById("gameOverScreen");
const rankingScreen = document.getElementById("rankingScreen");
const instructionsScreen = document.getElementById("instructionsScreen");
const rankingList = document.getElementById("rankingList");

const playerNameInput = document.getElementById("playerNameInput");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const rankingBtn = document.getElementById("rankingBtn");
const backToMenuFromRanking = document.getElementById("backToMenuFromRanking");
const clearRankingBtn = document.getElementById("clearRankingBtn");
const instructionsBtn = document.getElementById("instructionsBtn");
const backToMenuFromInstructions = document.getElementById("backToMenuFromInstructions");
const backToMenuFromDifficulty = document.getElementById("backToMenuFromDifficulty");

// Sons (coloque os arquivos na pasta Sons/)
const jumpSound = new Audio("Sons/Pulo.wav");
const menuSound = new Audio("Sons/Menu&Ranking.mp3");
const gameplaySound = new Audio("Sons/GamePlay.mp3");
const gameOverSound = new Audio("Sons/GameOver.mp3");
const pontoSound = new Audio("Sons/Ponto.mp3");

// Imagens
const roboPulo = new Image(); roboPulo.src = "Imagens/pulo.png";
const roboQueda = new Image(); roboQueda.src = "Imagens/queda.png";

const BIRD_SIZE = 20;

// Dificuldade - Opção A: muda apenas velocidade dos canos
const pipeSpeedMap = { facil: 2, medio: 3, dificil: 4.3 };
let selectedDifficulty = "medio";

// Estado do jogo
let bird, pipes, score, gameInterval;
let frameCount = 0;
let ultimoEstadoPulo = false;
let tempoUltimoPulo = 0;
let playerName = "";
let gameRunning = false;

// Carrega último nome salvo no localStorage
const last = localStorage.getItem("flappyLastPlayer");
if (last) playerNameInput.value = last;

// Função para tocar som (com proteção para erro de autoplay)
function playSound(sound, loop = false) {
  if (!sound) return;
  sound.loop = loop;
  try {
    sound.currentTime = 0;
    sound.play();
  } catch (e) {}
}

// Inicializa visibilidade (garante estado consistente)
function showMenu() {
  menu.style.display = "block";
  difficultyScreen.style.display = "none";
  welcomeMessage.style.display = "none";
  countdown.style.display = "none";
  canvas.style.display = "none";
  gameOverScreen.style.display = "none";
  rankingScreen.style.display = "none";
  instructionsScreen.style.display = "none";
}
showMenu();
playSound(menuSound);

// -------------------- Fluxo: iniciar → escolher dificuldade → contagem → jogo
startBtn.onclick = () => {
  const name = playerNameInput.value.trim();
  if (!name || name.length < 2) {
    alert("Digite um nome com pelo menos 2 caracteres!");
    return;
  }
  playerName = name;
  localStorage.setItem("flappyLastPlayer", playerName); // salva último nome
  // mostra tela de dificuldade
  menu.style.display = "none";
  difficultyScreen.style.display = "block";
};

// voltar da difficulty para menu
backToMenuFromDifficulty.onclick = () => {
  difficultyScreen.style.display = "none";
  menu.style.display = "block";
};

// botões de dificuldade
document.querySelectorAll(".difficultyBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    const diff = btn.dataset.diff || "medio";
    selectedDifficulty = diff;
    difficultyScreen.style.display = "none";
    startCountdown(); // inicia "Boa sorte" + contador
  });
});

// Contagem regressiva (3s) com mensagem "Boa sorte, [nome]!"
function startCountdown() {
  welcomeMessage.textContent = `Boa sorte, ${playerName}!`;
  welcomeMessage.style.display = "block";
  playSound(menuSound);

  setTimeout(() => {
    welcomeMessage.style.display = "none";
    let n = 3;
    countdown.textContent = n;
    countdown.style.display = "block";

    const timer = setInterval(() => {
      n--;
      if (n >= 1) {
        countdown.textContent = n;
      } else if (n === 0) {
        countdown.textContent = "GO!";
      } else {
        clearInterval(timer);
        countdown.style.display = "none";
        startGame();
      }
    }, 1000);
  }, 1400);
}

// Inicia o jogo propriamente dito
function startGame() {
  canvas.style.display = "block";

  bird = { x: 50, y: 150, width: BIRD_SIZE, height: BIRD_SIZE, gravity: 0.5, lift: -8, velocity: 0 };
  pipes = [];
  score = 0;
  frameCount = 0;

  // som de gameplay
  try { menuSound.pause(); } catch {}
  playSound(gameplaySound, true);

  if (gameInterval) clearInterval(gameInterval);
  document.addEventListener("keydown", jump);
  document.addEventListener("click", jump);
  document.addEventListener("touchstart", jump, { passive: false });
  gameInterval = setInterval(() => updateGame(pipeSpeedMap[selectedDifficulty]), 20);
  gameRunning = true;
}

// Função de pulo
function jump(e) {
    e.preventDefault();
    if(e.type === "keydown"){
        if(e.code === "Space" || e.code === "ArrowUp"){
            doJump();
         }
    }
    if(e.type === "click" || e.type === "touchstart"){
        doJump();
    }
}

function doJump() {
    bird.velocity = bird.lift;
    try { jumpSound.currentTime = 0; jumpSound.play(); } catch (e) {}
}

// Atualiza o jogo (recebe pipeSpeed conforme dificuldade)
function updateGame(currentPipeSpeed) {
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  frameCount++;
  if (frameCount % 90 === 0) {
    const topHeight = Math.random() * 200 + 50;
    pipes.push({ x: canvas.width, topHeight: topHeight, bottomY: topHeight + 120, width: 40, passed: false });
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.x -= currentPipeSpeed;

    // colisão
    if (
      bird.x < pipe.x + pipe.width &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY)
    ) {
      endGame();
      
    }

    // pontuação
    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      score++;
      try { pontoSound.currentTime = 0; pontoSound.play(); } catch (e) {}
    }

    if (pipe.x + pipe.width < 0) pipes.splice(i, 1);
  }

  // colisão com chão/ceiling
  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    endGame();
    
  }

  drawGame();
}

// Desenha o jogo
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (bird.velocity < -2) {
    ultimoEstadoPulo = true;
    tempoUltimoPulo = Date.now();
  } else if (Date.now() - tempoUltimoPulo > 200) {
    ultimoEstadoPulo = false;
  }

  const roboAtual = ultimoEstadoPulo ? roboPulo : roboQueda;
  ctx.drawImage(roboAtual, bird.x, bird.y, BIRD_SIZE, BIRD_SIZE);

  // canos
  ctx.fillStyle = "green";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, canvas.height - pipe.bottomY);
  });

  // pontuação
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 25);
}

// Fim do jogo
function endGame() {
  gameRunning = false;
  clearInterval(gameInterval);
  document.removeEventListener("keydown", jump);
  document.removeEventListener("click", jump);
  document.removeEventListener("touchstart", jump, { passive: false });
  try { gameplaySound.pause(); } catch (e) {}
  playSound(gameOverSound);

  canvas.style.display = "none";
  gameOverScreen.style.display = "block";
  document.getElementById("finalScore").innerText = `Pontuação: ${score}`;

  saveScore(playerName, score);
}

// Ranking (localStorage)
function saveScore(name, points) {
  if (!name || typeof points !== "number") return;
  const key = "flappyRanking";
  let ranking = JSON.parse(localStorage.getItem(key)) || [];
  ranking.push({ name, points });
  ranking.sort((a,b) => b.points - a.points);
  localStorage.setItem(key, JSON.stringify(ranking.slice(0,10)));
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
    .map((r,i) => `<li>${i+1}. ${r.name} - ${r.points} pts</li>`)
    .join("");
}

function clearRanking() {
  if (confirm("Tem certeza que deseja limpar o ranking?")) {
    localStorage.removeItem("flappyRanking");
    rankingList.innerHTML = "";
  }
}

// Handlers UI
restartBtn.onclick = () => {
  // mantém o nome no campo
  playerNameInput.value = playerName || localStorage.getItem("flappyLastPlayer") || "";
  gameOverScreen.style.display = "none";
  difficultyScreen.style.display = "block"; // volta para escolher dificuldade
  playSound(menuSound);
};

backToMenuBtn.onclick = () => {
  gameOverScreen.style.display = "none";
  menu.style.display = "block";
  playerNameInput.value = playerName || localStorage.getItem("flappyLastPlayer") || "";
  playSound(menuSound);
};

rankingBtn.onclick = showRanking;
backToMenuFromRanking.onclick = () => {
  rankingScreen.style.display = "none";
  menu.style.display = "block";
  playSound(menuSound);
};
clearRankingBtn.onclick = clearRanking;

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
