const fields = new Map(Object.entries({
 name:'nome completo', email:'e-mail', cpf:'CPF (11 números)',
 dateOfBirth:'data de nascimento', password:'senha', passwordConfirmation:'confirmação da senha',
 termsVersion:'versão dos termos', privacyVersion:'versão da política de privacidade',
 acceptTerms:'aceite dos termos', acceptPrivacy:'aceite da política de privacidade',
 documentsSource:'configuração dos documentos de teste', captchaToken:'captcha', ageProof:'verificação de idade',
}));
const messages = new Set([
 'Documentos locais de teste indisponíveis ou versões inválidas',
 'Verificação de idade obrigatória',
 'Aceite as versões atuais dos termos e da privacidade',
]);
export function registrationErrorMessage(payload) {
 const invalid = Array.isArray(payload?.details)
  ? [...new Set(payload.details.map(d => fields.get(d?.field)).filter(Boolean))] : [];
 if (invalid.length) return `Confira os seguintes campos: ${invalid.join(', ')}.`;
 if (messages.has(payload?.message)) return `${payload.message}.`;
 return 'Confira os dados do cadastro, a confirmação da senha e o aceite dos documentos. A senha deve ter pelo menos 12 caracteres, maiúscula, minúscula, número e símbolo.';
}
