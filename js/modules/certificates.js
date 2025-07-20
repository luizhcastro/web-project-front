// js/modules/certificates.js
import { fetchData } from '../utils/api.js';
import { showCustomMessage } from '../utils/ui.js';

// Carrega os dados necessários para a aba de certificados (eventos e atividades).
export async function loadCertificatesTab() {
    const certificateEventSelect = document.getElementById('certificate-event');
    const certificateActivitySelect = document.getElementById('certificate-activity');
    const certificateParticipantSelect = document.getElementById('certificate-participant');
    const participationResultGroup = document.getElementById('participation-result-group'); // Adicionado
    const participationTypeDisplay = document.getElementById('participation-type-display'); // Adicionado

    if (!certificateEventSelect || !certificateActivitySelect || !certificateParticipantSelect || !participationResultGroup || !participationTypeDisplay) {
        console.error('Um ou mais elementos de certificado não encontrados.');
        return;
    }

    certificateEventSelect.innerHTML = '<option value="">Selecione um evento...</option>';
    certificateActivitySelect.innerHTML = '<option value="">Selecione um evento primeiro...</option>';
    certificateActivitySelect.disabled = true;
    certificateParticipantSelect.innerHTML = '<option value="">Selecione uma atividade primeiro...</option>';
    certificateParticipantSelect.disabled = true;

    // Limpar o resultado da consulta anterior ao carregar a aba
    participationTypeDisplay.textContent = '';
    participationResultGroup.style.display = 'none';

    const events = await fetchData(`http://localhost:3000/evento`);
    if (events && events.length > 0) {
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.idEvento;
            option.textContent = event.titulo;
            certificateEventSelect.appendChild(option);
        });
    } else {
        certificateEventSelect.innerHTML += '<option value="" disabled>Nenhum evento disponível</option>';
    }
}

// Verifica a participação de um participante em uma atividade e evento selecionados.
export async function checkParticipation() {
    const eventId = document.getElementById('certificate-event').value;
    const activityId = document.getElementById('certificate-activity').value;
    const participantId = document.getElementById('certificate-participant').value;
    const participationResultGroup = document.getElementById('participation-result-group');
    const participationTypeDisplay = document.getElementById('participation-type-display');

    // Limpar o resultado anterior antes de uma nova consulta
    participationTypeDisplay.textContent = '';
    participationResultGroup.style.display = 'none';


    if (!eventId || !activityId || !participantId) {
        showCustomMessage('Erro', 'Por favor, selecione Evento, Atividade e Participante.');
        return;
    }

    const participations = await fetchData(`http://localhost:3000/participacao`);
    const foundParticipation = participations?.find(p =>
        p.fk_idParticipante === parseInt(participantId) &&
        p.fk_idAtividade === parseInt(activityId)
    );

    if (foundParticipation) {
        // Exibir apenas o tipo de participação em maiúsculas
        participationTypeDisplay.textContent = foundParticipation.tipo.toUpperCase();
        participationResultGroup.style.display = 'block';
        showCustomMessage('Sucesso', `Participação encontrada: ${foundParticipation.tipo.toUpperCase()}`);
    } else {
        participationTypeDisplay.textContent = 'Nenhuma participação encontrada para esta combinação.';
        participationResultGroup.style.display = 'block';
        showCustomMessage('Aviso', 'Nenhuma participação encontrada para esta combinação de participante e atividade.');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const certificateEventSelect = document.getElementById('certificate-event');
    const certificateActivitySelect = document.getElementById('certificate-activity');
    const certificateParticipantSelect = document.getElementById('certificate-participant');
    const checkParticipationBtn = document.getElementById('check-participation-btn');

    if (certificateEventSelect) {
        certificateEventSelect.addEventListener('change', async () => {
            const eventId = certificateEventSelect.value;
            certificateActivitySelect.innerHTML = '<option value="">Selecione uma atividade...</option>';
            certificateActivitySelect.disabled = true;
            certificateParticipantSelect.innerHTML = '<option value="">Selecione uma atividade primeiro...</option>';
            certificateParticipantSelect.disabled = true;

            // Limpar o resultado anterior ao mudar o evento
            document.getElementById('participation-type-display').textContent = '';
            document.getElementById('participation-result-group').style.display = 'none';

            if (eventId) {
                const activities = await fetchData(`http://localhost:3000/atividade`);
                const filteredActivities = activities ? activities.filter(activity => activity.fk_idEvento === parseInt(eventId)) : [];
                if (filteredActivities.length > 0) {
                    filteredActivities.forEach(activity => {
                        const option = document.createElement('option');
                        option.value = activity.idAtividade;
                        option.textContent = activity.titulo;
                        certificateActivitySelect.appendChild(option);
                    });
                    certificateActivitySelect.disabled = false;
                } else {
                    certificateActivitySelect.innerHTML = '<option value="" disabled>Nenhuma atividade para este evento</option>';
                }
            }
        });
    }

    if (certificateActivitySelect) {
        certificateActivitySelect.addEventListener('change', async () => {
            const activityId = certificateActivitySelect.value;
            certificateParticipantSelect.innerHTML = '<option value="">Selecione um participante...</option>';
            certificateParticipantSelect.disabled = true;

            // Limpar o resultado anterior ao mudar a atividade
            document.getElementById('participation-type-display').textContent = '';
            document.getElementById('participation-result-group').style.display = 'none';

            if (activityId) {
                const participations = await fetchData(`http://localhost:3000/participacao`);
                const participants = await fetchData(`http://localhost:3000/participante`);

                const participantsInActivity = participations
                    ? participations.filter(p => p.fk_idAtividade === parseInt(activityId))
                        .map(p => participants.find(part => part.idParticipante === p.fk_idParticipante))
                        .filter(Boolean)
                    : [];

                if (participantsInActivity.length > 0) {
                    participantsInActivity.forEach(participant => {
                        const option = document.createElement('option');
                        option.value = participant.idParticipante;
                        option.textContent = participant.nome;
                        certificateParticipantSelect.appendChild(option);
                    });
                    certificateParticipantSelect.disabled = false;
                } else {
                    certificateParticipantSelect.innerHTML = '<option value="" disabled>Nenhum participante nesta atividade</option>';
                }
            }
        });
    }

    if (checkParticipationBtn) {
        checkParticipationBtn.addEventListener('click', checkParticipation);
    }

    // Limpar o resultado anterior ao mudar o participante
    if (certificateParticipantSelect) {
        certificateParticipantSelect.addEventListener('change', () => {
            document.getElementById('participation-type-display').textContent = '';
            document.getElementById('participation-result-group').style.display = 'none';
        });
    }
});

// Exporta as funções para serem acessíveis globalmente
window.loadCertificatesTab = loadCertificatesTab;
window.checkParticipation = checkParticipation;