import {ApiError} from '../utils/ApiError.js';

const today=()=>new Date().toISOString().slice(0,10);
function validDate(value){
    return typeof value==='string'&&/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)&&
        Number.isFinite(Date.parse(`${value}T00:00:00Z`))&&new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)===value;
}
export function ageOn(birth,on=today()){
    if(!validDate(birth)||!validDate(on)||birth>on)return -1;
    return Number(on.slice(0,4))-Number(birth.slice(0,4))-(on.slice(5)<birth.slice(5)?1:0);
}
export function createAgePolicy({allowSelfDeclaredAge=false}={}){
    function resolve(user,proof){
        const age=ageOn(user.data_nascimento);
        if(age<0)throw new ApiError('Confira a data de nascimento da conta; ela deve ser válida e não pode estar no futuro',422,null,'AGE_DATE_INVALID');
        if(proof&&['ATE_16','MAIOR_16'].includes(proof.faixa_etaria))return {...proof,source:'VERIFIED'};
        if(allowSelfDeclaredAge===true)return {faixa_etaria:age>16?'MAIOR_16':'ATE_16',source:'SELF_DECLARED'};
        throw new ApiError('Sua conta precisa concluir ou renovar a verificação de idade',403,null,'AGE_VERIFICATION_REQUIRED');
    }
    function requireIndependent(user,proof){
        const result=resolve(user,proof);
        if(result.faixa_etaria==='ATE_16')throw new ApiError('Esta operação não está disponível para a faixa etária da conta',403,null,'AGE_RESTRICTION');
        return result;
    }
    return {resolve,requireIndependent};
}
