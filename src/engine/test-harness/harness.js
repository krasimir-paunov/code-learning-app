/*
 * Tiny test/expect API shared by the browser sandbox and the Node build checks
 * (so "the solution passes" is proven with the same code learners run against).
 * Plain ES2020 script: it is injected as text into the sandbox and evaluated in node:vm.
 */
(function (global) {
  'use strict';

  var tests = [];

  function test(name, fn) {
    tests.push({ name: String(name), fn: fn });
  }

  function format(value, depth) {
    depth = depth || 0;
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'function') return '[Function ' + (value.name || 'anonymous') + ']';
    if (typeof value === 'bigint') return value + 'n';
    if (typeof value === 'symbol') return value.toString();
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value !== 'object') return String(value);
    if (depth > 3) return Array.isArray(value) ? '[…]' : '{…}';
    if (Array.isArray(value)) {
      return (
        '[' +
        value
          .map(function (v) {
            return format(v, depth + 1);
          })
          .join(', ') +
        ']'
      );
    }
    if (value instanceof Map) {
      return (
        'Map(' +
        value.size +
        ') {' +
        Array.from(value.entries())
          .map(function (e) {
            return format(e[0], depth + 1) + ' => ' + format(e[1], depth + 1);
          })
          .join(', ') +
        '}'
      );
    }
    if (value instanceof Set) {
      return (
        'Set(' +
        value.size +
        ') {' +
        Array.from(value)
          .map(function (v) {
            return format(v, depth + 1);
          })
          .join(', ') +
        '}'
      );
    }
    if (value instanceof Error) return value.name + ': ' + value.message;
    if (typeof Element !== 'undefined' && value instanceof Element)
      return '<' + value.tagName.toLowerCase() + '>';
    var keys = Object.keys(value);
    return (
      '{ ' +
      keys
        .map(function (k) {
          return k + ': ' + format(value[k], depth + 1);
        })
        .join(', ') +
      (keys.length ? ' }' : '}')
    );
  }

  function deepEqual(a, b) {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      for (var entry of a)
        if (!b.has(entry[0]) || !deepEqual(entry[1], b.get(entry[0]))) return false;
      return true;
    }
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (var item of a) if (!b.has(item)) return false;
      return true;
    }
    var ka = Object.keys(a);
    var kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (var i = 0; i < ka.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(b, ka[i]) || !deepEqual(a[ka[i]], b[ka[i]]))
        return false;
    }
    return true;
  }

  function AssertionError(message) {
    var error = new Error(message);
    error.name = 'AssertionError';
    return error;
  }

  var matchers = {
    toBe: function (actual, expected) {
      return {
        pass: Object.is(actual, expected),
        message: 'Expected ' + format(expected) + ', received ' + format(actual),
      };
    },
    toEqual: function (actual, expected) {
      return {
        pass: deepEqual(actual, expected),
        message: 'Expected ' + format(expected) + ', received ' + format(actual),
      };
    },
    toBeCloseTo: function (actual, expected, digits) {
      var precision = digits === undefined ? 2 : digits;
      return {
        pass: Math.abs(expected - actual) < Math.pow(10, -precision) / 2,
        message: 'Expected ' + format(actual) + ' to be close to ' + format(expected),
      };
    },
    toBeTruthy: function (actual) {
      return { pass: !!actual, message: 'Expected a truthy value, received ' + format(actual) };
    },
    toBeFalsy: function (actual) {
      return { pass: !actual, message: 'Expected a falsy value, received ' + format(actual) };
    },
    toBeNull: function (actual) {
      return { pass: actual === null, message: 'Expected null, received ' + format(actual) };
    },
    toBeUndefined: function (actual) {
      return {
        pass: actual === undefined,
        message: 'Expected undefined, received ' + format(actual),
      };
    },
    toBeGreaterThan: function (actual, expected) {
      return {
        pass: actual > expected,
        message: 'Expected ' + format(actual) + ' to be greater than ' + format(expected),
      };
    },
    toBeLessThan: function (actual, expected) {
      return {
        pass: actual < expected,
        message: 'Expected ' + format(actual) + ' to be less than ' + format(expected),
      };
    },
    toContain: function (actual, item) {
      var has =
        typeof actual === 'string'
          ? actual.indexOf(item) !== -1
          : Array.prototype.indexOf.call(actual || [], item) !== -1;
      return { pass: has, message: 'Expected ' + format(actual) + ' to contain ' + format(item) };
    },
    toHaveLength: function (actual, length) {
      var actualLength = actual == null ? undefined : actual.length;
      return {
        pass: actualLength === length,
        message: 'Expected length ' + length + ', received ' + format(actualLength),
      };
    },
    toThrow: function (actual, expected) {
      if (typeof actual !== 'function')
        return { pass: false, message: 'expect(…).toThrow() needs a function' };
      try {
        actual();
      } catch (error) {
        var text = error && error.message !== undefined ? error.message : String(error);
        var ok =
          expected === undefined ||
          (typeof expected === 'string' && text.indexOf(expected) !== -1) ||
          (expected instanceof RegExp && expected.test(text)) ||
          (typeof expected === 'function' && error instanceof expected);
        return {
          pass: ok,
          message: 'Expected an error matching ' + format(expected) + ', got ' + format(text),
        };
      }
      return { pass: false, message: 'Expected the function to throw, but it returned normally' };
    },
  };

  function expect(actual) {
    var api = { not: {} };
    Object.keys(matchers).forEach(function (name) {
      api[name] = function () {
        var result = matchers[name].apply(
          null,
          [actual].concat(Array.prototype.slice.call(arguments)),
        );
        if (!result.pass) throw AssertionError(result.message);
      };
      api.not[name] = function () {
        var result = matchers[name].apply(
          null,
          [actual].concat(Array.prototype.slice.call(arguments)),
        );
        if (result.pass) throw AssertionError('Expected not: ' + result.message);
      };
    });
    return api;
  }

  async function run() {
    var results = [];
    for (var i = 0; i < tests.length; i++) {
      var t = tests[i];
      try {
        await t.fn();
        results.push({ name: t.name, passed: true });
      } catch (error) {
        var message = error && error.message !== undefined ? error.message : String(error);
        if (error && error.name && error.name !== 'AssertionError' && error.name !== 'Error') {
          message = error.name + ': ' + message;
        }
        results.push({ name: t.name, passed: false, message: message });
      }
    }
    return results;
  }

  /* Loop guard targets (inserted by the loop-guard transform). */
  var LOOP_LIMIT_MS = 2000;
  var loopState = {};
  function loopEnter(id) {
    loopState[id] = { count: 0, start: Date.now() };
  }
  function loopTick(id, line) {
    var state = loopState[id];
    if (!state) {
      state = loopState[id] = { count: 0, start: Date.now() };
    }
    state.count++;
    if ((state.count & 1023) === 0 && Date.now() - state.start > LOOP_LIMIT_MS) {
      var error = new Error(
        'The loop on line ' +
          line +
          ' ran for more than ' +
          LOOP_LIMIT_MS / 1000 +
          ' s and was stopped. Is it an infinite loop?',
      );
      error.name = 'InfiniteLoopError';
      throw error;
    }
  }

  /* DOM helpers for HTML/CSS tests and visual-match measurement (browser only). */
  function $(selector) {
    return document.querySelector(selector);
  }
  function $$(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }
  function styleOf(selector, property) {
    var el = $(selector);
    return el ? getComputedStyle(el).getPropertyValue(property) : undefined;
  }
  function boxOf(selector) {
    var el = $(selector);
    if (!el) return undefined;
    var r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }
  function measure(selectors, properties) {
    var out = {};
    selectors.forEach(function (selector) {
      var el = $(selector);
      if (!el) {
        out[selector] = { found: false };
        return;
      }
      var styles = {};
      var computed = getComputedStyle(el);
      (properties || []).forEach(function (p) {
        styles[p] = computed.getPropertyValue(p);
      });
      out[selector] = { found: true, box: boxOf(selector), styles: styles };
    });
    return out;
  }

  global.test = test;
  global.expect = expect;
  global.__lgEnter = loopEnter;
  global.__lgTick = loopTick;
  global.__harness = { run: run, format: format };
  if (typeof document !== 'undefined') {
    global.$ = $;
    global.$$ = $$;
    global.styleOf = styleOf;
    global.boxOf = boxOf;
    global.__harness.measure = measure;
  }
})(globalThis);
