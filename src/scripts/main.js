'use strict';
import Game from '../modules/Game.class.js';

// Uncomment the next lines to use your game instance in the browser
const game = new Game();

// Write your code here

const cells = document.querySelectorAll('.field-cell');
const scoreElement = document.querySelector('.game-score');
const startButton = document.querySelector('.start');
const startMessage = document.querySelector('.message-start');
const winMessage = document.querySelector('.message-win');
const loseMessage = document.querySelector('.message-lose');
const gameField = document.querySelector('.game-field');

// Wrap game field in a relative container for the tile overlay
const wrapper = document.createElement('div');

wrapper.className = 'game-field-wrapper';
gameField.parentNode.insertBefore(wrapper, gameField);
wrapper.appendChild(gameField);

const overlay = document.createElement('div');

overlay.className = 'tile-overlay';
wrapper.appendChild(overlay);

const CELL_SIZE = 75;
const CELL_GAP = 10;
const ANIM_MS = 120;

function tileXY(row, col) {
  return {
    x: CELL_GAP + col * (CELL_SIZE + CELL_GAP),
    y: CELL_GAP + row * (CELL_SIZE + CELL_GAP),
  };
}

function createTileEl(value, row, col) {
  const pos = document.createElement('div');

  pos.className = 'tile-pos';

  const { x, y } = tileXY(row, col);

  pos.style.transform = `translate(${x}px, ${y}px)`;

  const tile = document.createElement('div');

  tile.className = `tile tile--${value}`;
  tile.textContent = value;
  pos.appendChild(tile);
  overlay.appendChild(pos);

  return pos;
}

function renderTiles(state, mergedSet = new Set(), newRow = -1, newCol = -1) {
  overlay.innerHTML = '';

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (state[row][col] !== 0) {
        const pos = createTileEl(state[row][col], row, col);
        const tile = pos.querySelector('.tile');

        if (row === newRow && col === newCol) {
          tile.classList.add('tile--appear');
        } else if (mergedSet.has(`${row},${col}`)) {
          tile.classList.add('tile--merge');
        }
      }
    }
  }
}

function render() {
  cells.forEach((cell) => {
    cell.className = 'field-cell';
    cell.textContent = '';
  });

  scoreElement.textContent = game.getScore();
  renderTiles(game.getState());
}

startButton.addEventListener('click', () => {
  if (game.status === 'win') {
    winMessage.classList.add('hidden');
  }

  if (game.status === 'lose') {
    loseMessage.classList.add('hidden');
  }

  if (!startMessage.classList.contains('hidden')) {
    startMessage.classList.add('hidden');
  }

  if (game.getStatus() === 'idle') {
    game.start();
    startButton.innerHTML = 'Restart';
    startButton.classList.remove('start');
    startButton.classList.add('restart');
  } else {
    game.restart();
  }
  render();
});

let isAnimating = false;

window.addEventListener('keydown', async (e) => {
  if (isAnimating || game.getStatus() !== 'playing') {
    return;
  }

  const snap = game.getState().map((row) => [...row]);

  switch (e.key) {
    case 'ArrowUp':
      game.moveUp();
      break;
    case 'ArrowDown':
      game.moveDown();
      break;
    case 'ArrowLeft':
      game.moveLeft();
      break;
    case 'ArrowRight':
      game.moveRight();
      break;
    default:
      return;
  }

  let changed = false;

  for (let i = 0; i < 4 && !changed; i++) {
    for (let x = 0; x < 4; x++) {
      if (snap[i][x] !== game.state[i][x]) {
        changed = true;
        break;
      }
    }
  }

  if (!changed) {
    return;
  }

  isAnimating = true;

  // Build tile elements at old positions, no transition yet
  overlay.innerHTML = '';

  const tileMap = new Map();

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (snap[row][col] !== 0) {
        const pos = createTileEl(snap[row][col], row, col);

        pos.style.transition = 'none';
        tileMap.set(`${row},${col}`, pos);
      }
    }
  }

  // Force reflow so transition: none takes effect
  overlay.getBoundingClientRect();

  // Slide tiles to new positions
  const moves = game.lastMoves;

  for (const move of moves) {
    const pos = tileMap.get(`${move.fromRow},${move.fromCol}`);

    if (pos) {
      const { x, y } = tileXY(move.toRow, move.toCol);

      pos.style.transition = `transform ${ANIM_MS}ms ease`;
      pos.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, ANIM_MS));

  // Add random tile and find its position
  const stateBeforeRandom = game.getState().map((row) => [...row]);

  game.addRandom();

  const newState = game.getState();
  let newRow = -1;
  let newCol = -1;

  outer: for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (stateBeforeRandom[row][col] === 0 && newState[row][col] !== 0) {
        newRow = row;
        newCol = col;
        break outer;
      }
    }
  }

  const mergedSet = new Set(
    moves.filter((m) => m.merged).map((m) => `${m.toRow},${m.toCol}`),
  );

  renderTiles(newState, mergedSet, newRow, newCol);

  scoreElement.textContent = game.getScore();
  isAnimating = false;

  if (game.checkWin()) {
    winMessage.classList.remove('hidden');
  }

  if (game.checkLose()) {
    loseMessage.classList.remove('hidden');
  }
});
