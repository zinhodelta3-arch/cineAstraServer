export const purchaseVerificationPath = '/cinema/comprovante';
const pattern = /^CA-([1-9][0-9]{0,19})(?:-[A-F0-9]{6}){4}$/;

export function validPurchaseReference(value) {
  const match = typeof value === 'string' && pattern.exec(value);
  return Boolean(match && BigInt(match[1]) <= 18446744073709551615n);
}

export function purchaseVerificationHref(reference) {
  return `${purchaseVerificationPath}?referencia=${reference}`;
}
