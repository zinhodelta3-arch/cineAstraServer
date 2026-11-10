const dayPattern = /(?:^|\s)(?:(?:em|para)\s+)?(hoje|amanhã|amanha|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{4})?)(?=$|\s|,)/i;
const locationPattern = /\s+(?:no|na)\s+(.+)$/i;
const showtimeQuestion = /^(?:(?:quais (?:são )?os )?horários? (?:de|d[oa])|(?:quais (?:são )?as )?sessões (?:de|d[oa])|(?:tem|há) (?:sessão|sessões) (?:de|d[oa]))\s+(.+)$/i;
const availabilityQuestion = /^(?:tem|há)\s+(?:o filme\s+)?(.+)$/i;

function normalize(value) {
    return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR').trim();
}

function dateKey(value, now) {
    const today = now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    if (value === 'hoje') return today;
    if (normalize(value) === 'amanha') {
        const tomorrow = new Date(`${today}T00:00:00Z`);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        return tomorrow.toISOString().slice(0, 10);
    }
    if (value.includes('/')) {
        const [day, month, year = today.slice(0, 4)] = value.split('/');
        value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

function displayDate(date) {
    return date.split('-').reverse().join('/');
}

function selectNamed(items, term, field) {
    const exact = items.filter(item => normalize(item[field]) === normalize(term));
    return exact.length ? exact : items;
}

function cinemaAddress(cinema) {
    const street = [cinema.logradouro, cinema.numero].filter(Boolean).join(' ');
    return [street, cinema.cidade].filter(Boolean).join(', ');
}

export function createAssistantShowtimes({ catalog, venues, sessions, now = () => new Date() }) {
    return async function answerShowtimes(question) {
        const explicit = question.match(showtimeQuestion);
        let subject = (explicit ?? question.match(availabilityQuestion))?.[1];
        if (!subject) return null;

        const dateToken = subject.match(dayPattern)?.[1];
        if (dateToken) subject = subject.replace(dayPattern, ' ').trim();
        const location = subject.match(locationPattern)?.[1]?.replace(/,\s*$/, '').trim();
        if (!explicit && !dateToken && !location) return null;
        const title = (location ? subject.replace(locationPattern, '') : subject).replace(/,\s*$/, '').trim();
        const date = dateToken && dateKey(dateToken, now());
        if (dateToken && !date) return 'Essa data parece inválida. Tente informar o dia no formato DD/MM/AAAA.';
        if (!title || title.length > 200) return 'Qual filme você quer consultar?';

        const { items: filmMatches } = await catalog.listFilms({ cinema: true, titulo: title, limit: 8 }, false);
        const films = selectNamed(filmMatches, title, 'titulo');
        if (!films.length) return 'Não encontrei esse título no catálogo do cinema. Confira o nome do filme e tente de novo.';
        if (films.length > 1) return `Encontrei mais de um filme. Qual deles você quer consultar?\n\n${films.map(film => `• ${film.titulo}`).join('\n')}`;

        const film = films[0];
        let cinema;
        if (location) {
            const [name, ...qualifiers] = location.split(',').map(part => part.trim());
            if (!name || name.length > 150) return 'Informe o nome da unidade que você quer consultar.';
            const { items } = await venues.list('local', {}, { name, limit: 100 });
            const matches = items.filter(item => qualifiers.every(term => normalize(cinemaAddress(item)).includes(normalize(term))));
            const cinemas = selectNamed(matches, name, 'nome');
            if (!cinemas.length) return 'Não encontrei esse cinema. Confira o nome da unidade e tente de novo.';
            if (cinemas.length > 1) {
                const options = cinemas.slice(0, 6).map(item => `• ${item.nome} · ${cinemaAddress(item)}`).join('\n');
                return `Encontrei mais de uma unidade. Repita a pergunta com o nome do cinema, uma vírgula e a rua ou cidade.\n\n${options}`;
            }
            [cinema] = cinemas;
        }

        const { items, hasMore } = await sessions.upcomingForFilm(film.id_filme, { date, localId: cinema?.id_local });
        const filters = `${date ? ` em ${displayDate(date)}` : ''}${cinema ? ` no ${cinema.nome}` : ''}`;
        if (!items.length) return `Não encontrei sessões futuras de ${film.titulo}${filters}. Tente consultar outra data ou unidade.`;

        return {
            message: `Sessões de ${film.titulo}${filters}.${hasMore ? ' Mostrando os primeiros horários.' : ' Selecione um horário para escolher seus assentos.'}`,
            sessions: items.map(item => ({
                id: item.id_sessao,
                label: `${displayDate(item.data)} · ${item.horario_inicio.slice(0, 5)} · ${item.nome_local} · ${item.idioma}`
            }))
        };
    };
}
