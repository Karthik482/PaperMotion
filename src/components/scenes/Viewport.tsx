"use client";
import { useRef, type ReactNode } from 'react';
import type { SceneState } from '@/lib/scenes/simulation';
export function Viewport({state,onAction,width=960,height,label,children}:{state:SceneState;onAction?:(action:unknown)=>void;width?:number;height:number;label:string;children:ReactNode}) {
 const drag=useRef<{x:number;y:number;view:{zoom:number;x:number;y:number}}|null>(null),view=state.view||{zoom:1,x:0,y:0};
 return <div className="viewport-surface" onPointerDown={e=>{if((e.target as Element).closest('button')||e.button!==0)return;drag.current={x:e.clientX,y:e.clientY,view};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(!drag.current)return;const scale=width/e.currentTarget.clientWidth;onAction?.({version:1,type:'set_view',target:'view',payload:{zoom:drag.current.view.zoom,x:Math.max(-960,Math.min(960,drag.current.view.x+(e.clientX-drag.current.x)*scale)),y:Math.max(-960,Math.min(960,drag.current.view.y+(e.clientY-drag.current.y)*scale))}});}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
 <svg className="engine-viewport" viewBox={`0 0 ${width} ${height}`} role="group" aria-label={label}><g transform={`translate(${width/2+view.x} ${height/2+view.y}) scale(${view.zoom}) translate(${-width/2} ${-height/2})`}>{children}</g></svg></div>;
}
