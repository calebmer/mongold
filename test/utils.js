import Assert from 'assert';
import {EventEmitter} from 'events';
import * as Utils from '../src/utils';

describe('Utils', () => {

  describe('whenReady', () => {

    it('will instantly activate ready function', () => {

      var count = 0;

      var events = new EventEmitter();
      Utils.whenReady(events);
      Assert.equal(count, 0);
      events.on('ready', () => { count++; });
      Assert.equal(count, 0);
      events.emit('ready');
      Assert.equal(count, 1);
      events.on('ready', () => { count++; });
      Assert.equal(count, 2);
    });
  });
});
