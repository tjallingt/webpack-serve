import test from 'ava';
import fetch from 'node-fetch';
import portUsed from 'tcp-port-used';
import WebSocket from 'ws';

import serve from '../';

import { load } from './util';

function wait(server) {
  return new Promise((resolve) => {
    server.on('listening', resolve);
  });
}

test.serial('should accept a hot flag', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  const flags = {
    hot: '{"hot":false}',
  };

  const server = await serve({ config, flags });
  await wait(server);

  server.close();
  t.is(server.options.hot.hot, false);
});

test('should reject non-object hot', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  const flags = {
    hot: 'true',
  };

  try {
    await serve({ config, flags });
    t.fail();
  } catch (e) {
    t.pass();
  }
});

test('should not accept a mismatched hot.host option', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  config.serve.host = '0.0.0.0';
  config.serve.hot = { host: 'localhost' };

  try {
    await serve({ config });
    t.fail();
  } catch (e) {
    t.pass();
  }
});

test('should not accept a mismatched hot.host.server option', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  config.serve.host = '0.0.0.0';
  config.serve.hot = {
    host: {
      server: '10.1.1.1',
      client: 'localhost',
    },
  };

  try {
    await serve({ config });
    t.fail();
  } catch (e) {
    t.pass();
  }
});

test.serial('should accept a matching hot.host option', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  config.serve.host = '0.0.0.0';
  config.serve.hot = { host: '0.0.0.0' };

  const server = await serve({ config });
  const { port } = server.options;
  await wait(server);
  const result = await fetch(`http://0.0.0.0:${port}`);

  server.close();
  t.truthy(result.ok);
});

test.serial('should accept a matching hot.host.server option', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  config.serve.host = '0.0.0.0';
  config.serve.hot = {
    host: {
      server: '0.0.0.0',
      client: 'localhost',
    },
  };

  const server = await serve({ config });
  const { port } = server.options;
  await wait(server);
  const result = await fetch(`http://0.0.0.0:${port}`);

  server.close();
  t.truthy(result.ok);
});

test.serial('should accept a hot.hot option of `false`', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  config.serve.hot = false;

  const server = await serve({ config });
  const { port } = server.options;
  await wait(server);
  const result = await fetch(`http://localhost:${port}`);

  server.close();
  t.truthy(result.ok);
});

test.serial('should accept a hot option of `true`', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  config.serve.hot = true;

  const server = await serve({ config });
  await wait(server);

  server.close();
  t.true(typeof server.options.hot === 'object');
});

test.serial(
  'should accept a hot option of `false` and disable hot-client',
  async (t) => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.hot = false;

    // this isn't ideal, but we have to be sure that the other socket servers
    // from the other tests have had time to shut down.
    await new Promise((resolve) => {
      setTimeout(resolve, 2e3);
    });

    // assert that 8081 is free
    await portUsed.check(8081, '127.0.0.1');

    const server = await serve({ config });
    await wait(server);
    const message = await new Promise((resolve) => {
      const socket = new WebSocket('ws://localhost:8081');

      socket.on('error', (error) => {
        resolve(error.message);
      });
    });

    server.close();

    t.regex(message, /ECONNREFUSED/);
  }
);

test('should merge child options', async (t) => {
  const config = load(
    './fixtures/basic/webpack.options-merge.config.js',
    false
  );

  const server = await serve({ config });
  await wait(server);

  t.truthy(server.options);
  t.true(server.options.dev.logLevel === 'error');
  t.true(server.options.dev.publicPath === '/');

  server.close();
});
