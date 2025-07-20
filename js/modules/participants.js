
import { fetchData } from '../utils/api.js';
import { showCustomMessage, closeModal, openModal } from '../utils/ui.js';

let allParticipantsData = [];

// Carrega e exibe os participantes na tabela. Aplica filtros de pesquisa e ano de nascimento.
export async function loadParticipants() {
    const participantsTableBody = document.getElementById('participants-table-body');
    if (!participantsTableBody) return;

    const searchTerm = document.getElementById('participant-search')?.value.toLowerCase() || '';
    const birthYearFilter = document.getElementById('participant-birth-year-filter')?.value || '';
    participantsTableBody.innerHTML = '';

    if (allParticipantsData.length === 0) {
        allParticipantsData = await fetchData(`http://localhost:3000/participante`);
    }

    const filteredParticipants = allParticipantsData.filter(participant => {
        const nameMatch = participant.nome.toLowerCase().includes(searchTerm);
        const cpfMatch = participant.cpf.toLowerCase().includes(searchTerm);
        const phoneMatch = participant.telefone.toLowerCase().includes(searchTerm);
        const emailMatch = participant.email.toLowerCase().includes(searchTerm);

        let yearMatch = true;
        if (birthYearFilter) {
            if (participant && participant.dataDeNascimento) {
                const participantBirthYear = new Date(participant.dataDeNascimento).getFullYear().toString();
                yearMatch = (participantBirthYear === birthYearFilter);
            } else {
                yearMatch = false;
            }
        }
        return (nameMatch || cpfMatch || phoneMatch || emailMatch) && yearMatch;
    });

    if (filteredParticipants && filteredParticipants.length > 0) {
        filteredParticipants.forEach(participant => {
            const row = participantsTableBody.insertRow();
            const birthDate = new Date(participant.dataDeNascimento);
            birthDate.setMinutes(birthDate.getMinutes() + birthDate.getTimezoneOffset());
            const formattedBirthDate = birthDate.toLocaleDateString('pt-BR');

            row.innerHTML = `
                <td>${participant.nome}</td>
                <td>${participant.cpf}</td>
                <td>${participant.telefone}</td>
                <td>${participant.email}</td>
                <td>${formattedBirthDate}</td>
                <td class="actions">
                    <button class="action-btn view-btn" onclick="window.viewParticipant('${participant.idParticipante}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" onclick="window.editParticipant('${participant.idParticipante}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="window.deleteParticipant('${participant.idParticipante}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });
    } else {
        participantsTableBody.innerHTML = '<tr><td colspan="6">Nenhum participante encontrado.</td></tr>';
    }
}

// Salva um novo participante ou atualiza um existente.
export async function saveParticipant(e) {
    e.preventDefault();
    const id = e.target.dataset.id;
    const nome = document.getElementById('participant-name').value;
    const cpf = document.getElementById('participant-cpf').value;
    const telefone = document.getElementById('participant-phone').value;
    const email = document.getElementById('participant-email').value;
    const dataDeNascimento = document.getElementById('participant-birth').value;

    const participantData = {
        nome,
        cpf,
        telefone,
        email,
        dataDeNascimento: new Date(dataDeNascimento).toISOString().split('T')[0],
    };

    let result;
    if (id) {
        result = await fetchData(`http://localhost:3000/participante/${id}`, 'PATCH', participantData);
        if (result) showCustomMessage('Sucesso', 'Participante atualizado com sucesso!');
    } else {
        result = await fetchData(`http://localhost:3000/participante`, 'POST', participantData);
        if (result) showCustomMessage('Sucesso', 'Participante criado com sucesso!');
    }

    if (result) {
        closeModal('participant');
        allParticipantsData = [];
        loadParticipants();
    }
}

// Exibe os detalhes de um participante.
export async function viewParticipant(id) {
    const participant = await fetchData(`http://localhost:3000/participante/${id}`);
    if (participant) {
        const birthDate = new Date(participant.dataDeNascimento);
        birthDate.setMinutes(birthDate.getMinutes() + birthDate.getTimezoneOffset());
        const formattedBirthDate = birthDate.toLocaleDateString('pt-BR');

        let details = `
Nome: ${participant.nome}
CPF: ${participant.cpf}
Telefone: ${participant.telefone}
Email: ${participant.email}
Nascimento: ${formattedBirthDate}
        `;
        showCustomMessage('Detalhes do Participante', details);
    }
}

// Abre o modal de edição para um participante existente.
export async function editParticipant(id) {
    const participant = await fetchData(`http://localhost:3000/participante/${id}`);
    if (participant) {
        openModal('participant', participant);
    }
}

// Exclui um participante.
export async function deleteParticipant(id) {
    const confirmed = await showCustomMessage('Confirmação', 'Tem certeza que deseja excluir este participante?', true);
    if (confirmed) {
        const result = await fetchData(`http://localhost:3000/participante/${id}`, 'DELETE');
        if (result) {
            showCustomMessage('Sucesso', 'Participante excluído com sucesso!');
            allParticipantsData = [];
            loadParticipants();
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('form-participant')?.addEventListener('submit', saveParticipant);
});

// Exporta as funções para serem acessíveis globalmente
window.loadParticipants = loadParticipants;
window.saveParticipant = saveParticipant;
window.viewParticipant = viewParticipant;
window.editParticipant = editParticipant;
window.deleteParticipant = deleteParticipant;