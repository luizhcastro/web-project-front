
import { fetchData } from '../utils/api.js';

// Carrega e exibe os palestrantes por evento selecionado.
export async function loadSpeakersTab() {
    const speakersEventSelect = document.getElementById('speakers-event');
    if (!speakersEventSelect) return;

    speakersEventSelect.innerHTML = '<option value="">Selecione um evento...</option>';
    const events = await fetchData(`http://localhost:3000/evento`);
    if (events && events.length > 0) {
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.idEvento;
            option.textContent = `${event.titulo} (${event.edicao})`;
            speakersEventSelect.appendChild(option);
        });
    } else {
        speakersEventSelect.innerHTML += '<option value="" disabled>Nenhum evento disponível</option>';
    }

    const speakersTableBody = document.getElementById('speakers-table-body');
    if (speakersTableBody) {
        speakersTableBody.innerHTML = '<tr><td colspan="6">Selecione um evento para ver os palestrantes.</td></tr>';
    }
}

// Event Listener para carregar palestrantes quando um evento é selecionado
document.addEventListener('DOMContentLoaded', () => {
    const speakersEventSelect = document.getElementById('speakers-event');
    if (speakersEventSelect) {
        speakersEventSelect.addEventListener('change', async () => {
            const eventId = speakersEventSelect.value;
            const speakersTableBody = document.getElementById('speakers-table-body');
            if (!speakersTableBody) return;

            speakersTableBody.innerHTML = '';

            if (eventId) {
                const activities = await fetchData(`http://localhost:3000/atividade`);
                const participations = await fetchData(`http://localhost:3000/participacao`);
                const participants = await fetchData(`http://localhost:3000/participante`);

                const eventActivities = activities ? activities.filter(a => a.fk_idEvento === parseInt(eventId)) : [];

                if (eventActivities.length > 0) {
                    let foundSpeakers = false;
                    for (const activity of eventActivities) {
                        const speakersInActivity = participations
                            ? participations.filter(p => p.fk_idAtividade === activity.idAtividade && p.tipo === 'palestrante')
                            : [];

                        for (const participation of speakersInActivity) {
                            const speaker = participants?.find(p => p.idParticipante === participation.fk_idParticipante);
                            if (speaker) {
                                foundSpeakers = true;
                                const row = speakersTableBody.insertRow();
                                row.innerHTML = `
                                    <td>${activity.titulo}</td>
                                    <td>${activity.tipo}</td>
                                    <td>${new Date(activity.dataHoraInicio).toLocaleDateString('pt-BR')}</td>
                                    <td>${new Date(activity.dataHoraInicio).toLocaleTimeString('pt-BR').substring(0, 5)}</td>
                                    <td>${speaker.nome}</td>
                                    <td>${speaker.email}</td>
                                `;
                            }
                        }
                    }
                    if (!foundSpeakers) {
                        speakersTableBody.innerHTML = '<tr><td colspan="6">Nenhum palestrante encontrado para o evento selecionado.</td></tr>';
                    }
                } else {
                    speakersTableBody.innerHTML = '<tr><td colspan="6">Nenhuma atividade encontrada para o evento selecionado.</td></tr>';
                }
            } else {
                speakersTableBody.innerHTML = '<tr><td colspan="6">Selecione um evento para ver os palestrantes.</td></tr>';
            }
        });
    }
});

// Exporta a função para ser acessível globalmente
window.loadSpeakersTab = loadSpeakersTab;