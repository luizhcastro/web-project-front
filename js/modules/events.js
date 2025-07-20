
import { fetchData } from '../utils/api.js';
import { showCustomMessage, closeModal, openModal } from '../utils/ui.js';
import { loadDashboardData, loadUpcomingEvents } from './dashboard.js';

let allEventsData = [];

// Carrega e exibe os eventos na tabela. Aplica filtros de pesquisa e ano.
export async function loadEvents() {
    const eventsTableBody = document.getElementById('events-table-body');
    if (!eventsTableBody) return;

    const searchTerm = document.getElementById('event-search')?.value.toLowerCase() || '';
    const yearFilter = document.getElementById('event-year-filter')?.value || '';
    eventsTableBody.innerHTML = '';

    if (allEventsData.length === 0) {
        allEventsData = await fetchData(`http://localhost:3000/evento`);
    }

    const filteredEvents = allEventsData.filter(event => {
        const titleMatch = event.titulo.toLowerCase().includes(searchTerm);
        const editionMatch = event.edicao.toLowerCase().includes(searchTerm);
        const typeMatch = (event.tipo === 'pago' ? 'pago' : 'gratuito').includes(searchTerm);

        let yearMatch = true;
        if (yearFilter) {
            const eventYear = new Date(event.dataHoraInicio).getFullYear().toString();
            yearMatch = (eventYear === yearFilter);
        }
        return (titleMatch || editionMatch || typeMatch) && yearMatch;
    });

    if (filteredEvents && filteredEvents.length > 0) {
        filteredEvents.forEach(event => {
            const row = eventsTableBody.insertRow();
            row.innerHTML = `
                <td>${event.titulo}</td>
                <td>${event.edicao}</td>
                <td>${event.tipo === 'pago' ? 'Pago' : 'Gratuito'}</td>
                <td>${new Date(event.dataHoraInicio).toLocaleDateString('pt-BR')}</td>
                <td>${new Date(event.dataHoraFim).toLocaleDateString('pt-BR')}</td>
                <td>${event.taxa ? `R$ ${event.taxa.toFixed(2).replace('.', ',')}` : '-'}</td>
                <td class="actions">
                    <button class="action-btn view-btn" onclick="window.viewEvent('${event.idEvento}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" onclick="window.editEvent('${event.idEvento}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="window.deleteEvent('${event.idEvento}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });
    } else {
        eventsTableBody.innerHTML = '<tr><td colspan="7">Nenhum evento encontrado.</td></tr>';
    }
}

// Salva um novo evento ou atualiza um existente.
export async function saveEvent(e) {
    e.preventDefault();
    const id = e.target.dataset.id;
    const titulo = document.getElementById('event-title').value;
    const edicao = document.getElementById('event-edition').value;
    const tipo = document.getElementById('event-type').value;
    const dataHoraInicio = document.getElementById('event-start').value;
    const dataHoraFim = document.getElementById('event-end').value;
    let taxa = null;

    if (tipo === 'pago') {
        taxa = parseFloat(document.getElementById('event-fee').value);
        if (isNaN(taxa)) {
            showCustomMessage('Erro', 'Por favor, insira um valor válido para a taxa.');
            return;
        }
    }

    const eventData = {
        titulo,
        edicao,
        tipo,
        dataHoraInicio: new Date(dataHoraInicio).toISOString(),
        dataHoraFim: new Date(dataHoraFim).toISOString(),
    };

    if (tipo === 'pago') {
        eventData.taxa = taxa;
    }

    let result;
    if (id) {
        result = await fetchData(`http://localhost:3000/evento/${id}`, 'PATCH', eventData);
        if (result) showCustomMessage('Sucesso', 'Evento atualizado com sucesso!');
    } else {
        result = await fetchData(`http://localhost:3000/evento`, 'POST', eventData);
        if (result) showCustomMessage('Sucesso', 'Evento criado com sucesso!');
    }

    if (result) {
        closeModal('event');
        allEventsData = [];
        loadEvents();
        loadUpcomingEvents();
        loadDashboardData();
    }
}

// Exibe os detalhes de um evento.
export async function viewEvent(id) {
    const event = await fetchData(`http://localhost:3000/evento/${id}`);
    const activities = await fetchData(`http://localhost:3000/atividade`);
    const participations = await fetchData(`http://localhost:3000/participacao`);

    if (event) {
        let organizadorCount = 0;
        let palestranteCount = 0;
        let mediadorCount = 0;
        let monitorCount = 0;
        let ouvinteCount = 0;
        let totalParticipants = 0;

        const eventActivities = activities ? activities.filter(a => a.fk_idEvento === event.idEvento) : [];
        const eventActivityIds = new Set(eventActivities.map(a => a.idAtividade));

        if (participations) {
            participations.forEach(p => {
                if (eventActivityIds.has(p.fk_idAtividade)) {
                    totalParticipants++;
                    switch (p.tipo) {
                        case 'organizador':
                            organizadorCount++;
                            break;
                        case 'palestrante':
                            palestranteCount++;
                            break;
                        case 'mediador':
                            mediadorCount++;
                            break;
                        case 'monitor':
                            monitorCount++;
                            break;
                        case 'ouvinte':
                            ouvinteCount++;
                            break;
                    }
                }
            });
        }

        const receita = event.tipo === 'pago'
            ? `R$ ${(ouvinteCount * (event.taxa || 0)).toFixed(2).replace('.', ',')}`
            : '-';

        let details = `
Título: ${event.titulo}
Edição: ${event.edicao}
Tipo: ${event.tipo === 'pago' ? 'Pago' : 'Gratuito'}
Data Início: ${new Date(event.dataHoraInicio).toLocaleString('pt-BR')}
Data Fim: ${new Date(event.dataHoraFim).toLocaleString('pt-BR')}
Taxa: ${event.taxa ? `R$ ${event.taxa.toFixed(2).replace('.', ',')}` : '-'}

Organizadores: ${organizadorCount}
Palestrantes: ${palestranteCount}
Mediadores: ${mediadorCount}
Monitores: ${monitorCount}
Ouvintes: ${ouvinteCount}

Total de Participantes: ${totalParticipants}
Receita: ${receita}
        `;
        showCustomMessage('Detalhes do Evento', details);
    }
}

// Abre o modal de edição para um evento existente.
export async function editEvent(id) {
    const event = await fetchData(`http://localhost:3000/evento/${id}`);
    if (event) {
        openModal('event', event);
    }
}

// Exclui um evento.
export async function deleteEvent(id) {
    const confirmed = await showCustomMessage('Confirmação', 'Tem certeza que deseja excluir este evento?', true);
    if (confirmed) {
        const result = await fetchData(`http://localhost:3000/evento/${id}`, 'DELETE');
        if (result) {
            showCustomMessage('Sucesso', 'Evento excluído com sucesso!');
            allEventsData = [];
            loadEvents();
            loadUpcomingEvents();
            loadDashboardData();
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('event-search')?.addEventListener('input', loadEvents);
    document.getElementById('event-year-filter')?.addEventListener('input', loadEvents);
    document.getElementById('form-event')?.addEventListener('submit', saveEvent);
});