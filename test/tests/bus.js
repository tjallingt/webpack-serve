const eventbus = require('../../lib/bus');

describe('webpack-serve Event Bus', () => {
  it('should subscribe to events in options', (done) => {
    const bus = eventbus({
      on: {
        foo: () => {
          expect(true);
          done();
        },
      },
    });

    bus.emit('foo');
  });

  it('should not allow non-object options', () => {
    const init = () => {
      eventbus({ on: 'foo' });
    };
    expect(init).toThrow();
  });

  it('should not allow a non-function handler', () => {
    const init = () => {
      eventbus({
        on: {
          foo: 'bar',
        },
      });
    };
    expect(init).toThrow();
  });
});
