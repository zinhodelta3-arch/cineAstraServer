export function loginDestination(role) {
 if (role === 'ADMIN') return '/admin/dashboard';
 if (role === 'SUPERVISOR') return null;
 if (['CLIENTE','FORNECEDOR','COLABORADOR'].includes(role)) return '/cinema/home';
 return null;
}
export const passwordValid = (password, confirmation) => password === confirmation && password.length >= 12 && new TextEncoder().encode(password).length <= 72 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^a-zA-Z0-9]/.test(password);
