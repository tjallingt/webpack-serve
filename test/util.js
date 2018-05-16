const { register } = require('../lib/global');

register();
process.setMaxListeners(20);

module.exports = {
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
};
