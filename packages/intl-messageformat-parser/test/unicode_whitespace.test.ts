import {parse, TYPE, SelectElement} from '../src';

test('it skips unicode no-break space (U+00A0)', () => {
  const tree = parse(`{gender, select,
   \u00a0male {
      {He}}
   \u00a0female {
      {She}}
   \u00a0other{
      {They}}}
  `);
  const selectElement = tree[0] as SelectElement;
  expect(selectElement.type).toBe(TYPE.select);
  expect(Object.keys(selectElement.options)).toEqual([
    'male',
    'female',
    'other',
  ]);
});
