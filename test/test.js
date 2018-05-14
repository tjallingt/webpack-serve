process.setMaxListeners(20);

const { register } = require('../lib/global');

register();

jest.setTimeout(10e3);

process.setMaxListeners(process.getMaxListeners() * 10);

require('./tests/api');
require('./tests/bus');
require('./tests/cli');
require('./tests/events');
require('./tests/log');
require('./tests/options');
