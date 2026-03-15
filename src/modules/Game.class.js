'use strict';

const gameStatus = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WIN: 'win',
  LOSE: 'lose',
};

const defIniState = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

/**
 * This class represents the game.
 * Now it has a basic structure, that is needed for testing.
 * Feel free to add more props and methods if needed.
 */
class Game {
  /**
   * Creates a new game instance.
   *
   * @param {number[][]} initialState
   * The initial state of the board.
   * @default
   * [[0, 0, 0, 0],
   *  [0, 0, 0, 0],
   *  [0, 0, 0, 0],
   *  [0, 0, 0, 0]]
   *
   * If passed, the board will be initialized with the provided
   * initial state.
   */
  constructor(initialState) {
    this.initialState = initialState || defIniState;
    this.state = this.initialState.map((row) => [...row]);
    this.score = 0;
    this.status = gameStatus.IDLE;
    this.lastMoves = [];
  }

  selectRandomField() {
    const emptyCells = [];

    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        if (this.state[x][y] === 0) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);

    return emptyCells[randomIndex];
  }

  addRandom() {
    const cell = this.selectRandomField();

    if (cell === null) {
      return;
    }

    const val = Math.random() < 0.1 ? 4 : 2;

    this.state[cell.x][cell.y] = val;
  }

  processLine(array) {
    const filtered = array
      .map((val, idx) => ({ val, origIdx: idx }))
      .filter((el) => el.val !== 0);

    const res = [];
    const moves = [];
    let i = 0;
    let resultIdx = 0;

    while (i < filtered.length) {
      if (
        i < filtered.length - 1 &&
        filtered[i].val === filtered[i + 1].val
      ) {
        res.push(filtered[i].val * 2);
        this.score += filtered[i].val * 2;
        moves.push({ from: filtered[i].origIdx, to: resultIdx, merged: false });
        moves.push({
          from: filtered[i + 1].origIdx,
          to: resultIdx,
          merged: true,
        });
        i += 2;
      } else {
        res.push(filtered[i].val);
        moves.push({ from: filtered[i].origIdx, to: resultIdx, merged: false });
        i += 1;
      }
      resultIdx++;
    }

    while (res.length < 4) {
      res.push(0);
    }

    return { result: res, moves };
  }

  moveLeft() {
    if (this.status !== gameStatus.PLAYING) {
      return;
    }
    this.lastMoves = [];

    const newState = [];

    for (let row = 0; row < 4; row++) {
      const { result, moves } = this.processLine(this.state[row]);

      newState.push(result);
      moves.forEach((move) => {
        this.lastMoves.push({
          fromRow: row,
          fromCol: move.from,
          toRow: row,
          toCol: move.to,
          merged: move.merged,
        });
      });
    }
    this.state = newState;
  }

  moveRight() {
    if (this.status !== gameStatus.PLAYING) {
      return;
    }
    this.lastMoves = [];

    const newState = [];

    for (let row = 0; row < 4; row++) {
      const reversed = [...this.state[row]].reverse();
      const { result, moves } = this.processLine(reversed);

      newState.push(result.reverse());
      moves.forEach((move) => {
        this.lastMoves.push({
          fromRow: row,
          fromCol: 3 - move.from,
          toRow: row,
          toCol: 3 - move.to,
          merged: move.merged,
        });
      });
    }
    this.state = newState;
  }

  moveUp() {
    if (this.status !== gameStatus.PLAYING) {
      return;
    }
    this.lastMoves = [];

    const newState = [[], [], [], []];

    for (let col = 0; col < 4; col++) {
      const column = [
        this.state[0][col],
        this.state[1][col],
        this.state[2][col],
        this.state[3][col],
      ];
      const { result, moves } = this.processLine(column);

      for (let row = 0; row < 4; row++) {
        newState[row][col] = result[row];
      }
      moves.forEach((move) => {
        this.lastMoves.push({
          fromRow: move.from,
          fromCol: col,
          toRow: move.to,
          toCol: col,
          merged: move.merged,
        });
      });
    }
    this.state = newState;
  }

  moveDown() {
    if (this.status !== gameStatus.PLAYING) {
      return;
    }
    this.lastMoves = [];

    const newState = [[], [], [], []];

    for (let col = 0; col < 4; col++) {
      const column = [
        this.state[0][col],
        this.state[1][col],
        this.state[2][col],
        this.state[3][col],
      ];
      const reversed = [...column].reverse();
      const { result, moves } = this.processLine(reversed);
      const finalResult = result.reverse();

      for (let row = 0; row < 4; row++) {
        newState[row][col] = finalResult[row];
      }
      moves.forEach((move) => {
        this.lastMoves.push({
          fromRow: 3 - move.from,
          fromCol: col,
          toRow: 3 - move.to,
          toCol: col,
          merged: move.merged,
        });
      });
    }
    this.state = newState;
  }

  /**
   * @returns {number}
   */
  getScore() {
    return this.score;
  }

  /**
   * @returns {number[][]}
   */
  getState() {
    return this.state;
  }

  /**
   * Returns the current game status.
   *
   * @returns {string} One of: 'idle', 'playing', 'win', 'lose'
   *
   * `idle` - the game has not started yet (the initial state);
   * `playing` - the game is in progress;
   * `win` - the game is won;
   * `lose` - the game is lost
   */
  getStatus() {
    return this.status;
  }

  checkWin() {
    const win = this.state.some((el) => el.some((sub) => sub === 2 ** 11));

    if (win) {
      this.status = gameStatus.WIN;

      return true;
    }

    return false;
  }

  checkLose() {
    if (this.state.some((el) => el.some((sub) => sub === 0))) {
      return false;
    }

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const current = this.state[row][col];

        if (col < 3 && this.state[row][col + 1] === current) {
          return false;
        }

        if (row < 3 && this.state[row + 1][col] === current) {
          return false;
        }
      }
    }

    this.status = gameStatus.LOSE;

    return true;
  }

  /**
   * Starts the game.
   */
  start() {
    this.state = this.initialState.map((row) => [...row]);
    this.status = gameStatus.PLAYING;
    this.addRandom();
    this.addRandom();
  }

  /**
   * Resets the game.
   */
  restart() {
    this.state = this.initialState.map((row) => [...row]);
    this.score = 0;
    this.status = gameStatus.IDLE;
  }
}

export default Game;
