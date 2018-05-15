const path = require('path');

const assert = require('power-assert');
const execa = require('execa');
const fetch = require('node-fetch');
const strip = require('strip-ansi');
const WebSocket = require('ws');

const { pause, timeout } = require('../util');

const cliPath = path.resolve(__dirname, '../../lib/cli.js');
const configPath = path.resolve(
  __dirname,
  '../fixtures/basic/webpack.config.js'
);

// NOTE: keep this around in case we need to examine the output from a command
// function pipe(proc) {
//   // eslint-disable-line no-unused-vars
//   const stream = proc.stdout;
//   stream.pipe(process.stdout);
// }

function x(fn, ...args) {
  const proc = execa(...args);
  // webpack@4 has a lot more warnings
  const ready = new RegExp('(Compiled successfully)|(Compiled with warnings)');

  proc.stdout.on('data', (data) => {
    if (ready.test(data.toString())) {
      fn(proc);
    }
  });

  // pipe(proc);

  return proc;
}

describe('webpack-serve CLI', () => {
  beforeEach(pause);

  it('should show help with --help', (done) => {
    const proc = execa(cliPath, ['--help']);

    proc.then((result) => {
      assert(strip(result.stdout).indexOf('Usage') > 0);
      done();
    });
  });

  it('should run webpack-serve [config]', (done) => {
    x(
      (proc) => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      [configPath]
    );
  });

  it('should run webpack-serve --config', (done) => {
    x(
      (proc) => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      ['--config', configPath]
    );
  });

  it('should run webpack-serve and find the config', (done) => {
    x(
      (proc) => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      { cwd: path.resolve(__dirname, '../fixtures/basic') }
    );
  });

  it('should run webpack-serve with webpack v4 defaults', (done) => {
    x(
      (proc) => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      { cwd: path.resolve(__dirname, '../fixtures/webpack-4-defaults') }
    );
  });

  it('should use the --content flag', (done) => {
    const confPath = path.resolve(
      __dirname,
      '../fixtures/content/webpack.config.js'
    );
    const contentPath = path.join(__dirname, '../fixtures/content');

    x(
      (proc) => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      ['--config', confPath, '--content', contentPath]
    );
  });

  it('should use the --host flag', (done) => {
    x(
      (proc) => {
        fetch('http://0.0.0.0:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      ['--config', configPath, '--host', '0.0.0.0']
    );
  });

  // need to get devcert documentation going and then write tests
  // for the http2 test: https://nodejs.org/api/http2.html#http2_client_side_example
  it('should use the --http2 flag');
  it('should use the --https-cert flag');
  it('should use the --https-key flag');
  it('should use the --https-pass flag');
  it('should use the --https-pfx flag');

  it('should use the --log-level flag', (done) => {
    const proc = execa(cliPath, [
      '--config',
      configPath,
      '--log-level',
      'silent',
    ]);

    proc.then((result) => {
      assert.equal(result.stdout, '');
      done();
    });

    setTimeout(() => {
      // resolves the proc promise
      proc.kill('SIGINT');
    }, timeout);
  });

  it('should use the --log-time flag', (done) => {
    const proc = execa(cliPath, ['--config', configPath, '--log-time']);

    proc.then((result) => {
      const lines = result.stdout
        .split('\n')
        .map((l) => strip(l))
        .filter((l) => l.indexOf('ℹ ｢') > 0);

      assert(lines.length > 0);

      for (const line of lines) {
        assert(/^\[[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\]/.test(line));
      }

      done();
    });

    proc.stdout.pipe(process.stdout);

    setTimeout(() => {
      // resolves the proc promise
      proc.kill('SIGINT');
    }, timeout);
  });

  it('should use the --port flag', (done) => {
    x(
      (proc) => {
        fetch('http://localhost:1337').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      ['--config', configPath, '--port', 1337]
    );
  });

  it('should exit on thrown Error', (done) => {
    const confPath = path.resolve(
      __dirname,
      '../fixtures/basic/webpack.config-error.config.js'
    );
    const proc = x(() => {}, cliPath, ['--config', confPath]);

    proc.catch(() => {
      assert(true);
      done();
    });
  });

  it('should use the --no-hot-client flag', (done) => {
    x(
      (proc) => {
        const socket = new WebSocket('ws://localhost:8081');

        socket.on('error', (error) => {
          // this asserts that the WebSocketServer is not running, a sure sign
          // that webpack-hot-client has been disabled.
          assert(/ECONNREFUSED/.test(error.message));
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      ['--config', configPath, '--no-hot-client']
    );
  });

  it('should use the --require flag', (done) => {
    const confPath = path.resolve(
      __dirname,
      '../fixtures/basic/webpack.env.config.js'
    );
    const requireCwd = path.dirname(confPath);
    const requirePath = './preload-env.js';
    x(
      (proc) => {
        fetch('http://localhost:8080').then((res) => {
          assert(res.ok);
          proc.kill('SIGINT');
          done();
        });
      },
      cliPath,
      ['--config', configPath, '--require', requirePath],
      { cwd: requireCwd }
    );
  });
});
