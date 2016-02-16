import defer from 'promise-defer';
import includes from 'lodash/includes';

export default function PromiseAuto(tasks, Promise) {
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
  var deferred = defer(Promise);
  var finished = false;

  for (let name in tasks) {
    if (!Array.isArray(tasks[name])) {
      tasks[name] = [tasks[name]];
    }
  }

  for (let name in tasks) {
    let taskDef = tasks[name];
    var requires = taskDef.slice(0, taskDef.length - 1);
    requires.forEach(req => {
      var deps = tasks[req].slice(0, tasks[req].length - 1);
      if (includes(deps, name)) {
        throw new Error('Has cyclic dependencies');
      }
    });
  }

  function checkPending() {
    if (finished) return;

    var done = Object.keys(results);
    if (done.length === remainingTasks) {
      deferred.resolve(results);
      finished = true;
    }

    for (let name in tasks) {
      let taskDef = tasks[name];
      var requires = taskDef.slice(0, taskDef.length - 1);
      let task = taskDef[taskDef.length - 1];

      if (done.indexOf(name) >= 0) {
        continue;
      }

      if (!running[name] && requires.reduce((function(ok, req) {
        return ok && done.indexOf(req) >= 0;
      }), true)) {
        (function(taskName) {
          running[taskName] = true;
          Promise
            .resolve(results)
            .then(() => task(results))
            .then((res) => {
              results[taskName] = res;
              checkPending();
            })
            .catch(deferred.reject.bind(deferred));
        })(name);

      }
    }
  }

  checkPending();

  return deferred.promise;
}
