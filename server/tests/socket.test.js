// integration test cho Socket.IO (2 client)
import { jest } from '@jest/globals';
import http from 'http';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import setupSocket from '../src/config/socket.js';

jest.setTimeout(10000);

describe('Socket.IO integration', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = http.createServer(app);
    setupSocket(server);
    server.listen(() => {
      // @ts-ignore
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  test('two clients can join and receive updates', (done) => {
    const url = `http://localhost:${port}`;
    const c1 = new Client(url, { transports: ['websocket'] });
    const c2 = new Client(url, { transports: ['websocket'] });
    let initCount = 0;
    let c1Symbol = null;
    let c2Symbol = null;

    c1.on('init', (data) => {
      expect(data).toHaveProperty('symbol');
      c1Symbol = data.symbol;
      initCount += 1;
      if (initCount === 2) afterBoth();
    });

    c2.on('init', (data) => {
      expect(data).toHaveProperty('symbol');
      c2Symbol = data.symbol;
      initCount += 1;
      if (initCount === 2) afterBoth();
    });

    let c1SeenFirstUpdate = false;
    let c2SeenFirstUpdate = false;
    let joinUpdateCount = 0;

    function afterBoth() {
      // wait until both clients received the initial join 'update' before making a move
      if (c1SeenFirstUpdate && c2SeenFirstUpdate) {
        if (c1Symbol === 'X') c1.emit('makeMove', 0);
        else c2.emit('makeMove', 0);
      }
    }

    c1.on('update', (data) => {
      if (!c1SeenFirstUpdate) {
        c1SeenFirstUpdate = true;
        joinUpdateCount += 1;
        if (joinUpdateCount === 2) afterBoth();
        return; // ignore the join update
      }
      // this is the update after the move
      expect(data.board[0]).toBe('X');
      cleanup();
    });

    c2.on('update', (data) => {
      if (!c2SeenFirstUpdate) {
        c2SeenFirstUpdate = true;
        joinUpdateCount += 1;
        if (joinUpdateCount === 2) afterBoth();
        return;
      }
      expect(data.board[0]).toBe('X');
    });

    function cleanup() {
      c1.disconnect();
      c2.disconnect();
      done();
    }

    // start the flow
    c1.on('connect', () => c1.emit('joinGame'));
    c2.on('connect', () => c2.emit('joinGame'));
  });
});
