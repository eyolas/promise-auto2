'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = PromiseAuto;

var _promiseDefer = require('promise-defer');

var _promiseDefer2 = _interopRequireDefault(_promiseDefer);

var _includes = require('lodash/collection/includes');

var _includes2 = _interopRequireDefault(_includes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function PromiseAuto(tasks, Promise) {
  if (Promise == null) {
    Promise = global.Promise;
  }

  var keys = Object.keys(tasks);
  var remainingTasks = keys.length;

  if (!remainingTasks) {
    return Promise.resolve(null);
  }
  var results = {};
  var running = {};
  var deferred = (0, _promiseDefer2.default)(Promise);
  var finished = false;

  for (var name in tasks) {
    if (!Array.isArray(tasks[name])) {
      tasks[name] = [tasks[name]];
    }
  }

  var _loop = function _loop(name) {
    var taskDef = tasks[name];
    requires = taskDef.slice(0, taskDef.length - 1);

    requires.forEach(function (req) {
      var deps = tasks[req].slice(0, tasks[req].length - 1);
      if ((0, _includes2.default)(deps, name)) {
        throw new Error('Has cyclic dependencies');
      }
    });
  };

  for (var name in tasks) {
    var requires;

    _loop(name);
  }

  function checkPending() {
    if (finished) return;

    var done = Object.keys(results);
    if (done.length === remainingTasks) {
      deferred.resolve(results);
      finished = true;
    }

    var _loop2 = function _loop2(name) {
      var taskDef = tasks[name];
      requires = taskDef.slice(0, taskDef.length - 1);

      var task = taskDef[taskDef.length - 1];

      if (done.indexOf(name) >= 0) {
        return 'continue';
      }

      if (!running[name] && requires.reduce(function (ok, req) {
        return ok && done.indexOf(req) >= 0;
      }, true)) {
        (function (taskName) {
          running[taskName] = true;
          Promise.resolve(results).then(function () {
            return task(results);
          }).then(function (res) {
            results[taskName] = res;
            checkPending();
          }).catch(deferred.reject.bind(deferred));
        })(name);
      }
    };

    for (var name in tasks) {
      var requires;

      var _ret2 = _loop2(name);

      if (_ret2 === 'continue') continue;
    }
  }

  checkPending();

  return deferred.promise;
}
module.exports = exports['default'];