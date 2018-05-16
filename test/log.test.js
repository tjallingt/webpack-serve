import test from 'ava';
import sinon from 'sinon';
import strip from 'strip-ansi';
import weblog from 'webpack-log';

import serve from '../';

import { load } from './util';

/* eslint-disable no-console, no-param-reassign */

const log = console;

function wait(server) {
  return new Promise((resolve) => {
    server.on('listening', resolve);
  });
}

test.serial.before((t) => {
  const noop = () => {};
  const sandbox = sinon.sandbox.create();

  log.info = noop;
  log.warn = noop;
  log.error = noop;

  sandbox.spy(log, 'info');
  sandbox.spy(log, 'warn');
  sandbox.spy(log, 'error');

  t.context.sandbox = sandbox;
});

test.serial.beforeEach(() => {
  weblog.delLogger('webpack-serve');
});

test.serial.afterEach((t) => {
  t.context.sandbox.reset();
});

test.serial('should default logLevel to `info`', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js', false);
  const server = await serve({ config });

  await wait(server);

  t.true(log.info.callCount > 0);
  server.close();
});

test.serial('should silence only webpack-serve', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js', false);
  config.serve = { logLevel: 'silent' };

  const server = await serve({ config });

  await wait(server);
  server.close();

  const calls = log.info.getCalls();
  t.true(log.info.callCount > 0);

  for (const call of calls) {
    const arg = strip(call.args[0]);
    t.true(arg.indexOf('｢serve｣') === -1);
  }
});

test('should accept a logTime option', async (t) => {
  const config = load('./fixtures/basic/webpack.config.js', false);
  config.serve = { logTime: true };

  const server = await serve({ config });

  await wait(server);
  server.close();

  const calls = log.info.getCalls();
  t.true(log.info.callCount > 0);

  for (const call of calls) {
    const arg = strip(call.args[0]);
    if (arg.indexOf('｢serve｣') > 0) {
      t.regex(arg, /^\[[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\]/);
    }
  }
});

// describe('webpack-serve Logging', () => {
//   before(pause);
//   beforeEach(function be(done) {
//     // eslint-disable-line prefer-arrow-callback
//     weblog.delLogger('webpack-serve');
//     pause.call(this, done);
//   });
//
//   after(() => weblog.delLogger('webpack-serve'));
//
//   t('should default logLevel to `info`', (done) => {
//     const sandbox = spy();
//     const config = load('./fixtures/basic/webpack.config.js', false);
//
//     serve({ config }).then((server) => {
//       server.compiler.hooks.done.tap('WebpackServeTest', () => {
//         // server.compiler.plugin('done', () => {
//         assert(log.info.callCount > 0);
//         restore(sandbox);
//         server.close(done);
//       });
//     });
//   });
//
//   t('should silence only webpack-serve', (done) => {
//     const sandbox = spy();
//     const config = load('./fixtures/basic/webpack.config.js', false);
//     config.serve = { logLevel: 'silent' };
//
//     serve({ config }).then((server) => {
//       setTimeout(() => {
//         const calls = log.info.getCalls();
//         assert(log.info.callCount > 0);
//
//         for (const call of calls) {
//           const arg = strip(call.args[0]);
//           assert(arg.indexOf('｢serve｣') === -1);
//         }
//
//         restore(sandbox);
//         server.close(done);
//       }, timeout * 2);
//     });
//   });
//
//   t('should accept a logTime option', (done) => {
//     const sandbox = spy();
//     const config = load('./fixtures/basic/webpack.config.js', false);
//     config.serve = { logTime: true };
//
//     serve({ config }).then((server) => {
//       server.on('listening', () => {
//         const calls = log.info.getCalls();
//
//         assert(log.info.callCount > 0);
//
//         for (const call of calls) {
//           const arg = strip(call.args[0]);
//           if (arg.indexOf('｢serve｣') > 0) {
//             assert(/^\[[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\]/.test(arg));
//           }
//         }
//
//         restore(sandbox);
//         server.close(done);
//       });
//     });
//   });
// });
