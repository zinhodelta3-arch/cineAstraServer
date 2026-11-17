export function validateExperienceInquiry(body,today=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})){
 if(!body||typeof body!=='object'||Array.isArray(body))return null;
 const {experienceId,date,guests,details,time,preferences}=body;
 if(typeof experienceId!=='string'||! /^[1-9]\d{0,9}$/.test(experienceId)||Number(experienceId)>4294967295)return null;
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date||date<today)return null;
 if(!Number.isInteger(guests)||guests<1||guests>100000||typeof details!=='string'||details.trim().length<10||details.length>4000)return null;
 if(time!=null&&time!==''&&(typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)))return null;
 if(preferences!=null&&(typeof preferences!=='string'||preferences.length>1000))return null;
 return {experienceId,date,guests,details:details.trim(),...(time?{time}:{}),...(preferences?.trim()?{preferences:preferences.trim()}:{})};
}
