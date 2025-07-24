// participants.js
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
                <td>${formatCPF(participant.cpf)}</td>
                <td>${formatPhone(participant.telefone)}</td>
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

    // Validate CPF length (only digits)
    const rawCpf = cpf.replace(/\D/g, '');
    if (rawCpf.length !== 11) {
        showCustomMessage('Erro de Validação', 'O CPF deve conter exatamente 11 dígitos.');
        return;
    }

    // Validate phone length (only digits) - Adjusted to strictly require 11 digits
    const rawTelefone = telefone.replace(/\D/g, '');
    if (rawTelefone.length !== 11) { // Changed from < 10 || > 11 to !== 11
        showCustomMessage('Erro de Validação', 'O telefone deve conter exatamente 11 dígitos (DDD + 9 dígitos).');
        return;
    }

    const participantData = {
        nome,
        cpf: rawCpf, // Send only digits to the backend
        telefone: rawTelefone, // Send only digits to the backend
        email,
        dataDeNascimento: new Date(dataDeNascimento).toISOString(),
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
        // Prepare data for modal, apply formatting for display
        const displayParticipant = { ...participant };
        displayParticipant.cpf = formatCPF(participant.cpf);
        displayParticipant.telefone = formatPhone(participant.telefone);

        openModal('participant', displayParticipant);
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

// Funções de formatação de input
function formatCPF(value) {
    // Remove tudo que não for dígito
    value = value.replace(/\D/g, '');
    // Limita a 11 dígitos para formatação
    value = value.substring(0, 11);
    // Aplica a máscara: 111.111.111-11
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return value;
}

function formatPhone(value) {
    // Remove tudo que não for dígito
    value = value.replace(/\D/g, '');
    // Limita a 11 dígitos para o número de telefone (DDD + 9 dígitos)
    value = value.substring(0, 11);

    // Aplica a máscara: (11) 91111-1111 (para 11 dígitos)
    if (value.length === 11) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    // Aplica a máscara: (11) 1111-1111 (para 10 dígitos, embora a validação agora exija 11 para salvar)
    else if (value.length === 10) {
        value = value.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    // Formatação parcial enquanto o usuário digita
    else if (value.length > 6) {
        value = value.replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3');
    }
    else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    } else {
        value = value.replace(/^(\d*)/, '($1');
    }
    return value;
}


// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('form-participant')?.addEventListener('submit', saveParticipant);

    const participantCpfInput = document.getElementById('participant-cpf');
    if (participantCpfInput) {
        participantCpfInput.addEventListener('input', (e) => {
            e.target.value = formatCPF(e.target.value);
        });
    }

    const participantPhoneInput = document.getElementById('participant-phone');
    if (participantPhoneInput) {
        participantPhoneInput.addEventListener('input', (e) => {
            e.target.value = formatPhone(e.target.value);
        });
    }
});

// Exporta as funções para serem acessíveis globalmente
window.loadParticipants = loadParticipants;
window.saveParticipant = saveParticipant;
window.viewParticipant = viewParticipant;
window.editParticipant = editParticipant;
window.deleteParticipant = deleteParticipant;