const { load, pause, run } = require('../util');

describe('webpack-serve Events', () => {
  beforeEach(pause);

  it('should emit the listening event', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    return run({ config }).then((server) => {
      server.on('listening', ({ server: servr, options }) => {
        expect(servr).toBeDefined();
        expect(options).toBeDefined();
      });
    });
  });

  it('should emit the compiler-error event', () => {
    const config = load('./fixtures/error/webpack.config.js');
    return run({ config }).then((server) => {
      server.on('compiler-error', ({ json, compiler }) => {
        expect(json).toBeDefined();
        expect(compiler).toBeDefined();
      });
    });
  });

  it('should emit the compiler-warning event', () => {
    const config = load('./fixtures/warning/webpack.config.js');
    return run({ config }).then((server) => {
      server.on('compiler-warning', ({ json, compiler }) => {
        expect(json).toBeDefined();
        expect(compiler).toBeDefined();
      });
    });
  });

  it('should emit the build-started event', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    return run({ config }).then((server) => {
      server.on('build-started', ({ compiler }) => {
        expect(compiler).toBeDefined();
      });
    });
  });

  it('should emit the build-finished event', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    return run({ config }).then((server) => {
      server.on('build-finished', ({ stats, compiler }) => {
        expect(stats).toBeDefined();
        expect(compiler).toBeDefined();
      });
    });
  });
});
