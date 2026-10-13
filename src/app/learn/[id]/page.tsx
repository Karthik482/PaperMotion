import { TopicReader } from '@/components/topics/TopicReader';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <TopicReader id={id}/>;}
