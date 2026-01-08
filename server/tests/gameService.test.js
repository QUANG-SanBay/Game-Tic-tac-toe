// unit tests cho checkWinner và flow cơ bản của game Service
import { jest } from '@jest/globals';

let gameServiceModule;

beforeEach(async () => {
  jest.resetModules();
  gameServiceModule = await import('../src/services/gameService.js');
});

describe('gameService.checkWinner', () => {
  test('detects a win', () => {
    const board = ['X', 'X', 'X', null, null, null, null, null, null];
    const res = gameServiceModule.checkWinner(board);
    expect(res).toEqual({ status: 'win', winner: 'X' });
  });

  test('detects a draw', () => {
    const board = ['X','O','X','X','O','O','O','X','X'];
    const res = gameServiceModule.checkWinner(board);
    expect(res).toEqual({ status: 'draw' });
  });

  test('returns null when no winner', () => {
    const board = [null, null, null, null, null, null, null, null, null];
    const res = gameServiceModule.checkWinner(board);
    expect(res).toBeNull();
  });
});

describe('gameService flow (join/move/forfeit)', () => {
  test('two players can join and make a valid move', async () => {
    const { gameService } = await import('../src/services/gameService.js');

    const p1 = 's1';
    const p2 = 's2';

    const j1 = gameService.joinGame(p1);
    expect(j1.symbol).toBe('X');
    expect(j1.waiting).toBe(true);

    const j2 = gameService.joinGame(p2);
    expect(j2.symbol).toBe('O');
    expect(j2.waiting).toBe(false);

    const move1 = gameService.makeMove(p1, 0);
    expect(move1.ok).toBe(true);
    expect(move1.state).toBe('playing');
    expect(move1.board[0]).toBe('X');
  });

  test('forfeit reports winner', async () => {
    const { gameService } = await import('../src/services/gameService.js');
    const p1 = 'a1';
    const p2 = 'a2';
    gameService.joinGame(p1);
    gameService.joinGame(p2);

    const res = gameService.forfeit(p1);
    expect(res.ok).toBe(true);
    expect(res.result.status).toBe('win');
  });
});
