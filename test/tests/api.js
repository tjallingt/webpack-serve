const path = require('path');

const clip = require('clipboardy');

const WebpackServeError = require('../../lib/WebpackServeError');
const { load, run } = require('../util');

const logLevel = 'silent';

describe('webpack-serve API', () => {
  it('should serve', () => {
    const config = load('./fixtures/basic/webpack.config.js');
    return run({ config }).then((server) => {
      expect(server).toBeDefined();
      expect(typeof server.close).toBe('function');
      expect(typeof server.on).toBe('function');
    });
  });

  it('should throw', () => {
    const config = { bad: 'batman' };
    return run({ config }).catch((error) => {
      expect(error).toBeInstanceOf(WebpackServeError);
    });
  });

  it('should serve with <String> entry', () => {
    const config = load('./fixtures/basic/webpack.string-entry.config.js');
    return run({ config }).then((server) => {
      expect(server).toBeDefined();
    });
  });

  it('should serve with MultiCompiler', () => {
    const config = load('./fixtures/multi/webpack.config.js');

    return run({ config }).then((server) => {
      expect(server).toBeDefined();
    });
  });

  it('should serve with <Object> entry', () => {
    const config = load('./fixtures/basic/webpack.object.config.js');
    return run({ config }).then((server) => {
      expect(server).toBeDefined();
    });
  });

  it('should serve with <Function> config', () => {
    const config = './test/fixtures/basic/webpack.function.config.js';
    return run({
      config,
      logLevel,
      dev: { logLevel },
      hot: { logLevel },
    }).then((server) => {
      expect(server).toBeDefined();
    });
  });

  it('should serve with webpack v4 defaults', () => {
    const content = path.join(__dirname, '../fixtures/webpack-4-defaults');

    return run({
      content,
      logLevel,
      dev: { logLevel, publicPath: '/' },
      hot: { logLevel },
    }).then((server) => {
      expect(server).toBeDefined();
    });
  });

  it('should serve with partial webpack 4 defaults', () => {
    const config = load(
      './fixtures/webpack-4-defaults/webpack.no-entry.config.js'
    );
    return run({ config }).then((server) => {
      expect(server).toBeDefined();
    });
  });

  it('should have copied the uri to the clipboard', () => {
    expect(clip.readSync()).toMatch(/http:\/\/localhost:\d+/);
  });
});
