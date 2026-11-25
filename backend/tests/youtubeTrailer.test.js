import test from 'node:test';
import assert from 'node:assert/strict';
import { isYoutubeTrailerHost, youtubeTrailerId } from '../src/utils/youtubeTrailer.js';
import { createCatalogService } from '../src/services/catalogService.js';

function serviceFixture(mediaHosts = []) {
    let films = [];
    let id = 0;
    const model = {
        async film(key) { return films.find(r => r.id_filme === key); },
        async createFilm(c, input) { const key = String(++id); films.push({ id_filme: key, ...input }); return key; },
        async patchFilm(c, key, input) { Object.assign(films.find(r => r.id_filme === key), input); }
    };
    const identity = {
        async transaction(fn) { return fn({}); },
        async activeActor() { return { tipo_usuario: 'ADMIN' }; },
        async audit() {}
    };
    return { service: createCatalogService({ model, identity, mediaHosts }), films };
}

const baseFilm = { titulo: 'Filme Teste', duracao: 100, classificacao: '12', disponivel_cinema: true, disponivel_streaming: false, status: 'ATIVO' };

test('youtubeTrailerId extrai IDs válidos em todos os formatos suportados pelo frontend', () => {
    for (const url of [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ&t=30',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ?si=token',
        'https://youtu.be/dQw4w9WgXcQ/',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        'https://www.youtube.com/shorts/dQw4w9WgXcQ'
    ]) {
        assert.equal(youtubeTrailerId(url), 'dQw4w9WgXcQ', url);
    }
    for (const invalid of [
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.youtube.com/@cineastra',
        'https://www.youtube.com/watch?v=curto',
        'https://evil.invalid/watch?v=dQw4w9WgXcQ',
        'https://user:pass@www.youtube.com/watch?v=dQw4w9WgXcQ',
        null,
        ''
    ]) {
        assert.equal(youtubeTrailerId(invalid), null, String(invalid));
    }
    assert.equal(isYoutubeTrailerHost('www.youtube.com'), true);
    assert.equal(isYoutubeTrailerHost('youtu.be'), true);
    assert.equal(isYoutubeTrailerHost('evil.invalid'), false);
});

test('catálogo aceita trailers do YouTube sem exigir CATALOG_MEDIA_HOSTS e mantém bloqueio para hosts não autorizados', async () => {
    const { service } = serviceFixture([]);
    const created = await service.saveFilm(undefined, {
        ...baseFilm,
        trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    }, {});
    assert.equal(created.trailer, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    const patched = await service.saveFilm(created.id_filme, {
        trailer: 'https://youtu.be/dQw4w9WgXcQ'
    }, {});
    assert.equal(patched.trailer, 'https://youtu.be/dQw4w9WgXcQ');

    const cleared = await service.saveFilm(created.id_filme, { trailer: null }, {});
    assert.equal(cleared.trailer, null);

    await assert.rejects(
        service.saveFilm(undefined, { ...baseFilm, trailer: 'https://www.youtube.com/@cineastra' }, {}),
        err => err.statusCode === 422 && err.details?.[0]?.code === 'INVALID_TRAILER_URL'
    );
    await assert.rejects(
        service.saveFilm(undefined, { ...baseFilm, trailer: 'https://evil.invalid/trailer.mp4' }, {}),
        err => err.statusCode === 422 && err.details?.[0]?.code === 'MEDIA_HOST_DENIED'
    );
    await assert.rejects(
        service.saveFilm(undefined, { ...baseFilm, url_reproducao: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, {}),
        err => err.statusCode === 422 && err.details?.[0]?.code === 'MEDIA_HOST_DENIED'
    );
});

test('catálogo continua aceitando hosts explícitos de CATALOG_MEDIA_HOSTS em trailer e url_reproducao', async () => {
    const { service } = serviceFixture(['media.example.invalid']);
    const created = await service.saveFilm(undefined, {
        ...baseFilm,
        disponivel_streaming: true,
        trailer: 'https://media.example.invalid/trailer.mp4',
        url_reproducao: 'https://media.example.invalid/movie.m3u8'
    }, {});
    assert.equal(created.trailer, 'https://media.example.invalid/trailer.mp4');
    assert.equal(created.url_reproducao, 'https://media.example.invalid/movie.m3u8');
});
