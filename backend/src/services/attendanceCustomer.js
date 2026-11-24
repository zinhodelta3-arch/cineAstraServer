export function customerSearchTerm(query) {
    if (query.includes('@')) return { condition: 'u.email=?', value: query.toLowerCase() };
    return { condition: "u.nome LIKE ? ESCAPE '!'", value: `%${query.replace(/[!%_]/g, char => `!${char}`)}%` };
}

export function maskedCustomerEmail(value) {
    const [mailbox, domain] = (value ?? '').split('@');
    return mailbox && domain ? `${mailbox.slice(0,2)}•••@${domain}` : null;
}
