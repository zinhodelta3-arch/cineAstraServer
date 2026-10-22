import { randomBytes, randomUUID } from 'node:crypto';
import { constants, openSync, readFileSync, fstatSync, closeSync, mkdirSync, writeFileSync, linkSync, unlinkSync } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EnvironmentValidationError, validateEnv } from './env.js';

const defaultSecretFile = fileURLToPath(new URL('../../.storage/auth/jwt-secret', import.meta.url));

function readSecret(file) {
    const fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
        const stat = fstatSync(fd);
        if (!stat.isFile() || stat.size > 4096 || (stat.mode & 0o077) !== 0) {
            throw new Error('Invalid private secret file');
        }
        return readFileSync(fd, 'utf8').trim();
    } finally { closeSync(fd); }
}

function persistedSecret(file, candidate) {
    try { return readSecret(file); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }

    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    const temporary = `${file}.${randomUUID()}.tmp`;
    writeFileSync(temporary, `${candidate}\n`, { flag: 'wx', mode: 0o600 });
    try {
        // Publish a complete file without replacing another process's key.
        try { linkSync(temporary, file); }
        catch (error) { if (error.code !== 'EEXIST') throw error; }
    } finally { unlinkSync(temporary); }
    return readSecret(file);
}

export function runtimeConfig(env = process.env) {
    // Explicit configuration always wins and never touches the generated file.
    if (env.JWT_SECRET?.trim()) return validateEnv(env);

    const candidate = randomBytes(48).toString('hex');
    const config = validateEnv({ ...env, JWT_SECRET: candidate });
    // Independent containers must be configured with the same stable key.
    if (config.instances > 1) throw new EnvironmentValidationError(['JWT_SECRET']);
    const file = env.JWT_SECRET_FILE || defaultSecretFile;
    if (!isAbsolute(file)) throw new EnvironmentValidationError(['JWT_SECRET_FILE']);
    let secret;
    try {
        secret = persistedSecret(file, candidate);
        return validateEnv({ ...env, JWT_SECRET: secret });
    } catch {
        // Do not expose filesystem details, stored data or replace a corrupt key.
        throw new EnvironmentValidationError(['JWT_SECRET_FILE']);
    }
}
