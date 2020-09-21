import {msg} from './comp';

describe('ts-jest transformer', function () {
  it('should work with ts-jest', function () {
    expect(msg).toEqual({
      defaultMessage: [
        {
          type: 0,
          value: 'defineMessage',
        },
      ],
      id: 'Vg+BA7',
    });
  });
});
