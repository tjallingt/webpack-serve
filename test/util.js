const serve = require('../');

const timeout = process.env.CIRCLECI ? 2e3 : 1e3;

class Runner {
  constructor(...args) {
    this.server = null;
    this.args = args;
  }

  run() {
    return serve(...this.args).then((server) => {
      this.server = server;
      server.on('compiler-error', (err) => {
        throw err[0];
      });

      return new Promise((resolve) => {
        server.on('listening', () => {
          resolve(server);
        });
      });
    });
  }
}

module.exports = {
  close(server, done) {
    setTimeout(() => server.close(done), 1e3);
  },

  load(path, silent = true) {
    const raw = require(path) || {};

    if (typeof raw === 'function') {
      return raw;
    }

    const config = Array.isArray(raw) ? raw.slice(0) : Object.assign({}, raw);

    if (silent) {
      const opts = Object.assign({
        dev: { logLevel: 'silent', publicPath: '/' },
        hot: { logLevel: 'silent' },
        logLevel: 'silent',
      });

      if (Array.isArray(config)) {
        config[0].serve = Object.assign(opts, config[0].serve);
      } else {
        config.serve = Object.assign(opts, config.serve);
      }
    }

    return config;
  },

  pause(done) {
    if (process.env.CIRCLECI) {
      setTimeout(done, 2e2);
    } else {
      done();
    }
  },

  run(options, promise) {
    const runner = new Runner(options);

    return runner
      .run()
      .then(promise)
      .finally(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              if (runner.server) {
                runner.server.close(resolve);
              } else {
                resolve();
              }
            }, 1e3);
          })
      );
  },

  timeout,
};
