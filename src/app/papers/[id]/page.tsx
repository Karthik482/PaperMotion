import { PaperReader } from '@/components/papers/PaperReader';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PaperReader id={id}/>;}
