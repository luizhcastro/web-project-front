// js/modules/dashboard.js

import { fetchData } from '../utils/api.js';
import { viewEvent, editEvent, deleteEvent } from './events.js'; // Importa funções de eventos para os botões

// Carrega e exibe os dados resumidos no dashboard.
export async function loadDashboardData() {
    const events = await fetchData(`http://localhost:3000/evento`);
    const activities = await fetchData(`http://localhost:3000/atividade`);
    const participants = await fetchData(`http://localhost:3000/participante`);
    const registrations = await fetchData(`http://localhost:3000/participacao`); // Busca os dados de participação/inscrição

    document.getElementById('dashboard-active-events').textContent = events ? events.length : 0;
    document.getElementById('dashboard-activities').textContent = activities ? activities.length : 0;
    document.getElementById('dashboard-participants').textContent = participants ? participants.length : 0;
    document.getElementById('dashboard-registrations').textContent = registrations ? registrations.length : 0; // Atualiza o contador de inscrições
}

// Carrega e exibe os próximos eventos na tabela do dashboard.
export async function loadUpcomingEvents() {
    const eventsTableBody = document.getElementById('upcoming-events-table-body');
    if (!eventsTableBody) return;

    const searchTerm = document.getElementById('upcoming-event-search')?.value.toLowerCase() || '';
    const yearFilter = document.getElementById('upcoming-event-year-filter')?.value || '';

    eventsTableBody.innerHTML = ''; // Limpa a tabela antes de carregar novos resultados
    const events = await fetchData(`http://localhost:3000/evento`);

    if (events && events.length > 0) {
        // --- Início da lógica de desduplicação (mantida para robustez) ---
        const uniqueEventsMap = new Map();
        events.forEach(event => {
            if (event.idEvento) { // Garante que o evento tem um ID para ser usado como chave
                uniqueEventsMap.set(event.idEvento, event);
            }
        });
        const uniqueEvents = Array.from(uniqueEventsMap.values());
        // --- Fim da lógica de desduplicação ---

        const now = new Date();
        const filteredUpcomingEvents = uniqueEvents.filter(event => { // Filtra a partir dos eventos únicos
            const eventDate = new Date(event.dataHoraInicio);
            // Verifica se o evento está no futuro
            const isUpcoming = eventDate > now;

            // Lógica de filtro para Título, Edição e Tipo
            const titleMatch = event.titulo.toLowerCase().includes(searchTerm);
            const editionMatch = event.edicao.toLowerCase().includes(searchTerm);
            const typeDisplay = event.tipo === 'pago' ? 'pago' : 'gratuito';
            const typeMatch = typeDisplay.includes(searchTerm);

            // Lógica de filtro por ano
            let yearMatch = true;
            if (yearFilter) {
                const eventYear = eventDate.getFullYear().toString();
                yearMatch = (eventYear === yearFilter);
            }
            
            // Retorna true se for um evento futuro E (título OU edição OU tipo correspondem) E (o ano corresponde, se o filtro de ano estiver ativo)
            return isUpcoming && (titleMatch || editionMatch || typeMatch) && yearMatch;
        });

        if (filteredUpcomingEvents.length === 0) {
            eventsTableBody.innerHTML = '<tr><td colspan="6">Nenhum evento futuro encontrado.</td></tr>';
            return;
        }

        filteredUpcomingEvents.forEach(event => {
            const row = eventsTableBody.insertRow();
            row.innerHTML = `
                <td>${event.titulo}</td>
                <td>${event.edicao}</td>
                <td>${event.tipo === 'pago' ? 'Pago' : 'Gratuito'}</td>
                <td>${new Date(event.dataHoraInicio).toLocaleDateString('pt-BR')}</td>
                <td>${new Date(event.dataHoraFim).toLocaleDateString('pt-BR')}</td>
                <td class="actions">
                    <button class="action-btn view-btn" onclick="window.viewEvent('${event.idEvento}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" onclick="window.editEvent('${event.idEvento}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="window.deleteEvent('${event.idEvento}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });
    } else {
        eventsTableBody.innerHTML = '<tr><td colspan="6">Nenhum evento futuro encontrado.</td></tr>';
    }
}

// REMOVIDO: Os event listeners duplicados. Agora, o main.js é o único responsável por disparar loadUpcomingEvents.
/*
document.addEventListener('DOMContentLoaded', () => {
    const upcomingEventSearchInput = document.getElementById('upcoming-event-search');
    const upcomingEventYearFilterInput = document.getElementById('upcoming-event-year-filter');

    if (upcomingEventSearchInput) {
        upcomingEventSearchInput.addEventListener('input', loadUpcomingEvents);
    }
    if (upcomingEventYearFilterInput) {
        upcomingEventYearFilterInput.addEventListener('input', loadUpcomingEvents);
    }
});
*/

// Exporta as funções para que possam ser acessíveis globalmente via window
window.loadDashboardData = loadDashboardData;
window.loadUpcomingEvents = loadUpcomingEvents;
window.viewEvent = viewEvent; // Certifica que as funções de evento estão disponíveis
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;