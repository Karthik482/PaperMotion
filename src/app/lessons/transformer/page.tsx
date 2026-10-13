import { LessonViewer } from '@/components/lesson/LessonViewer';
export default async function Page({searchParams}:{searchParams:Promise<{module?:string}>}){const params=await searchParams;const n=Number(params.module);return <LessonViewer initialModule={Number.isInteger(n)&&n>=0&&n<=5?n:1}/>;}
