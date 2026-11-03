export function loginDestination(role) {
 if (role === 'ADMIN') return '/admin/dashboard';
 if (role === 'SUPERVISOR' || role === 'COLABORADOR') return '/unidade';
 if (role === 'FORNECEDOR') return '/fornecedor';
 if (role === 'CLIENTE') return '/cinema/home';
 return null;
}
export const passwordValid = (password, confirmation) => password === confirmation && password.length >= 12 && new TextEncoder().encode(password).length <= 72 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^a-zA-Z0-9]/.test(password);
