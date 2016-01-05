import PromiseAuto from '../';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

const {expect, assert} = chai;

function promiseDelay(delay) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delay);
  });
}

describe('auto', () => {
  it('runs', () => {
    const callOrder = [];
    return PromiseAuto({
      task1: ['task2', () => promiseDelay(300).then(() => callOrder.push('task1'))],
      task2: () => promiseDelay(50).then(() => callOrder.push('task2')),
      task3: ['task2', () => callOrder.push('task3')],
      task4: ['task1', 'task2', () => callOrder.push('task4')],
      task5: ['task2', () => promiseDelay(200).then(() => callOrder.push('task5'))],
      task6: ['task2', () => promiseDelay(100).then(() => callOrder.push('task6'))]
    }).then(() => {
      expect(callOrder).to.deep.equal(['task2', 'task3', 'task6', 'task5', 'task1', 'task4']);
    });
  });

  it('petrifies', () => {
    const callOrder = [];
    return PromiseAuto({
      task1: ['task2', () => promiseDelay(100).then(() => callOrder.push('task1'))],
      task2: () => promiseDelay(200).then(() => callOrder.push('task2')),
      task3: ['task2', () => callOrder.push('task3')],
      task4: ['task1', 'task2', () => callOrder.push('task4')]
    }).then(() => {
      expect(callOrder).to.deep.equal(['task2', 'task3', 'task1', 'task4']);
    });
  });

  it ('has results', () => {
    const callOrder = [];
    return PromiseAuto({
      task1: [
        'task2',
        (results) => {
          expect(results.task2).to.equal('task2');
          return promiseDelay(25)
            .then(() => {
              callOrder.push('task1');
              return ['task1a', 'task1b'];
            });
        }
      ],
      task2: () => {
        return promiseDelay(50)
          .then(() => {
            callOrder.push('task2');
            return 'task2';
          });
      },
      task3: [
        'task2',
        (results) => {
          expect(results.task2).to.equal('task2');
          callOrder.push('task3');
          return undefined;
        }
      ],
      task4: [
        'task1',
        'task2',
        (results) => {
          expect(results.task1).to.deep.equal(['task1a', 'task1b']);
          callOrder.push('task4');
          return 'task4';
        }
      ]
    }).then((results) => {
      expect(callOrder).to.deep.equal(['task2', 'task3', 'task1', 'task4']);
      expect(results).to.deep.equal({
        task1: ['task1a', 'task1b'],
        task2: 'task2',
        task3: undefined,
        task4: 'task4'
      });
    });
  });

  it('runs with an empty object', () => PromiseAuto({}));

  it('errors out properly', () => {
    return assert.isRejected(PromiseAuto({
      task1: function() {
        throw new Error('testerror');
      },
      task3: function() {
        throw new Error('testerror2');
      }
    }), /^Error: testerror$/);
  });

  it('cyclic dependencies error', () => {
    return assert.throw(function(){
      PromiseAuto({
        task1: ['task2', () => null],
        task2: ['task1', () => null]
      });
    }, 'Has cyclic dependencies');
  });
});
