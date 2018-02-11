'use strict';

/*
  eslint global-require: off,
         no-console: off,
         import/no-extraneous-dependencies: off,
         import/no-unresolved: off
*/

if (parseInt(process.version.substring(1), 10) < 8) {
  try {
    require('@babel/polyfill');
    require('@babel/register')({
      ignore: [/node_modules\/(?!koa)/],
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: '6.11'
          }
        }]
      ]
    });
  } catch (e) {
    const chalk = require('chalk');
    const symbols = require('log-symbols');
    console.error(chalk`${symbols.error} {gray ｢serve｣} {red Babel not installed. webpack-serve cannot run.}`);
    console.error(chalk`${symbols.error} {gray ｢serve｣} When running on Node v6.x, the optionalDependencies must be installed.`);
    process.exit(1);
  }
}

if (!module.parent) {
  require('v8-compile-cache');
}

// eslint-disable-next-line global-require
require('loud-rejection/register');
