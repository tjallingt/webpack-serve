import path from 'path';

import test from 'ava';
import execa from 'execa';
import fetch from 'node-fetch';
import strip from 'strip-ansi';
import portUsed from 'tcp-port-used';
import WebSocket from 'ws';

const cliPath = path.resolve(__dirname, '../cli.js');
const configPath = path.resolve(
  __dirname,
  './fixtures/basic/webpack.config.js'
);

async function run(...args) {
  args.unshift(cliPath);

  await portUsed.check(8080, '127.0.0.1');

  const proc = execa(...args);
  const reReady = new RegExp(
    '(Compiled successfully)|(Compiled with warnings)'
  );

  // NOTE: uncomment to examine process output
  // const stream = proc.stdout;
  // const stream = proc.stderr;
  // stream.pipe(process.stdout);

  const result = await new Promise((resolve) => {
    proc.stdout.on('data', (data) => {
      if (reReady.test(data.toString())) {
        resolve({
          close: () => proc.kill('SIGINT'),
          childProcess: proc,
        });
      }
    });
  });

  return result;
}

test.serial('should show help with --help', async (t) => {
  // NOTE: process self-terminates
  const process = await execa(cliPath, ['--help']);

  t.true(strip(process.stdout).indexOf('Usage') > 0);
});

test.serial('should run webpack-serve [config]', async (t) => {
  const flags = [configPath];
  const { close } = await run(flags);
  const result = await fetch('http://localhost:8080');

  close();
  t.truthy(result.ok);
});

test.serial('should run webpack-serve --config', async (t) => {
  const flags = ['--config', configPath];
  const { close } = await run(flags);
  const result = await fetch('http://localhost:8080');

  close();
  t.truthy(result.ok);
});

test.serial('should run webpack-serve and find the config', async (t) => {
  const options = { cwd: path.resolve(__dirname, './fixtures/basic') };
  const { close } = await run(options);
  const result = await fetch('http://localhost:8080');

  close();
  t.truthy(result.ok);
});

test.serial('should run webpack-serve with webpack v4 defaults', async (t) => {
  const options = {
    cwd: path.resolve(__dirname, './fixtures/webpack-4-defaults'),
  };
  const { close } = await run(options);
  const result = await fetch('http://localhost:8080');

  close();
  t.truthy(result.ok);
});

test.serial('should use the --content flag', async (t) => {
  const customPath = path.resolve(
    __dirname,
    './fixtures/content/webpack.config.js'
  );
  const contentPath = path.join(__dirname, './fixtures/content');
  const flags = ['--config', customPath, '--content', contentPath];
  const { close } = await run(flags);
  const result = await fetch('http://localhost:8080');

  close();
  t.truthy(result.ok);
});

test.serial('should use the --host flag', async (t) => {
  const flags = ['--config', configPath, '--host', '0.0.0.0'];
  const { close } = await run(flags);
  const result = await fetch('http://0.0.0.0:8080');

  close();
  t.truthy(result.ok);
});

// need to get devcert documentation going and then write tests
// for the http2 test: https://nodejs.org/api/http2.html#http2_client_side_example
test.todo('should use the --http2 flag');
test.todo('should use the --https-cert flag');
test.todo('should use the --https-key flag');
test.todo('should use the --https-pass flag');
test.todo('should use the --https-pfx flag');

test.serial('should use the --log-level flag', async (t) => {
  await portUsed.check(8080, '127.0.0.1');

  const flags = ['--config', configPath, '--log-level', 'silent'];
  const proc = execa(cliPath, flags);

  setTimeout(() => proc.kill('SIGINT'), 2e3);

  const result = await proc;
  t.is(result.stdout, '');
});

test('should use the --log-time flag', async (t) => {
  await portUsed.check(8080, '127.0.0.1');

  const flags = ['--config', configPath, '--log-time'];
  const proc = execa(cliPath, flags);

  setTimeout(() => proc.kill('SIGINT'), 2e3);

  const result = await proc;
  const lines = result.stdout
    .split('\n')
    .map((l) => strip(l))
    .filter((l) => l.indexOf('ℹ ｢') > 0);

  t.true(lines.length > 0);

  for (const line of lines) {
    t.regex(line, /^\[[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\]/);
  }
});

test.serial('should use the --port flag', async (t) => {
  const flags = ['--config', configPath, '--port', 1337];
  const { close } = await run(flags);
  const result = await fetch('http://localhost:1337');

  close();
  t.truthy(result.ok);
});

test.serial('should exit on thrown Error', async (t) => {
  await portUsed.check(8080, '127.0.0.1');

  const confPath = path.resolve(
    __dirname,
    '../fixtures/basic/webpack.config-error.config.js'
  );

  try {
    await execa(cliPath, ['--config', confPath]);
  } catch (e) {
    t.pass();
  }
});

test.serial('should use the --no-hot-client flag', async (t) => {
  // make sure previous instances have closed
  await portUsed.check(8081, 'localhost');

  const flags = ['--config', configPath, '--no-hot-client'];
  const { close } = await run(flags);

  const message = await new Promise((resolve) => {
    const socket = new WebSocket('ws://localhost:8081');

    socket.on('error', (error) => {
      resolve(error.message);
    });
  });

  // this asserts that the WebSocketServer is not running, a sure sign
  // that webpack-hot-client has been disabled.
  t.regex(message, /ECONNREFUSED/);
  close();
});

test.serial('should use the --require flag', async (t) => {
  const confPath = path.resolve(
    __dirname,
    './fixtures/basic/webpack.env.config.js'
  );
  const requireCwd = path.dirname(confPath);
  const flags = ['--config', confPath, '--require', './preload-env.js'];
  const { close } = await run(flags, { cwd: requireCwd });
  const result = await fetch('http://localhost:8080');

  close();
  t.truthy(result.ok);
});
