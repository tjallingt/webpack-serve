import test from 'ava';
import weblog from 'webpack-log';

import eventbus from '../lib/bus';

const log = weblog({ name: 'serve', id: 'webpack-serve' });
log.level = 'silent';

test('should subscribe to events in options', (t) => {
  t.plan(1);

  const bus = eventbus({
    on: {
      foo: () => {
        t.pass();
      },
    },
  });

  bus.emit('foo');
});

test('should not allow non-object options', (t) => {
  const init = () => {
    eventbus({ on: 'foo' });
  };

  t.throws(init);
});

test('should not allow a non-function handler', (t) => {
  const init = () => {
    eventbus({
      on: {
        foo: 'bar',
      },
    });
  };

  t.throws(init);
});
