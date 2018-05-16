import path from 'path';

import test from 'ava';
import clip from 'clipboardy';
import fetch from 'node-fetch';
import mock from 'mock-require';
import Deferred from 'p-defer';
import webpack from 'webpack';

import serve from '../';
import { parse } from '../lib/options';

import { load } from './util';

const nodeVersion = parseInt(process.version.substring(1), 10);

function wait(server) {
  return new Promise((resolve) => {
    server.on('listening', resolve);
  });
}

let opnPromise = Deferred();

mock('opn', (...args) => {
  opnPromise.resolve(args);
});

test('should parse json', (t) => {
  t.truthy(parse('{}'));
});

test('should handle failed parse', (t) => {
  t.true(parse('asd') === 'asd');
  t.true(parse([]) == null);
});

test.serial('should accept an add option', async (t) => {
  const config = load('./fixtures/htm/webpack.config.js');
  config.serve.add = (app, middleware) => {
    middleware.webpack();

    middleware.content({
      index: 'index.htm',
    });
  };
  const server = await serve({ config });
  const { port } = server.options;
  await wait(server);
  const result = await fetch(`http://localhost:${port}`);

  server.close();
  t.truthy(result.ok);
});

test.serial('should accept a compiler option', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  const options = Object.assign({}, config.serve);
  delete config.serve;

  const compiler = webpack(config);
  options.compiler = compiler;

  const server = await serve({ config });
  const { port } = server.options;
  await wait(server);
  const result = await fetch(`http://localhost:${port}`);

  server.close();
  t.truthy(result.ok);
});

test.serial('should accept a content option', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  config.serve.content = path.resolve(__dirname, './fixtures/content');

  const server = await serve({ config });
  const { port } = server.options;
  await wait(server);
  const result = await fetch(`http://localhost:${port}`);

  server.close();
  t.truthy(result.ok);
});

test.serial('should accept a dev option', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  config.serve = {
    dev: {
      headers: { 'X-Foo': 'Kachow' },
      logLevel: 'silent',
      publicPath: '/',
    },
  };

  const server = await serve({ config });
  const { port } = server.options;
  await wait(server);
  const result = await fetch(`http://localhost:${port}/output.js`);

  server.close();
  t.truthy(result.ok);
  t.is(result.headers.get('x-foo'), 'Kachow');
});

test.serial('should accept a dev flag', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  const flags = {
    dev: '{"publicPath":"/"}',
  };

  const server = await serve({ config, flags });
  await wait(server);

  server.close();
  t.deepEqual(server.options.dev, { publicPath: '/' });
});

test('should reject non-object dev', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  const flags = {
    dev: 'true',
  };

  try {
    await serve({ config, flags });
    t.fail();
  } catch (e) {
    t.pass();
  }
});

test.serial('should accept a host option', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  config.serve.host = '0.0.0.0';

  const server = await serve({ config });
  const { port } = server.options;
  await wait(server);
  const result = await fetch(`http://0.0.0.0:${port}`);

  server.close();
  t.truthy(result.ok);
});

// hot option tests can be found in hot.tests.js

if (nodeVersion < 9) {
  test.serial('should reject the http2 for Node < 9', async (t) => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.http2 = true;

    try {
      await serve({ config });
      t.fail();
    } catch (e) {
      t.pass();
    }
  });
} else {
  // https://nodejs.org/api/http2.html#http2_client_side_example
  test.serial('should accept a http2 option', async (t) => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.http2 = true;

    const server = await serve({ config });
    await wait(server);

    server.close();
    t.truthy(server.options.http2);
  });
}

test.todo('should accept a https option');

// logLevel and logTime option tests can be found in log.test.js

test.serial('should accept an open:Boolean option', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  config.serve.open = true;
  clip.writeSync('foo');

  const server = await serve({ config });
  await wait(server);
  const args = await opnPromise.promise;

  opnPromise = Deferred();
  server.close();

  t.is(clip.readSync(), 'foo');
  t.is(args[0], 'http://localhost:8080/');
  t.is(Object.keys(args[1]).length, 0);
});

test.serial('should accept an open:Object option', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  const opts = { app: 'Firefox', path: '/foo' };
  config.serve.open = opts;

  const server = await serve({ config });
  await wait(server);
  const args = await opnPromise.promise;

  opnPromise = Deferred();
  server.close();

  t.is(args[0], 'http://localhost:8080/foo');
  t.is(args[1], 'Firefox');
});

// NOTE: we have to test this here as we have no means to hook opn via the cli
// tests
test.serial('should accept --open-* flags', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  const flags = {
    openApp: '["Firefox","--some-arg"]',
    openPath: '/some-path',
  };

  const server = await serve({ config, flags });
  await wait(server);
  const args = await opnPromise.promise;

  server.close();

  t.is(args[0], 'http://localhost:8080/some-path');
  t.deepEqual(args[1], JSON.parse(flags.openApp));
});

test.serial('should accept a port option', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js');
  config.serve.port = '1337';

  const server = await serve({ config });
  await wait(server);
  const result = await fetch(`http://localhost:1337`);

  server.close();
  t.truthy(result.ok);
});

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
