/**
 * callbag-to-mobx
 * ---------------
 *
 * Convert a listenable callbag source to a mobx observable and back.
 *
 * `yarn install callbag-to-mobx`
 *
 * Example:
 *
 * ```
 *   const { interval } = require('callbag-basics');
 *   const { asObservable, fromExpression } = require('callbag-to-mobx');
 *
 *   // from callbag to mobx
 *   const value = asObservable(interval(1000), -1)
 *
 *   autorun(() => console.log(value.current())); // -1, 0, 1, 2, 3
 *
 *   // from mobx to callbag
 *   pipe(
 *     fromExpression(() => value.current()),
 *     forEach(value => console.log(value)) // -1, 0, 1, 2, 3
 *   );
 * ```
 *
 * Conversion is lazy; if not observed no work is done.
 */

const { reaction } = require("mobx");
const { fromResource } = require("mobx-utils");

const asObservable = function(source, initialValue = undefined) {
  let talkback;
  return fromResource(
    function(sink) {
      source(0, function(t, d) {
        if (t === 0) talkback = d;
        if (t === 1) sink(d);
        if (t === 1 || t === 0) talkback(1);
      });
    },
    function() {
      talkback(2);
    },
    initialValue
  );
};

const fromExpression = function(expression, fireImmediately = true) {
  let disposer;

  return function(start, sink) {
    if (start !== 0) return;
    sink(0, function(t) {
      if (t === 2) {
        disposer();
      }
    });
    disposer = reaction(
      expression,
      function(value) {
        sink(1, value);
      },
      {
        fireImmediately
      }
    );
  };
};

module.exports = { asObservable, fromExpression };
