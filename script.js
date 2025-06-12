const canvas = document.getElementById('board');
const context = canvas.getContext('2d');
const rotateSound = document.getElementById('rotate-sound');
const clearSound = document.getElementById('clear-sound');
const bgMusic = document.getElementById('bg-music');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = canvas.width / COLS;
context.scale(BLOCK_SIZE, BLOCK_SIZE);

let board = createMatrix(COLS, ROWS);
let score = 0;
let lines = 0;
let level = 1;

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationId;

const colors = [
  null,
  '#1abc9c',
  '#2ecc71',
  '#3498db',
  '#9b59b6',
  '#f1c40f',
  '#e67e22',
  '#e74c3c'
];

const player = {
  pos: {x: 0, y: 0},
  matrix: null
};

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  switch (type) {
    case 'T':
      return [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0]
      ];
    case 'O':
      return [
        [2, 2],
        [2, 2]
      ];
    case 'L':
      return [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3]
      ];
    case 'J':
      return [
        [0, 4, 0],
        [0, 4, 0],
        [4, 4, 0]
      ];
    case 'I':
      return [
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0]
      ];
    case 'S':
      return [
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0]
      ];
    case 'Z':
      return [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
      ];
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
        context.strokeStyle = '#111';
        context.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#222';
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(board, {x: 0, y: 0});
  drawMatrix(player.matrix, player.pos);
}

function merge(board, piece) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        board[y + piece.pos.y][x + piece.pos.x] = value;
      }
    });
  });
}

function collide(board, piece) {
  const m = piece.matrix;
  const o = piece.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
          (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function rotate(matrix) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  matrix.forEach(row => row.reverse());
}

function playerRotate() {
  const pos = player.pos.x;
  rotate(player.matrix);
  let offset = 1;
  while (collide(board, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix);
      rotate(player.matrix);
      player.pos.x = pos;
      return;
    }
  }
  rotateSound.currentTime = 0;
  rotateSound.play();
}

function playerDrop() {
  player.pos.y++;
  if (collide(board, player)) {
    player.pos.y--;
    merge(board, player);
    playerReset();
    arenaSweep();
    updateScore();
    if (collide(board, player)) {
      gameOver();
      return;
    }
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(board, player)) {
    player.pos.x -= dir;
  }
}

function arenaSweep() {
  outer: for (let y = board.length - 1; y >= 0; --y) {
    for (let x = 0; x < board[y].length; ++x) {
      if (board[y][x] === 0) {
        continue outer;
      }
    }
    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    ++y;
    lines++;
    score += 10;
    clearSound.currentTime = 0;
    clearSound.play();
    if (lines % 10 === 0) {
      level++;
      dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    }
  }
}

function playerReset() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  animationId = requestAnimationFrame(update);
}

function updateScore() {
  document.getElementById('score').textContent = score;
  document.getElementById('lines').textContent = lines;
  document.getElementById('level').textContent = level;
}

function gameOver() {
  cancelAnimationFrame(animationId);
  document.getElementById('game-over').classList.remove('hidden');
  bgMusic.pause();
}

function start() {
  board = createMatrix(COLS, ROWS);
  score = 0;
  lines = 0;
  level = 1;
  dropInterval = 1000;
  playerReset();
  updateScore();
  document.getElementById('game-over').classList.add('hidden');
  bgMusic.currentTime = 0;
  bgMusic.play();
  lastTime = 0;
  update();
}

// Keyboard controls
document.addEventListener('keydown', event => {
  if (event.code === 'ArrowLeft') {
    playerMove(-1);
  } else if (event.code === 'ArrowRight') {
    playerMove(1);
  } else if (event.code === 'ArrowDown') {
    playerDrop();
  } else if (event.code === 'ArrowUp' || event.code === 'Space') {
    playerRotate();
  }
});

// Touch controls
['left', 'right', 'down', 'rotate'].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      if (id === 'left') playerMove(-1);
      if (id === 'right') playerMove(1);
      if (id === 'down') playerDrop();
      if (id === 'rotate') playerRotate();
    });
  }
});

document.getElementById('restart').addEventListener('click', start);

document.addEventListener('DOMContentLoaded', start);
