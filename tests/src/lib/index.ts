import { runScenario } from '@holochain/tryorama';
import merge from './merge.js';
import store from './syn-store';
import concurrent from './concurrent.js';
import deterministic from './deterministic.js';
import test from 'tape-promise/tape.js';

test('syn store test', async t => {
  await runScenario(store(t));
});
test('syn merge test', async t => {
  await runScenario(merge(t));
});

test('syn concurrent test', async t => {
  await runScenario(concurrent(t));
});

test('create a deterministic root', async t => {
  await runScenario(deterministic(t));
});
