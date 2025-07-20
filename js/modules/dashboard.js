import { fetchData } from '../utils/api.js';
import { viewEvent, editEvent, deleteEvent } from './events.js';

// Carrega e exibe os dados resumidos no dashboard.
export async function loadDashboardData() {
    const events = await fetchData(`http://localhost:3000/evento`);
    const activities = await fetchData(`http://localhost:3000/atividade`);
    const participants = await fetchData(`http://localhost:3000/participante`);
    const registrations = await fetchData(`http://localhost:3000/participacao`); // Fetch registrations

    document.getElementById('dashboard-active-events').textContent = events ? events.length : 0;
    document.getElementById('dashboard-activities').textContent = activities ? activities.length : 0;
    document.getElementById('dashboard-participants').textContent = participants ? participants.length : 0;
    document.getElementById('dashboard-registrations').textContent = registrations ? registrations.length : 0; // Display registrations count
}

// Carrega e exibe os próximos eventos na tabela do dashboard.
export async function loadUpcomingEvents() {
    const eventsTableBody = document.getElementById('upcoming-events-table-body');
    if (!eventsTableBody) return;

    eventsTableBody.innerHTML = '';
    const events = await fetchData(`http://localhost:3000/evento`);

    if (events && events.length > 0) {
        const now = new Date();
        const upcomingEvents = events.filter(event => new Date(event.dataHoraInicio) > now);

        if (upcomingEvents.length === 0) {
            eventsTableBody.innerHTML = '<tr><td colspan="6">Nenhum evento futuro encontrado.</td></tr>';
            return;
        }

        upcomingEvents.forEach(event => {
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

// Exporta as funções para que possam ser acessadas globalmente via window
window.loadDashboardData = loadDashboardData;
window.loadUpcomingEvents = loadUpcomingEvents;
window.viewEvent = viewEvent;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;