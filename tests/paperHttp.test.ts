import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sameOrigin } from '../src/lib/papers/errors';
test('same-origin browser requests use the Host header when Next normalizes the internal URL',()=>{sameOrigin(new Request('http://localhost:3100/api/papers',{headers:{host:'127.0.0.1:3100',origin:'http://127.0.0.1:3100'}}));assert.throws(()=>sameOrigin(new Request('http://localhost:3100/api/papers',{headers:{host:'127.0.0.1:3100',origin:'https://evil.example'}})));});
