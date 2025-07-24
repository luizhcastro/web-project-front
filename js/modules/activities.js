// activities.js
import { fetchData } from '../utils/api.js';
import { showCustomMessage, closeModal, openModal } from '../utils/ui.js';
import { loadDashboardData } from './dashboard.js';

let allActivitiesData = [];
let allParticipationsDataForActivities = [];

// Carrega e exibe as atividades na tabela. Aplica filtros de pesquisa e ano.
export async function loadActivities() {
    const activitiesTableBody = document.getElementById('activities-table-body');
    if (!activitiesTableBody) return;

    const searchTerm = document.getElementById('activity-search')?.value.toLowerCase() || '';
    const yearFilter = document.getElementById('activity-year-filter')?.value || '';
    activitiesTableBody.innerHTML = '';

    // Garante que os dados de atividades e eventos sejam carregados
    if (allActivitiesData.length === 0) {
        allActivitiesData = await fetchData(`http://localhost:3000/atividade`);
    }
    allParticipationsDataForActivities = await fetchData(`http://localhost:3000/participacao`);
    const events = await fetchData(`http://localhost:3000/evento`); // Garante que os eventos são carregados

    const filteredActivities = allActivitiesData.filter(activity => {
        const event = events ? events.find(e => e.idEvento === activity.fk_idEvento) : null;
        const eventTitleWithEdition = event ? `${event.titulo} (${event.edicao})`.toLowerCase() : ''; // Pega o título com edição
        
        const titleMatch = activity.titulo.toLowerCase().includes(searchTerm);
        const typeMatch = activity.tipo.toLowerCase().includes(searchTerm);
        const eventMatch = eventTitleWithEdition.includes(searchTerm); // Inclui a edição na pesquisa do evento

        let yearMatch = true;
        if (yearFilter) {
            const activityYear = new Date(activity.dataHoraInicio).getFullYear().toString();
            yearMatch = (activityYear === yearFilter);
        }
        return (titleMatch || typeMatch || eventMatch) && yearMatch;
    });

    if (filteredActivities && filteredActivities.length > 0) {
        filteredActivities.forEach(activity => {
            const event = events ? events.find(e => e.idEvento === activity.fk_idEvento) : null;
            const eventDisplay = event ? `${event.titulo} (${event.edicao})` : 'N/A'; // Formata para exibição
            
            const currentOuvintesCount = allParticipationsDataForActivities.filter(p => p.fk_idAtividade === activity.idAtividade && p.tipo === 'ouvinte').length;
            const vagasLivres = activity.qntdMaximaOuvintes - currentOuvintesCount;

            const row = activitiesTableBody.insertRow();
            row.innerHTML = `
                <td>${activity.tipo}</td>
                <td>${activity.titulo}</td>
                <td>${eventDisplay}</td> <td>${new Date(activity.dataHoraInicio).toLocaleString('pt-BR')}</td>
                <td>${new Date(activity.dataHoraFim).toLocaleString('pt-BR')}</td>
                <td>${activity.qntdMaximaOuvintes}</td>
                <td>${vagasLivres}</td>
                <td class="actions">
                    <button class="action-btn view-btn" onclick="window.viewActivity('${activity.idAtividade}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" onclick="window.editActivity('${activity.idAtividade}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="window.deleteActivity('${activity.idAtividade}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });
    } else {
        activitiesTableBody.innerHTML = '<tr><td colspan="8">Nenhuma atividade encontrada.</td></tr>';
    }

    // Lógica para popular o dropdown de eventos no modal (já estava correto)
    const activityEventSelect = document.getElementById('activity-event');
    if (activityEventSelect) {
        activityEventSelect.innerHTML = '<option value="">Selecione...</option>';
        if (events && events.length > 0) {
            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.idEvento;
                option.textContent = `${event.titulo} (${event.edicao})`;
                activityEventSelect.appendChild(option);
            });
        } else {
            activityEventSelect.innerHTML += '<option value="" disabled>Nenhum evento disponível</option>';
        }
    }
}

// Salva uma nova atividade ou atualiza uma existente.
export async function saveActivity(e) {
    e.preventDefault();

    const id = e.target.dataset.id;
    const tipo = document.getElementById('activity-type').value;
    const titulo = document.getElementById('activity-title').value;
    const fk_idEvento = parseInt(document.getElementById('activity-event').value);
    const dataHoraInicio = document.getElementById('activity-start').value;
    const dataHoraFim = document.getElementById('activity-end').value;
    const qntdMaximaOuvintes = parseInt(document.getElementById('activity-max').value);

    if (isNaN(fk_idEvento) || isNaN(qntdMaximaOuvintes)) {
        showCustomMessage('Erro', 'Por favor, preencha todos os campos numéricos corretamente.');
        return;
    }

    // Validação: data/hora fim não pode ser menor que início
    const inicioDate = new Date(dataHoraInicio);
    const fimDate = new Date(dataHoraFim);
    if (fimDate < inicioDate) {
        showCustomMessage('Erro', 'A data/hora de fim não pode ser menor que a data/hora de início.');
        return;
    }

    const activityData = {
        tipo,
        titulo,
        fk_idEvento,
        dataHoraInicio: inicioDate.toISOString(),
        dataHoraFim: fimDate.toISOString(),
        qntdMaximaOuvintes: qntdMaximaOuvintes,
    };

    let result;
    if (id) {
        result = await fetchData(`http://localhost:3000/atividade/${id}`, 'PATCH', activityData);
        if (result) showCustomMessage('Sucesso', 'Atividade atualizada com sucesso!');
    } else {
        result = await fetchData(`http://localhost:3000/atividade`, 'POST', activityData);
        if (result) showCustomMessage('Sucesso', 'Atividade criada com sucesso!');
    }

    if (result) {
        closeModal('activity');
        allActivitiesData = []; // Limpa cache para recarregar
        allParticipationsDataForActivities = []; // Limpa cache para recarregar
        loadActivities();
        loadDashboardData();
    }
}

// Exibe os detalhes de uma atividade.
export async function viewActivity(id) {
    const activity = await fetchData(`http://localhost:3000/atividade/${id}`);
    const event = activity ? await fetchData(`http://localhost:3000/evento/${activity.fk_idEvento}`) : null;
    const participations = await fetchData(`http://localhost:3000/participacao`);

    if (activity) {
        let organizadorCount = 0;
        let palestranteCount = 0;
        let mediadorCount = 0;
        let monitorCount = 0;
        let ouvinteCount = 0;
        let totalParticipants = 0;

        if (participations) {
            participations.forEach(p => {
                if (p.fk_idAtividade === activity.idAtividade) {
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

        const vagasLivres = activity.qntdMaximaOuvintes - ouvinteCount;
        let details = `
Tipo: ${activity.tipo}
Título: ${activity.titulo}
Evento: ${event ? `${event.titulo} (${event.edicao})` : 'N/A'} Data Início: ${new Date(activity.dataHoraInicio).toLocaleString('pt-BR')}
Data Fim: ${new Date(activity.dataHoraFim).toLocaleString('pt-BR')}
Vagas Máximas: ${activity.qntdMaximaOuvintes}
Vagas Livres: ${vagasLivres}

Organizadores: ${organizadorCount}
Palestrantes: ${palestranteCount}
Mediadores: ${mediadorCount}
Monitores: ${monitorCount}
Ouvintes: ${ouvinteCount}

Total de Participações: ${totalParticipants}

        `;
        showCustomMessage('Detalhes da Atividade', details);
    }
}

// Abre o modal de edição para uma atividade existente.
export async function editActivity(id) {
    const activity = await fetchData(`http://localhost:3000/atividade/${id}`);
    if (activity) {
        openModal('activity', activity);
    }
}

// Exclui uma atividade.
export async function deleteActivity(id) {
    const confirmed = await showCustomMessage('Confirmação', 'Tem certeza que deseja excluir esta atividade?', true);
    if (confirmed) {
        const result = await fetchData(`http://localhost:3000/atividade/${id}`, 'DELETE');
        if (result) {
            showCustomMessage('Sucesso', 'Atividade excluída com sucesso!');
            allActivitiesData = []; // Limpa cache para recarregar
            allParticipationsDataForActivities = []; // Limpa cache para recarregar
            loadActivities();
            loadDashboardData();
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('form-activity')?.addEventListener('submit', saveActivity);
});

// Exporta as funções para serem acessíveis globalmente
window.loadActivities = loadActivities;
window.saveActivity = saveActivity;
window.viewActivity = viewActivity;
window.editActivity = editActivity;
window.deleteActivity = deleteActivity;