import test from 'ava';

import serve from '../';

import { load } from './util';

function on(event, server) {
  return new Promise((resolve) => {
    server.on(event, resolve);
  });
}

test('should emit the listening event', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  const server = await serve({ config });
  const args = await on('listening', server);

  server.close();

  t.truthy(args.server);
  t.truthy(args.options);
});

test('should emit the compiler-error event', async (t) => {
  const config = load('./fixtures/error/webpack.config.js');
  const server = await serve({ config });
  const args = await on('compiler-error', server);

  server.close();

  t.truthy(args.json);
  t.truthy(args.compiler);
});

test('should emit the compiler-warning event', async (t) => {
  const config = load('./fixtures/warning/webpack.config.js');
  const server = await serve({ config });
  const args = await on('compiler-warning', server);

  server.close();

  t.truthy(args.json);
  t.truthy(args.compiler);
});

test('should emit the build-started event', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  const server = await serve({ config });
  const args = await on('build-started', server);

  server.close();

  t.truthy(args.compiler);
});

test('should emit the build-finished event', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  const server = await serve({ config });
  const args = await on('build-finished', server);

  server.close();

  t.truthy(args.stats);
  t.truthy(args.compiler);
});
