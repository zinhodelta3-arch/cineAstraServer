export function readableSlug(name, id, fallback) {
    return `CONCAT(COALESCE(NULLIF(TRIM(BOTH '-' FROM LEFT(LOWER(REGEXP_REPLACE(${name},'[^[:alnum:]]+','-')),140)),''),'${fallback}'),
        '-',LEFT(SHA2(CONCAT('${fallback}:',${id}),256),16))`;
}

export const catalogSlugPattern = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*-[a-f0-9]{16}$/u;

export function catalogReference(value) {
    return typeof value === 'string' && value.length <= 180 &&
        (/^[1-9]\d{0,9}$/.test(value) && Number(value) <= 4294967295 || catalogSlugPattern.test(value));
}
