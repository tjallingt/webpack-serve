import path from 'path';

import test from 'ava';
import clip from 'clipboardy';

import serve from '../';
import WebpackServeError from '../lib/WebpackServeError';

import { load } from './util';

const logLevel = 'silent';

function wait(server) {
  return new Promise((resolve) => {
    server.on('listening', resolve);
  });
}

test('should exist', (t) => t.truthy(serve));

test('should export', (t) => {
  t.truthy(typeof serve === 'function');
});

test('should serve', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  const server = await serve({ config });
  await wait(server);

  server.close();

  t.truthy(server);
  t.true(typeof server.close === 'function');
  t.true(typeof server.on === 'function');
  t.regex(clip.readSync(), /http:\/\/localhost:\d+/);
});

test('should throw', async (t) => {
  const config = { bad: 'batman' };

  try {
    await serve({ config });
  } catch (e) {
    t.true(e instanceof WebpackServeError);
  }
});

test('should serve with <String> entry', async (t) => {
  const config = load('./fixtures/basic/webpack.string-entry.config.js');
  const server = await serve({ config });
  await wait(server);

  t.truthy(server);

  server.close();
});

test('should serve with MultiCompiler', async (t) => {
  const config = load('./fixtures/multi/webpack.config.js');
  const server = await serve({ config });
  await wait(server);

  t.truthy(server);

  server.close();
});

test('should serve with <Object> entry', async (t) => {
  const config = load('./fixtures/basic/webpack.object.config.js');
  const server = await serve({ config });
  await wait(server);

  t.truthy(server);

  server.close();
});

test('should serve with <Function> config', async (t) => {
  const config = './test/fixtures/basic/webpack.function.config.js';
  const server = await serve({
    config,
    logLevel,
    dev: { logLevel },
    hot: { logLevel },
  });
  await wait(server);

  t.truthy(server);

  server.close();
});

test('should serve with webpack v4 defaults', async (t) => {
  const content = path.join(__dirname, '../fixtures/webpack-4-defaults');
  const server = await serve({
    content,
    logLevel,
    dev: { logLevel },
    hot: { logLevel },
  });
  await wait(server);

  t.truthy(server);

  server.close();
});

test('should serve with partial webpack 4 defaults', async (t) => {
  const config = load(
    './fixtures/webpack-4-defaults/webpack.no-entry.config.js'
  );
  const server = await serve({ config });
  await wait(server);

  t.truthy(server);

  server.close();
});
