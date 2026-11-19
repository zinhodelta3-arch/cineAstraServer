import { publicAsset } from './public-api.mjs';

const vipImage = '/parcerias/sala-cinema.jpg';
export const validExperienceId = value => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && Number(value) <= 4294967295;
export const experienceRequestsPath = '/cinema/experiencias/solicitacoes';
export const experienceRequestHref = id => `${experienceRequestsPath}?pedido=${id}`;

export function experienceImage(item) {
 if (item.imageUrl === vipImage || (item.slug === 'sala-vip' && !item.imageUrl)) return vipImage;
 return publicAsset(item.imageUrl);
}

export function validateExperienceInquiry(body,today=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})){
 if(!body||typeof body!=='object'||Array.isArray(body))return null;
 const {experienceId,customSpace,locationId,date,guests,details,time,preferences,requirements}=body;
 if ((experienceId == null) === (customSpace == null)) return null;
 if (experienceId != null && !validExperienceId(experienceId)) return null;
 if (customSpace != null && (typeof customSpace !== 'string' || customSpace.trim().length < 3 || customSpace.length > 150)) return null;
 if (locationId != null && !validExperienceId(locationId)) return null;
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date||date<today)return null;
 if(!Number.isInteger(guests)||guests<1||guests>100000||typeof details!=='string'||details.trim().length<10||details.length>4000)return null;
 if(time!=null&&time!==''&&(typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)))return null;
 if(preferences!=null&&(typeof preferences!=='string'||preferences.length>1000))return null;
 if(requirements!=null&&(typeof requirements!=='string'||requirements.length>1000))return null;
 return {
  ...(experienceId ? {experienceId} : {customSpace:customSpace.trim()}),
  ...(locationId ? {locationId} : {}),
  date,guests,details:details.trim(),...(time?{time}:{}),
  ...(preferences?.trim()?{preferences:preferences.trim()}:{}),
  ...(requirements?.trim()?{requirements:requirements.trim()}:{})
 };
}
