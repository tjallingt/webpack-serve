const path = require('path');

const clip = require('clipboardy');
const fetch = require('node-fetch');
const mock = require('mock-require');
const webpack = require('webpack'); // eslint-disable-line import/order
const WebSocket = require('ws');

const { parse } = require('../../lib/options');
const util = require('../util');

const nodeVersion = parseInt(process.version.substring(1), 10);

const { load, pause, run } = util;
let hook;

function runFetch(options, fn, requestPath = '') {
  return run(options, (server) =>
    fetch(
      `http://${server.options.host}:${server.options.port}${requestPath}`
    ).then(fn)
  );
}

mock('opn', (...args) => {
  hook(...args);
});

describe('webpack-serve Options', () => {
  beforeAll(pause);
  beforeEach(pause);
  afterEach(() => {
    hook = null;
  });

  it('should parse json', () => {
    expect(parse('{}'));
  });

  it('should handle failed parse', () => {
    expect(parse('asd') === 'asd');
    expect(parse([]) == null);
  });

  it('should accept an add option', () => {
    const config = load('./fixtures/htm/webpack.config.js');
    config.serve.add = (app, middleware) => {
      middleware.webpack();

      middleware.content({
        index: 'index.htm',
      });
    };

    return runFetch({ config }, (res) => {
      expect(res.ok);
    });
  });

  it('should accept a compiler option', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    const options = Object.assign({}, config.serve);
    delete config.serve;

    const compiler = webpack(config);
    options.compiler = compiler;

    return runFetch(options, (res) => {
      expect(res.ok);
    });
  });

  it('should accept a content option', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.content = path.resolve(__dirname, '../fixtures/content');

    return runFetch({ config }, (res) => {
      expect(res.ok);
    });
  });

  it('should accept a clipboard option', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.clipboard = false;
    clip.writeSync('foo');

    return run({ config }).then(() => {
      expect(clip.readSync()).toBe('foo');
    });
  });

  it('should accept a dev option', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve = {
      dev: {
        headers: { 'X-Foo': 'Kachow' },
        logLevel: 'silent',
        publicPath: '/',
      },
    };

    return runFetch(
      { config },
      (res) => {
        expect(res.ok);
        expect(res.headers.get('x-foo')).toBe('Kachow');
      },
      '/output.js'
    );
  });

  it('should accept a dev flag', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    const flags = {
      dev: '{"logLevel": "silent", "publicPath":"/"}',
    };

    return run({ config, flags }).then(({ options }) => {
      expect(options.dev).toEqual({ logLevel: 'silent', publicPath: '/' });
    });
  });

  it('should reject non-object dev', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    const flags = {
      dev: 'true',
    };

    return run({ config, flags }).catch((err) => {
      expect(err);
    });
  });

  it('should accept a host option', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.host = '0.0.0.0';

    return runFetch({ config }, (res) => {
      expect(res.ok);
    });
  });

  it('should accept a hot flag', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    const flags = {
      hot: '{"hot":false}',
    };

    return run({ config, flags }).then(({ options }) => {
      expect(options.hot.hot).toEqual(false);
    });
  });

  it('should reject non-object hot', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    const flags = {
      hot: 'true',
    };

    return run({ config, flags }).catch((err) => {
      expect(err);
    });
  });

  it('should not accept a mismatched hot.host option', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.host = '0.0.0.0';
    config.serve.hot = { host: 'localhost' };

    return run({ config }).catch((err) => {
      expect(err);
    });
  });

  it('should not accept a mismatched hot.host.server option', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.host = '0.0.0.0';
    config.serve.hot = {
      host: {
        server: '10.1.1.1',
        client: 'localhost',
      },
    };

    return run({ config }).catch((err) => {
      expect(err);
    });
  });

  it('should accept a matching hot.host option', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.host = '0.0.0.0';
    config.serve.hot = { host: '0.0.0.0' };

    return run({ config }, (res) => {
      expect(res.ok);
    });
  });

  it('should accept a matching hot.host.server option', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.host = '0.0.0.0';
    config.serve.hot = {
      host: {
        server: '0.0.0.0',
        client: 'localhost',
      },
    };

    return runFetch({ config }, (res) => {
      expect(res.ok);
    });
  });

  if (nodeVersion < 9) {
    it('should reject the http2 for Node < 9', () => {
      const config = load('./fixtures/basic/webpack.config.js');
      config.serve.http2 = true;

      return run({ config }).catch((err) => {
        expect(err);
      });
    });
  } else {
    // https://nodejs.org/api/http2.html#http2_client_side_example
    it('should accept a http2 option', () => {
      const config = load('./fixtures/basic/webpack.config.js');
      config.serve.http2 = true;

      return run({ config }).then((server) => {
        // options.hot should be mutated from the default setting as an object
        expect(server.options.http2);
      });
    });
  }

  it('should accept a https option');
  //
  // // logLevel and logTime option tests can be found in ./log.js
  //
  // it('should accept an open:Boolean option', () => {
  //   const config = load('./fixtures/basic/webpack.config.js');
  //   config.serve.open = true;
  //   clip.writeSync('foo');
  //
  //   return run({ config }).then(() => {
  //     hook = (...args) => {
  //       // the open option should disable the clipboard feature
  //       expect.equal(clip.readSync(), 'foo');
  //       expect.equal(args[0], 'http://localhost:8080/');
  //       expect.equal(Object.keys(args[1]), 0);
  //     };
  //   });
  // });
  //
  // it('should accept an open:Object option', () => {
  //   const config = load('./fixtures/basic/webpack.config.js');
  //   const opts = { app: 'Firefox', path: '/foo' };
  //   config.serve.open = opts;
  //
  //   return run({ config }).then(() => {
  //     hook = (...args) => {
  //       expect.equal(args[0], 'http://localhost:8080/foo');
  //       expect.equal(args[1], 'Firefox');
  //     };
  //   });
  // });
  //
  // NOTE: we have to test this here as we have no means to hook opn via the cli
  // tests
  // it('should accept --open-* flags', () => {
  //   const config = load('./fixtures/basic/webpack.config.js');
  //   const flags = {
  //     openApp: '["Firefox","--some-arg"]',
  //     openPath: '/some-path',
  //   };
  //
  //   return run({ config, flags }).then(() => {
  //     hook = (...args) => {
  //       expect.equal(args[0], 'http://localhost:8080/some-path');
  //       expect.deepEqual(args[1], JSON.parse(flags.openApp));
  //     };
  //   });
  // });

  it('should accept a port option', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.port = '1337';

    return run({ config }, (res) => {
      expect(res.ok);
    });
  });

  it('should accept a hot.hot option of `false`', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.hot = false;

    return runFetch({ config }, (res) => {
      expect(res.ok);
    });
  });

  it('should accept a hot option of `true`', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.hot = true;

    return run({ config }).then((server) => {
      // options.hot should be mutated from the default setting as an object
      expect(typeof server.options.hot === 'object');
    });
  });

  it('should accept a hot option of `false` and disable webpack-hot-client', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    config.serve.hot = false;

    return run({ config }).then(() => {
      const socket = new WebSocket('ws://localhost:8081');

      socket.on('error', (error) => {
        // this  expects that the WebSocketServer is not running, a sure sign
        // that webpack-hot-client has been disabled.
        expect(error.message).toMatch(/ECONNREFUSED/);
      });
    });
  });

  it('should merge child options', () => {
    const config = load(
      './fixtures/basic/webpack.options-merge.config.js',
      false
    );
    return run({ config }).then(({ options }) => {
      expect(options);
      expect(options.dev.logLevel).toBe('error');
      expect(options.dev.publicPath).toBe('/');
    });
  });
});
