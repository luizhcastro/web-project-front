
import { fetchData } from '../utils/api.js';
import { showCustomMessage, closeModal, openModal } from '../utils/ui.js';

let allRegistrationsData = [];

// Popula os dropdowns de Eventos e Participantes no modal de inscrição.
export async function populateRegistrationDropdowns() {
    const registrationEventSelect = document.getElementById('registration-event');
    const registrationParticipantSelect = document.getElementById('registration-participant');
    const registrationActivitySelect = document.getElementById('registration-activity');

    if (!registrationEventSelect || !registrationParticipantSelect || !registrationActivitySelect) {
        console.error('Um ou mais elementos dropdown de inscrição não foram encontrados.');
        return;
    }

    // Limpa e popula eventos
    registrationEventSelect.innerHTML = '<option value="">Selecione um evento...</option>';
    const events = await fetchData(`http://localhost:3000/evento`);
    if (events && events.length > 0) {
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.idEvento;
            option.textContent = event.titulo;
            registrationEventSelect.appendChild(option);
        });
    } else {
        registrationEventSelect.innerHTML += '<option value="" disabled>Nenhum evento disponível</option>';
    }

    // Limpa e popula participantes
    registrationParticipantSelect.innerHTML = '<option value="">Selecione um participante...</option>';
    const participants = await fetchData(`http://localhost:3000/participante`);
    if (participants && participants.length > 0) {
        participants.forEach(participant => {
            const option = document.createElement('option');
            option.value = participant.idParticipante;
            option.textContent = participant.nome;
            registrationParticipantSelect.appendChild(option);
        });
    } else {
        registrationParticipantSelect.innerHTML += '<option value="" disabled>Nenhum participante disponível</option>';
    }

    // Inicializa o dropdown de atividades como desabilitado
    registrationActivitySelect.innerHTML = '<option value="">Selecione um evento primeiro...</option>';
    registrationActivitySelect.disabled = true;
}

// Atualiza o dropdown de atividades com base no evento selecionado.
export async function updateActivitiesDropdown() {
    const eventId = document.getElementById('registration-event').value;
    const registrationActivitySelect = document.getElementById('registration-activity');
    if (!registrationActivitySelect) return;

    registrationActivitySelect.innerHTML = '<option value="">Selecione uma atividade...</option>';
    registrationActivitySelect.disabled = true;

    if (eventId) {
        const activities = await fetchData(`http://localhost:3000/atividade`);
        const filteredActivities = activities ? activities.filter(activity => activity.fk_idEvento === parseInt(eventId)) : [];

        if (filteredActivities.length > 0) {
            filteredActivities.forEach(activity => {
                const option = document.createElement('option');
                option.value = activity.idAtividade;
                option.textContent = activity.titulo;
                registrationActivitySelect.appendChild(option);
            });
            registrationActivitySelect.disabled = false;
        } else {
            registrationActivitySelect.innerHTML = '<option value="" disabled>Nenhuma atividade para este evento</option>';
        }
    }
}

// Carrega e exibe as inscrições na tabela. Aplica filtros de pesquisa e ano de nascimento.
export async function loadRegistrations() {
    const registrationsTableBody = document.getElementById('registrations-table-body');
    if (!registrationsTableBody) return;

    const searchTerm = document.getElementById('registration-search')?.value.toLowerCase() || '';
    const birthYearFilter = document.getElementById('registration-birth-date-filter')?.value || '';
    registrationsTableBody.innerHTML = '';

    if (allRegistrationsData.length === 0) {
        allRegistrationsData = await fetchData(`http://localhost:3000/participacao`);
    }
    const participants = await fetchData(`http://localhost:3000/participante`);
    const events = await fetchData(`http://localhost:3000/evento`);
    const activities = await fetchData(`http://localhost:3000/atividade`);


    const filteredRegistrations = allRegistrationsData.filter(registration => {
        const participant = participants?.find(p => p.idParticipante === registration.fk_idParticipante);
        const activity = activities?.find(a => a.idAtividade === registration.fk_idAtividade);
        const event = events?.find(e => e.idEvento === activity?.fk_idEvento);

        const participantMatch = participant?.nome.toLowerCase().includes(searchTerm) || false;
        const eventMatch = event?.titulo.toLowerCase().includes(searchTerm) || false;
        const activityMatch = activity?.titulo.toLowerCase().includes(searchTerm) || false;

        let yearMatch = true;
        if (birthYearFilter) {
            if (participant && participant.dataDeNascimento) {
                const participantBirthYear = new Date(participant.dataDeNascimento).getFullYear().toString();
                yearMatch = (participantBirthYear === birthYearFilter);
            } else {
                yearMatch = false;
            }
        }
        return (participantMatch || eventMatch || activityMatch) && yearMatch;
    });

    if (filteredRegistrations && filteredRegistrations.length > 0) {
        for (const registration of filteredRegistrations) {
            const participant = participants?.find(p => p.idParticipante === registration.fk_idParticipante);
            const activity = activities?.find(a => a.idAtividade === registration.fk_idAtividade);
            const event = events?.find(e => e.idEvento === activity?.fk_idEvento);

            const row = registrationsTableBody.insertRow();
            row.innerHTML = `
                <td>${participant ? participant.nome : 'N/A'}</td>
                <td>${event ? event.titulo : 'N/A'}</td>
                <td>${activity ? activity.titulo : 'N/A'}</td>
                <td>${registration.tipo}</td>
                <td class="actions">
                    <button class="action-btn view-btn" onclick="window.viewRegistration('${registration.idParticipacao}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" onclick="window.editRegistration('${registration.idParticipacao}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="window.deleteRegistration('${registration.idParticipacao}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        }
    } else {
        registrationsTableBody.innerHTML = '<tr><td colspan="5">Nenhuma inscrição encontrada.</td></tr>';
    }
}

// Salva uma nova inscrição ou atualiza uma existente.
export async function saveRegistration(e) {
    e.preventDefault();
    const id = e.target.dataset.id;
    const fk_idParticipante = parseInt(document.getElementById('registration-participant').value);
    const fk_idAtividade = parseInt(document.getElementById('registration-activity').value);
    const tipo = document.getElementById('registration-type').value;

    if (isNaN(fk_idParticipante) || isNaN(fk_idAtividade) || !tipo) {
        showCustomMessage('Erro', 'Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    const registrationData = {
        fk_idParticipante,
        fk_idAtividade,
        tipo,
    };

    let result;
    if (id) {
        result = await fetchData(`http://localhost:3000/participacao/${id}`, 'PATCH', registrationData);
        if (result) showCustomMessage('Sucesso', 'Inscrição atualizada com sucesso!');
    } else {
        result = await fetchData(`http://localhost:3000/participacao`, 'POST', registrationData);
        if (result) showCustomMessage('Sucesso', 'Inscrição criada com sucesso!');
    }

    if (result) {
        closeModal('registration');
        allRegistrationsData = [];
        loadRegistrations();
    }
}

// Exibe os detalhes de uma inscrição.
export async function viewRegistration(id) {
    const registration = await fetchData(`http://localhost:3000/participacao/${id}`);
    const participant = registration ? await fetchData(`http://localhost:3000/participante/${registration.fk_idParticipante}`) : null;
    const activity = registration ? await fetchData(`http://localhost:3000/atividade/${registration.fk_idAtividade}`) : null;
    const event = activity ? await fetchData(`http://localhost:3000/evento/${activity.fk_idEvento}`) : null;

    if (registration) {
        let details = `
Participante: ${participant ? participant.nome : 'N/A'}
Evento: ${event ? event.titulo : 'N/A'}
Atividade: ${activity ? activity.titulo : 'N/A'}
Tipo de Participação: ${registration.tipo}
        `;
        showCustomMessage('Detalhes da Inscrição', details);
    }
}

// Abre o modal de edição para uma inscrição existente.
export async function editRegistration(id) {
    const registration = await fetchData(`http://localhost:3000/participacao/${id}`);
    if (registration) {
        openModal('registration', registration);
    }
}

// Exclui uma inscrição.
export async function deleteRegistration(id) {
    const confirmed = await showCustomMessage('Confirmação', 'Tem certeza que deseja excluir esta inscrição?', true);
    if (confirmed) {
        const result = await fetchData(`http://localhost:3000/participacao/${id}`, 'DELETE');
        if (result) {
            showCustomMessage('Sucesso', 'Inscrição excluída com sucesso!');
            allRegistrationsData = [];
            loadRegistrations();
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registration-search')?.addEventListener('input', loadRegistrations);
    document.getElementById('registration-birth-date-filter')?.addEventListener('input', loadRegistrations);
    document.getElementById('form-registration')?.addEventListener('submit', saveRegistration);
    document.getElementById('registration-event')?.addEventListener('change', updateActivitiesDropdown);
});

// Exporta as funções para serem acessíveis globalmente
window.loadRegistrations = loadRegistrations;
window.populateRegistrationDropdowns = populateRegistrationDropdowns;
window.updateActivitiesDropdown = updateActivitiesDropdown;
window.saveRegistration = saveRegistration;
window.viewRegistration = viewRegistration;
window.editRegistration = editRegistration;
window.deleteRegistration = deleteRegistration;