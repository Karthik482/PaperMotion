import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scaledAttention, softmax, toyAttention } from '../src/lib/attention';
test('stable softmax stays normalized at large magnitudes',()=>{const w=softmax([10000,10001,9999]);assert.ok(w.every(Number.isFinite));assert.ok(Math.abs(w.reduce((a,b)=>a+b)-1)<1e-12);});
test('temperature changes concentration',()=>{assert.ok(softmax([0,1,3],.2)[2]>softmax([0,1,3],2)[2]);});
test('scaled attention matches a hand-calculated weighted value',()=>{const a=scaledAttention([1,0],[[1,0],[0,1]],[[2,0],[0,4]]);const expected=Math.exp(1/Math.sqrt(2))/(Math.exp(1/Math.sqrt(2))+1);assert.ok(Math.abs(a.weights[0]-expected)<1e-12);assert.deepEqual(a.output,[2*a.weights[0],4*a.weights[1]]);});
test('all toy queries and heads normalize and react to controls',()=>{for(let q=0;q<6;q++)for(let h=0;h<8;h++){const a=toyAttention(q,1,h);assert.ok(Math.abs(a.weights.reduce((s,w)=>s+w,0)-1)<1e-12);}assert.notDeepEqual(toyAttention(1).weights,toyAttention(2).weights);assert.notDeepEqual(toyAttention(2,.2).weights,toyAttention(2,2).weights);assert.notDeepEqual(toyAttention(2,1,0).weights,toyAttention(2,1,1).weights);});
test('invalid inputs rejected',()=>{assert.throws(()=>softmax([],1));assert.throws(()=>softmax([1],0));assert.throws(()=>softmax([Infinity]));assert.throws(()=>scaledAttention([1],[[1,2]],[[1]]));assert.throws(()=>toyAttention(-1));});
