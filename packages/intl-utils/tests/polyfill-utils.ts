import {partitionPattern} from '../src/polyfill-utils';
describe('polyfill-utils', function() {
  it('should partition pattern correctly', function() {
    expect(partitionPattern('AA{0}BB')).to.deep.equal([
      {
        type: 'literal',
        value: 'AA',
      },
      {
        type: '0',
        value: undefined,
      },
      {
        type: 'literal',
        value: 'BB',
      },
    ]);
    expect(partitionPattern('{0} BB')).to.deep.equal([
      {
        type: '0',
        value: undefined,
      },
      {
        type: 'literal',
        value: ' BB',
      },
    ]);
    expect(partitionPattern('AA {0}')).to.deep.equal([
      {
        type: 'literal',
        value: 'AA ',
      },
      {
        type: '0',
        value: undefined,
      },
    ]);
  });
});
