import ResetPassword from '@/components/auth/reset-password';
export const metadata={title:'Redefinir senha | CineAstra',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function Page({searchParams}) {const {token}=await searchParams;return <ResetPassword token={typeof token==='string'?token:''}/>;}
