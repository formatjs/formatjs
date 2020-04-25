import {selectUnit} from '../src';
import {expect as chaiExpect} from 'chai';
declare global {
  var expect: typeof chaiExpect;
}

function past(v?: number) {
  return Date.now() - (v || 0);
}

function future(v?: number) {
  return Date.now() + (v || 0);
}

const SEC = 1e3;
const MIN = SEC * 60;
const HOUR = MIN * 60;

describe('selectUnit', function() {
  it('should work for sec', function() {
    expect(selectUnit(past(44 * SEC), Date.now())).to.deep.equal({
      value: -44,
      unit: 'second',
    });
    expect(selectUnit(future(44 * SEC), Date.now())).to.deep.equal({
      value: 44,
      unit: 'second',
    });
  });
  it('should work for min', function() {
    expect(selectUnit(past(45 * SEC), Date.now())).to.deep.equal({
      value: -1,
      unit: 'minute',
    });
    expect(selectUnit(future(45 * SEC), Date.now())).to.deep.equal({
      value: 1,
      unit: 'minute',
    });
    expect(selectUnit(past(44 * MIN), Date.now())).to.deep.equal({
      value: -44,
      unit: 'minute',
    });
    expect(selectUnit(future(44 * MIN), Date.now())).to.deep.equal({
      value: 44,
      unit: 'minute',
    });
  });
  it('should work for hour', function() {
    expect(selectUnit(past(45 * MIN), Date.now())).to.deep.equal({
      value: -1,
      unit: 'hour',
    });
    expect(selectUnit(future(45 * MIN), Date.now())).to.deep.equal({
      value: 1,
      unit: 'hour',
    });
    expect(selectUnit(past(21 * HOUR), Date.now())).to.deep.equal({
      value: -21,
      unit: 'hour',
    });
    expect(selectUnit(future(21 * HOUR), Date.now())).to.deep.equal({
      value: 21,
      unit: 'hour',
    });
  });
  it('should work for day', function() {
    expect(
      selectUnit(new Date(2019, 1, 5), new Date(2019, 1, 6))
    ).to.deep.equal({
      value: -1,
      unit: 'day',
    });
    expect(
      selectUnit(new Date(2019, 1, 6), new Date(2019, 1, 5))
    ).to.deep.equal({
      value: 1,
      unit: 'day',
    });
    expect(
      selectUnit(new Date(2019, 1, 5), new Date(2019, 1, 9))
    ).to.deep.equal({
      value: -4,
      unit: 'day',
    });
    expect(
      selectUnit(new Date(2019, 1, 9), new Date(2019, 1, 5))
    ).to.deep.equal({
      value: 4,
      unit: 'day',
    });
  });
  it('should work for week', function() {
    expect(
      selectUnit(new Date(2019, 1, 5), new Date(2019, 1, 10))
    ).to.deep.equal({
      value: -1,
      unit: 'week',
    });
    expect(
      selectUnit(new Date(2019, 1, 10), new Date(2019, 1, 5))
    ).to.deep.equal({
      value: 1,
      unit: 'week',
    });
    expect(
      selectUnit(new Date(2019, 1, 5), new Date(2019, 1, 26))
    ).to.deep.equal({
      value: -3,
      unit: 'week',
    });
    expect(
      selectUnit(new Date(2019, 1, 26), new Date(2019, 1, 5))
    ).to.deep.equal({
      value: 3,
      unit: 'week',
    });
  });
  it('should work for month', function() {
    expect(
      selectUnit(new Date(2019, 1, 10), new Date(2019, 2, 10))
    ).to.deep.equal({
      value: -1,
      unit: 'month',
    });
    expect(
      selectUnit(new Date(2019, 2, 10), new Date(2019, 1, 10))
    ).to.deep.equal({
      value: 1,
      unit: 'month',
    });
    expect(
      selectUnit(new Date(2019, 0, 10), new Date(2019, 2, 27))
    ).to.deep.equal({
      value: -2,
      unit: 'month',
    });
    expect(
      selectUnit(new Date(2019, 2, 27), new Date(2019, 0, 5))
    ).to.deep.equal({
      value: 2,
      unit: 'month',
    });
  });
});
