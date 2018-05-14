const sinon = require('sinon');
const strip = require('strip-ansi');
const weblog = require('webpack-log');

const { load, pause, run } = require('../util');

const log = console;
const og = {
  info: log.info,
  warn: log.warn,
  error: log.error,
};

function spy() {
  const noop = () => {};
  const sandbox = sinon.sandbox.create();

  log.info = noop;
  log.warn = noop;
  log.error = noop;

  sandbox.spy(log, 'info');
  sandbox.spy(log, 'warn');
  sandbox.spy(log, 'error');

  return sandbox;
}

function restore(sandbox) {
  log.info = og.info;
  log.warn = og.warn;
  log.error = og.error;
  sandbox.restore();
}

describe('webpack-serve Logging', () => {
  beforeEach(function be(done) {
    // eslint-disable-line prefer-arrow-callback
    weblog.delLogger('webpack-serve');
    pause.call(this, done);
  });

  afterAll(() => weblog.delLogger('webpack-serve'));

  it('should default logLevel to `info`', () => {
    const sandbox = spy();
    const config = load('./fixtures/basic/webpack.config.js', false);

    return run({ config }).then((server) => {
      server.compiler.hooks.done.tap('WebpackServeTest', () => {
        // server.compiler.plugin('done', () => {
        expect(log.info.callCount).toBeGreaterThan(0);
        restore(sandbox);
      });
    });
  });

  it('should silence only webpack-serve', () => {
    const sandbox = spy();
    const config = load('./fixtures/basic/webpack.config.js', false);
    config.serve = { logLevel: 'silent' };

    return run({ config }).then(() => {
      const calls = log.info.getCalls();
      expect(log.info.callCount).toBeGreaterThan(0);

      for (const call of calls) {
        const arg = strip(call.args[0]);
        expect(arg.indexOf('｢serve｣') === -1);
      }

      restore(sandbox);
    });
  });

  it('should accept a logTime option', () => {
    const sandbox = spy();
    const config = load('./fixtures/basic/webpack.config.js', false);
    config.serve = { logTime: true };

    return run({ config }).then((server) => {
      server.on('listening', () => {
        const calls = log.info.getCalls();

        expect(log.info.callCount).toBeGreaterThan(0);

        for (const call of calls) {
          const arg = strip(call.args[0]);
          if (arg.indexOf('｢serve｣') > 0) {
            expect(arg).toMatch(/^\[[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\]/);
          }
        }

        restore(sandbox);
      });
    });
  });
});
