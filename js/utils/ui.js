// js/utils/ui.js
import { fetchData } from './api.js'; // Importe fetchData, se ainda não estiver importado

// Retorna o nome traduzido do tipo de modal (substantivo).
export function getTranslatedModalName(type) {
    switch (type) {
        case 'event':
            return 'Evento';
        case 'activity':
            return 'Atividade';
        case 'participant':
            return 'Participante';
        case 'registration':
            return 'Inscrição';
        default:
            return type.charAt(0).toUpperCase() + type.slice(1);
    }
}

// Abre um modal específico.
export async function openModal(type, data = null) {
    const modal = document.getElementById(`${type}-modal`);
    if (!modal) {
        console.error(`Modal com ID ${type}-modal não encontrado.`);
        return;
    }
    modal.style.display = 'flex';

    const modalTitle = document.getElementById(`${type}-modal-title`);
    const form = modal.querySelector('form');
    form.reset();
    delete form.dataset.id;

    const translatedNoun = getTranslatedModalName(type);
    let prefix = '';

    if (type === 'activity' || type === 'registration') {
        prefix = 'Nova';
    } else {
        prefix = 'Novo';
    }

    if (data) {
        modalTitle.textContent = `Editar ${translatedNoun}`;
        // Preenchimento de dados específicos para cada tipo de modal
        if (type === 'event') {
            document.getElementById('event-title').value = data.titulo;
            document.getElementById('event-edition').value = data.edicao;
            document.getElementById('event-type').value = data.tipo;
            document.getElementById('event-fee').value = data.taxa || '';
            document.getElementById('event-start').value = data.dataHoraInicio ? new Date(data.dataHoraInicio).toISOString().slice(0, 16) : '';
            document.getElementById('event-end').value = data.dataHoraFim ? new Date(data.dataHoraFim).toISOString().slice(0, 16) : '';
            document.getElementById('event-type').dispatchEvent(new Event('change'));
            form.dataset.id = data.idEvento;
        } else if (type === 'activity') {
            document.getElementById('activity-type').value = data.tipo;
            document.getElementById('activity-title').value = data.titulo;
            document.getElementById('activity-event').value = data.fk_idEvento;
            document.getElementById('activity-start').value = data.dataHoraInicio ? new Date(data.dataHoraInicio).toISOString().slice(0, 16) : '';
            document.getElementById('activity-end').value = data.dataHoraFim ? new Date(data.dataHoraFim).toISOString().slice(0, 16) : '';
            document.getElementById('activity-max').value = data.qntdMaximaOuvintes;
            form.dataset.id = data.idAtividade;
        } else if (type === 'participant') {
            document.getElementById('participant-name').value = data.nome;
            document.getElementById('participant-cpf').value = data.cpf;
            document.getElementById('participant-phone').value = data.telefone;
            document.getElementById('participant-email').value = data.email;
            document.getElementById('participant-birth').value = data.dataDeNascimento ? new Date(data.dataDeNascimento).toISOString().split('T')[0] : '';
            form.dataset.id = data.idParticipante;
        } else if (type === 'registration') {
            // A importação de fetchData aqui pode ser otimizada para ser feita uma vez no topo
            form.dataset.id = data.idParticipacao;
            document.getElementById('registration-participant').value = data.fk_idParticipante;
            document.getElementById('registration-type').value = data.tipo;

            fetchData(`http://localhost:3000/atividade/${data.fk_idAtividade}`).then(activity => {
                if (activity) {
                    document.getElementById('registration-event').value = activity.fk_idEvento;
                    document.getElementById('registration-event').dispatchEvent(new Event('change'));
                    setTimeout(() => {
                        document.getElementById('registration-activity').value = data.fk_idAtividade;
                    }, 100);
                }
            });
        }
    } else {
        modalTitle.textContent = `${prefix} ${translatedNoun}`;
        if (type === 'event') {
            document.getElementById('event-type').dispatchEvent(new Event('change'));
        }
    }
}

// Fecha um modal específico.
export function closeModal(type) {
    const modal = document.getElementById(`${type}-modal`);
    if (modal) {
        modal.style.display = 'none';
        const form = document.getElementById(`form-${type}`);
        if (form) {
            form.reset();
            delete form.dataset.id;
            const modalTitle = document.getElementById(`${type}-modal-title`);
            if (modalTitle) {
                const translatedNoun = getTranslatedModalName(type);
                let prefix = '';
                if (type === 'activity' || type === 'registration') {
                    prefix = 'Nova';
                } else {
                    prefix = 'Novo';
                }
                modalTitle.textContent = `${prefix} ${translatedNoun}`;
            }
        }
        if (type === 'registration') {
            const registrationActivity = document.getElementById('registration-activity');
            if (registrationActivity) {
                registrationActivity.innerHTML = '<option value="">Selecione um evento primeiro...</option>';
                registrationActivity.disabled = true;
            }
        }
    }
}

// Exibe uma mensagem customizada em um modal.
export function showCustomMessage(title, message, isConfirm = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-message-modal');
        document.getElementById('custom-message-title').textContent = title;
        document.getElementById('custom-message-text').innerHTML = message.replace(/\n/g, '<br>');

        const okBtn = document.getElementById('custom-message-ok-btn');
        const cancelBtn = document.getElementById('custom-message-cancel-btn');

        okBtn.onclick = () => {
            closeCustomMessageModal();
            resolve(true);
        };

        if (isConfirm) {
            cancelBtn.style.display = 'inline-block';
            cancelBtn.onclick = () => {
                closeCustomMessageModal();
                resolve(false);
            };
        } else {
            cancelBtn.style.display = 'none';
        }

        modal.style.display = 'flex';
    });
}

// Fecha o modal de mensagem customizado.
export function closeCustomMessageModal() {
    document.getElementById('custom-message-modal').style.display = 'none';
}

// Event Listener para mostrar/esconder o campo de taxa com base no tipo de evento
document.addEventListener('DOMContentLoaded', () => {
    const eventTypeSelect = document.getElementById('event-type');
    if (eventTypeSelect) {
        eventTypeSelect.addEventListener('change', function () {
            const feeGroup = document.getElementById('event-fee-group');
            if (feeGroup) {
                if (this.value === 'pago') {
                    feeGroup.style.display = 'block';
                    document.getElementById('event-fee').required = true;
                } else {
                    feeGroup.style.display = 'none';
                    document.getElementById('event-fee').required = false;
                }
            }
        });
    }

    // Event Listener para fechar modais ao clicar fora
    window.addEventListener('click', function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            document.querySelectorAll('.modal form').forEach(form => {
                const type = form.id.replace('form-', '');
                form.reset();
                delete form.dataset.id;
                const modalTitle = document.getElementById(`${type}-modal-title`);
                if (modalTitle) {
                    const translatedNoun = getTranslatedModalName(type);
                    let prefix = '';
                    if (type === 'activity' || type === 'registration') {
                        prefix = 'Nova';
                    } else {
                        prefix = 'Novo';
                    }
                    modalTitle.textContent = `${prefix} ${translatedNoun}`;
                }
            });

            if (event.target.id === 'registration-modal') {
                const registrationActivity = document.getElementById('registration-activity');
                if (registrationActivity) {
                    registrationActivity.innerHTML = '<option value="">Selecione um evento primeiro...</option>';
                    registrationActivity.disabled = true;
                }
            }
        }
    });
});

// EXPORTE AS FUNÇÕES PARA O ESCOPO GLOBAL PARA QUE POSSAM SER ACESSADAS VIA ONCLICK NO HTML
window.openModal = openModal;
window.closeModal = closeModal;
window.showCustomMessage = showCustomMessage;
window.closeCustomMessageModal = closeCustomMessageModal;