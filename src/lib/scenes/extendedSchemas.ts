import { z } from "zod";
import { historicalEventIds } from "./catalog";
const text=z.string().trim().min(1).max(1200), label=z.string().trim().min(1).max(80), id=z.string().regex(/^[a-zA-Z0-9_-]{1,32}$/);
const n=(min:number,max:number)=>z.number().finite().min(min).max(max);
const common={title:label,description:text,assumptions:z.array(text).min(1).max(6)};
const row=z.object({id,key:label,value:n(-10000,10000)}).strict();
export const extendedSceneOptions=[
 z.object({...common,type:z.literal('task-scheduler'),config:z.object({partitions:n(1,24).int(),executors:n(1,6).int(),slots:n(1,4).int(),taskDuration:n(1,8).int(),stages:n(1,3).int(),records:n(1,240).int(),abstraction:z.enum(['DataFrame','RDD'])}).strict()}).strict(),
 z.object({...common,type:z.literal('supply-demand'),config:z.object({demandIntercept:n(20,200),demandSlope:n(.1,5),supplyIntercept:n(0,100),supplySlope:n(.1,5),demandShift:n(-50,50),supplyShift:n(-50,50)}).strict()}).strict(),
 z.object({...common,type:z.literal('dna-replication'),config:z.object({sequence:z.string().regex(/^[ACGT]{6,16}$/),showEnzymes:z.boolean()}).strict()}).strict(),
 z.object({...common,type:z.literal('historical-timeline'),config:z.object({eventIds:z.array(z.enum(historicalEventIds)).min(2).max(6),comparison:z.boolean()}).strict()}).strict(),
 z.object({...common,type:z.literal('data-explorer'),config:z.object({operation:z.enum(['filter','left-join','bubble-sort']),rows:z.array(row).min(2).max(12),lookup:z.array(z.object({id,key:label,label}).strict()).max(12),threshold:n(-10000,10000)}).strict()}).strict(),
 z.object({...common,type:z.literal('spatial-explorer'),config:z.object({points:z.array(z.object({id,label,description:text,x:n(-100,100),y:n(-100,100)}).strict()).min(2).max(12),units:label}).strict()}).strict(),
 z.object({...common,type:z.literal('annotated-illustration'),config:z.object({regions:z.array(z.object({id,label,description:text,shape:z.enum(['rectangle','ellipse']),x:n(5,95),y:n(5,95),width:n(5,40),height:n(5,40),layer:id}).strict()).min(2).max(12),frames:z.array(z.object({label,note:text,visibleIds:z.array(id).min(1).max(12)}).strict()).min(2).max(8)}).strict()}).strict(),
] as const;
