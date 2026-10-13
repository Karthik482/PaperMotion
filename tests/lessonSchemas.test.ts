import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lesson } from '../src/data/transformerLesson';
import { lessonSchema, moduleSchema } from '../src/lib/lessonSchemas';
test('six modules have valid registered visualizations',()=>{assert.equal(lesson.modules.length,6);assert.ok(lessonSchema.safeParse(lesson).success);});
test('unregistered visualization and invalid answers fail validation',()=>{assert.equal(moduleSchema.safeParse({...lesson.modules[0],visualization:'unknown'}).success,false);assert.equal(moduleSchema.safeParse({...lesson.modules[0],answer:10}).success,false);});
test('duplicate module IDs fail',()=>{assert.equal(lessonSchema.safeParse({...lesson,modules:[lesson.modules[0],lesson.modules[0]]}).success,false);});
