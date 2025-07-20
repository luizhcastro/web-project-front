// Função para mostrar e esconder abas
function showTab(tabId) {
    // Esconde todos os conteúdos das abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Mostra o conteúdo da aba selecionada
    document.getElementById(tabId).classList.add('active');

    // Atualiza o item de menu ativo
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    // Encontra o item de menu que corresponde a esta aba e o torna ativo
    const menuItems = document.querySelectorAll('.menu-item');
    for (let i = 0; i < menuItems.length; i++) {
        if (menuItems[i].getAttribute('onclick').includes(tabId)) {
            menuItems[i].classList.add('active');
            break;
        }
    }

    // Limpa os campos de pesquisa ao trocar de aba
    document.getElementById('event-search').value = '';
    document.getElementById('event-year-filter').value = '';
    document.getElementById('activity-search').value = '';
    document.getElementById('activity-year-filter').value = '';
    document.getElementById('participant-search').value = '';
    document.getElementById('participant-birth-year-filter').value = '';
    document.getElementById('registration-search').value = '';
    document.getElementById('registration-birth-date-filter').value = '';

    // Remove o highlight dos wrappers de pesquisa
    document.querySelectorAll('.search-input-wrapper').forEach(wrapper => {
        wrapper.classList.remove('is-active');
    });

    // Chama as funções de carregamento para a aba selecionada
    if (tabId === 'dashboard') {
        loadDashboardData();
        loadUpcomingEvents();
    } else if (tabId === 'events') {
        loadEvents();
    } else if (tabId === 'activities') {
        loadActivities();
    } else if (tabId === 'participants') {
        loadParticipants();
    } else if (tabId === 'registrations') {
        loadRegistrations();
        populateRegistrationDropdowns(); // Popula os dropdowns ao abrir o modal de inscrição
    } else if (tabId === 'certificates') {
        loadCertificatesTab();
    } else if (tabId === 'speakers') {
        loadSpeakersTab();
    }
}

// Abre modal
function openModal(type, data = null) {
    const modal = document.getElementById(`${type}-modal`);
    modal.style.display = 'flex';

    // Limpa o formulário para uma nova entrada ou preenche para edição
    const form = modal.querySelector('form');
    form.reset();
    delete form.dataset.id; // Remove o ID para uma nova entrada

    if (type === 'event') {
        document.getElementById('event-type').dispatchEvent(new Event('change')); // Esconde o campo de taxa para novo evento
    }

    // Preenche o formulário para edição se os dados forem fornecidos
    if (data) {
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
            // Para edição de inscrição, precisamos pré-selecionar evento e atividade
            form.dataset.id = data.idParticipacao;
            document.getElementById('registration-participant').value = data.fk_idParticipante;
            document.getElementById('registration-type').value = data.tipo;

            // Encontra a atividade para obter o fk_idEvento
            fetchData(`${BASE_URL}/atividade/${data.fk_idAtividade}`).then(activity => {
                if (activity) {
                    document.getElementById('registration-event').value = activity.fk_idEvento;
                    // Dispara o evento de mudança para popular as atividades corretas
                    document.getElementById('registration-event').dispatchEvent(new Event('change'));
                    // Aguarda um pouco para garantir que as atividades foram populadas antes de selecionar
                    setTimeout(() => {
                        document.getElementById('registration-activity').value = data.fk_idAtividade;
                    }, 100);
                }
            });
        }
    }
}

// Fecha modal
function closeModal(type) {
    document.getElementById(`${type}-modal`).style.display = 'none';
    document.getElementById(`form-${type}`).reset(); // Reseta o formulário ao fechar
    delete document.getElementById(`form-${type}`).dataset.id; // Limpa o ID para edição
    // Para o modal de inscrição, reseta o estado do dropdown de atividades
    if (type === 'registration') {
        document.getElementById('registration-activity').innerHTML = '<option value="">Selecione um evento primeiro...</option>';
        document.getElementById('registration-activity').disabled = true;
    }
}

// Mostra/esconde o campo de taxa com base no tipo de evento
document.getElementById('event-type').addEventListener('change', function () {
    const feeGroup = document.getElementById('event-fee-group');
    if (this.value === 'pago') {
        feeGroup.style.display = 'block';
        document.getElementById('event-fee').required = true;
    } else {
        feeGroup.style.display = 'none';
        document.getElementById('event-fee').required = false;
    }
});

// Fecha modal ao clicar fora
window.addEventListener('click', function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        // Reseta os formulários ao clicar fora
        document.querySelectorAll('.modal form').forEach(form => {
            form.reset();
            delete form.dataset.id;
        });
        // Para o modal de inscrição, reseta o estado do dropdown de atividades
        if (event.target.id === 'registration-modal') {
            document.getElementById('registration-activity').innerHTML = '<option value="">Selecione um evento primeiro...</option>';
            document.getElementById('registration-activity').disabled = true;
        }
    }
});

// --- Funções para o modal de mensagem customizado ---
function showCustomMessage(title, message, isConfirm = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-message-modal');
        document.getElementById('custom-message-title').textContent = title;
        // Usar innerHTML e substituir \n por <br> para quebras de linha visíveis
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

function closeCustomMessageModal() {
    document.getElementById('custom-message-modal').style.display = 'none';
}


const BASE_URL = 'http://localhost:3000';

// Função auxiliar para requisições à API
async function fetchData(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Algo deu errado');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro na API:', error);
        showCustomMessage('Erro', 'Erro: ' + error.message);
        return null;
    }
}

// --- Funções do Dashboard ---
async function loadDashboardData() {
    const events = await fetchData(`${BASE_URL}/evento`);
    const activities = await fetchData(`${BASE_URL}/atividade`);
    const participants = await fetchData(`${BASE_URL}/participante`);

    document.getElementById('dashboard-active-events').textContent = events ? events.length : 0;
    document.getElementById('dashboard-activities').textContent = activities ? activities.length : 0;
    document.getElementById('dashboard-participants').textContent = participants ? participants.length : 0;
}

async function loadUpcomingEvents() {
    const eventsTableBody = document.getElementById('upcoming-events-table-body');
    eventsTableBody.innerHTML = ''; // Limpa as linhas existentes

    const events = await fetchData(`${BASE_URL}/evento`);

    if (events && events.length > 0) {
        // Filtra por eventos futuros (exemplo: eventos que começam no futuro)
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
                    <button class="action-btn view-btn" onclick="viewEvent('${event.idEvento}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" onclick="editEvent('${event.idEvento}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteEvent('${event.idEvento}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });
    } else {
        eventsTableBody.innerHTML = '<tr><td colspan="6">Nenhum evento futuro encontrado.</td></tr>';
    }
}

// --- Funções de Eventos ---
let allEventsData = []; // Cache para todos os eventos
async function loadEvents() {
    const eventsTableBody = document.getElementById('events-table-body');
    const searchTerm = document.getElementById('event-search').value.toLowerCase();
    const yearFilter = document.getElementById('event-year-filter').value;
    eventsTableBody.innerHTML = ''; // Limpa as linhas existentes

    if (allEventsData.length === 0) { // Carrega os dados apenas uma vez
        allEventsData = await fetchData(`${BASE_URL}/evento`);
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
                    <button class="action-btn view-btn" onclick="viewEvent('${event.idEvento}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" onclick="editEvent('${event.idEvento}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteEvent('${event.idEvento}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });
    } else {
        eventsTableBody.innerHTML = '<tr><td colspan="7">Nenhum evento encontrado.</td></tr>';
    }
}
document.getElementById('event-search').addEventListener('input', loadEvents);
document.getElementById('event-year-filter').addEventListener('input', loadEvents);


async function saveEvent(e) {
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
        result = await fetchData(`${BASE_URL}/evento/${id}`, 'PATCH', eventData);
        if (result) showCustomMessage('Sucesso', 'Evento atualizado com sucesso!');
    } else {
        result = await fetchData(`${BASE_URL}/evento`, 'POST', eventData);
        if (result) showCustomMessage('Sucesso', 'Evento criado com sucesso!');
    }

    if (result) {
        closeModal('event');
        allEventsData = []; // Limpa o cache para recarregar
        loadEvents();
        loadUpcomingEvents(); // Atualiza o dashboard após alterações no evento
        loadDashboardData();
    }
}

async function viewEvent(id) {
    const event = await fetchData(`${BASE_URL}/evento/${id}`);
    const activities = await fetchData(`${BASE_URL}/atividade`);
    const participations = await fetchData(`${BASE_URL}/participacao`);

    if (event) {
        let organizadorCount = 0;
        let palestranteCount = 0;
        let mediadorCount = 0;
        let monitorCount = 0;
        let ouvinteCount = 0;
        let totalParticipants = 0;

        // Filtra atividades pertencentes ao evento atual
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

        // Usando quebras de linha para formatar a saída
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

async function editEvent(id) {
    const event = await fetchData(`${BASE_URL}/evento/${id}`);
    if (event) {
        openModal('event', event);
    }
}

async function deleteEvent(id) {
    const confirmed = await showCustomMessage('Confirmação', 'Tem certeza que deseja excluir este evento?', true);
    if (confirmed) {
        const result = await fetchData(`${BASE_URL}/evento/${id}`, 'DELETE');
        if (result) {
            showCustomMessage('Sucesso', 'Evento excluído com sucesso!');
            allEventsData = []; // Limpa o cache para recarregar
            loadEvents();
            loadUpcomingEvents(); // Atualiza o dashboard após alterações no evento
            loadDashboardData();
        }
    }
}

document.getElementById('form-event').addEventListener('submit', saveEvent);

// --- Funções de Atividades ---
let allActivitiesData = []; // Cache para todas as atividades
async function loadActivities() {
    const activitiesTableBody = document.getElementById('activities-table-body');
    const searchTerm = document.getElementById('activity-search').value.toLowerCase();
    const yearFilter = document.getElementById('activity-year-filter').value;
    activitiesTableBody.innerHTML = ''; // Limpa as linhas existentes

    if (allActivitiesData.length === 0) { // Carrega os dados apenas uma vez
        allActivitiesData = await fetchData(`${BASE_URL}/atividade`);
    }
    const events = await fetchData(`${BASE_URL}/evento`); // Para obter os títulos dos eventos

    const filteredActivities = allActivitiesData.filter(activity => {
        const eventTitle = events ? (events.find(e => e.idEvento === activity.fk_idEvento)?.titulo || '') : '';
        const titleMatch = activity.titulo.toLowerCase().includes(searchTerm);
        const typeMatch = activity.tipo.toLowerCase().includes(searchTerm);
        const eventMatch = eventTitle.toLowerCase().includes(searchTerm);

        let yearMatch = true;
        if (yearFilter) {
            const activityYear = new Date(activity.dataHoraInicio).getFullYear().toString();
            yearMatch = (activityYear === yearFilter);
        }
        return (titleMatch || typeMatch || eventMatch) && yearMatch;
    });

    if (filteredActivities && filteredActivities.length > 0) {
        filteredActivities.forEach(activity => {
            const eventTitle = events ? (events.find(e => e.idEvento === activity.fk_idEvento)?.titulo || 'N/A') : 'N/A';
            const row = activitiesTableBody.insertRow();
            row.innerHTML = `
                <td>${activity.tipo}</td>
                <td>${activity.titulo}</td>
                <td>${eventTitle}</td>
                <td>${new Date(activity.dataHoraInicio).toLocaleString('pt-BR')}</td>
                <td>${new Date(activity.dataHoraFim).toLocaleString('pt-BR')}</td>
                <td>${activity.qntdMaximaOuvintes}</td>
                <td class="actions">
                    <button class="action-btn view-btn" onclick="viewActivity('${activity.idAtividade}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" onclick="editActivity('${activity.idAtividade}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteActivity('${activity.idAtividade}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });
    } else {
        activitiesTableBody.innerHTML = '<tr><td colspan="7">Nenhuma atividade encontrada.</td></tr>';
    }

    // Preenche o dropdown de eventos no modal de atividade
    const activityEventSelect = document.getElementById('activity-event');

    if (activityEventSelect) {
        activityEventSelect.innerHTML = '<option value="">Selecione...</option>';
        if (events && events.length > 0) {
            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.idEvento;
                option.textContent = event.titulo;
                activityEventSelect.appendChild(option);
            });
        } else {
            activityEventSelect.innerHTML += '<option value="" disabled>Nenhum evento disponível</option>';
        }
    } else {
        console.error('Elemento activity-event não encontrado no DOM.');
    }
}
document.getElementById('activity-search').addEventListener('input', loadActivities);
document.getElementById('activity-year-filter').addEventListener('input', loadActivities);


async function saveActivity(e) {
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

    const activityData = {
        tipo,
        titulo,
        fk_idEvento,
        dataHoraInicio: new Date(dataHoraInicio).toISOString(),
        dataHoraFim: new Date(dataHoraFim).toISOString(),
    };

    let result;
    if (id) {
        result = await fetchData(`${BASE_URL}/atividade/${id}`, 'PATCH', activityData);
        if (result) showCustomMessage('Sucesso', 'Atividade atualizada com sucesso!');
    } else {
        result = await fetchData(`${BASE_URL}/atividade`, 'POST', activityData);
        if (result) showCustomMessage('Sucesso', 'Atividade criada com sucesso!');
    }

    if (result) {
        closeModal('activity');
        allActivitiesData = []; // Limpa o cache para recarregar
        loadActivities();
        loadDashboardData();
    }
}

async function viewActivity(id) {
    const activity = await fetchData(`${BASE_URL}/atividade/${id}`);
    const event = activity ? await fetchData(`${BASE_URL}/evento/${activity.fk_idEvento}`) : null;

    if (activity) {
        let details = `
Tipo: ${activity.tipo}
Título: ${activity.titulo}
Evento: ${event ? event.titulo : 'N/A'}
Data Início: ${new Date(activity.dataHoraInicio).toLocaleString('pt-BR')}
Data Fim: ${new Date(activity.dataHoraFim).toLocaleString('pt-BR')}
Vagas Máximas: ${activity.qntdMaximaOuvintes}
        `;
        showCustomMessage('Detalhes da Atividade', details);
    }
}

async function editActivity(id) {
    const activity = await fetchData(`${BASE_URL}/atividade/${id}`);
    if (activity) {
        openModal('activity', activity);
    }
}

async function deleteActivity(id) {
    const confirmed = await showCustomMessage('Confirmação', 'Tem certeza que deseja excluir esta atividade?', true);
    if (confirmed) {
        const result = await fetchData(`${BASE_URL}/atividade/${id}`, 'DELETE');
        if (result) {
            showCustomMessage('Sucesso', 'Atividade excluída com sucesso!');
            allActivitiesData = []; // Limpa o cache para recarregar
            loadActivities();
            loadDashboardData();
        }
    }
}

document.getElementById('form-activity').addEventListener('submit', saveActivity);

// --- Funções de Participantes ---
let allParticipantsData = []; // Cache para todos os participantes
async function loadParticipants() {
    const participantsTableBody = document.getElementById('participants-table-body');
    const searchTerm = document.getElementById('participant-search').value.toLowerCase();
    const birthYearFilter = document.getElementById('participant-birth-year-filter').value;
    participantsTableBody.innerHTML = ''; // Limpa as linhas existentes

    if (allParticipantsData.length === 0) { // Carrega os dados apenas uma vez
        allParticipantsData = await fetchData(`${BASE_URL}/participante`);
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
                yearMatch = false; // Se não tem data de nascimento, não corresponde ao filtro de ano
            }
        }
        return (nameMatch || cpfMatch || phoneMatch || emailMatch) && yearMatch;
    });

    if (filteredParticipants && filteredParticipants.length > 0) {
        filteredParticipants.forEach(participant => {
            const row = participantsTableBody.insertRow();
            row.innerHTML = `
                <td>${participant.nome}</td>
                <td>${participant.cpf}</td>
                <td>${participant.telefone}</td>
                <td>${participant.email}</td>
                <td>${new Date(participant.dataDeNascimento).toLocaleDateString('pt-BR')}</td>
                <td class="actions">
                    <button class="action-btn view-btn" onclick="viewParticipant('${participant.idParticipante}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" onclick="editParticipant('${participant.idParticipante}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteParticipant('${participant.idParticipante}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });
    } else {
        participantsTableBody.innerHTML = '<tr><td colspan="6">Nenhum participante encontrado.</td></tr>';
    }
}
document.getElementById('participant-search').addEventListener('input', loadParticipants);
document.getElementById('participant-birth-year-filter').addEventListener('input', loadParticipants);


async function saveParticipant(e) {
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
        dataDeNascimento: new Date(dataDeNascimento).toISOString()
    };

    let result;
    if (id) {
        result = await fetchData(`${BASE_URL}/participante/${id}`, 'PATCH', participantData);
        if (result) showCustomMessage('Sucesso', 'Participante atualizado com sucesso!');
    } else {
        result = await fetchData(`${BASE_URL}/participante`, 'POST', participantData);
        if (result) showCustomMessage('Sucesso', 'Participante criado com sucesso!');
    }

    if (result) {
        closeModal('participant');
        allParticipantsData = []; // Limpa o cache para recarregar
        loadParticipants();
        loadDashboardData();
    }
}

async function viewParticipant(id) {
    const participant = await fetchData(`${BASE_URL}/participante/${id}`);
    if (participant) {
        let details = `
Nome: ${participant.nome}
CPF: ${participant.cpf}
Telefone: ${participant.telefone}
Email: ${participant.email}
Data de Nascimento: ${new Date(participant.dataDeNascimento).toLocaleDateString('pt-BR')}
        `;
        showCustomMessage('Detalhes do Participante', details);
    }
}

async function editParticipant(id) {
    const participant = await fetchData(`${BASE_URL}/participante/${id}`);
    if (participant) {
        openModal('participant', participant);
    }
}

async function deleteParticipant(id) {
    const confirmed = await showCustomMessage('Confirmação', 'Tem certeza que deseja excluir este participante?', true);
    if (confirmed) {
        const result = await fetchData(`${BASE_URL}/participante/${id}`, 'DELETE');
        if (result) {
            showCustomMessage('Sucesso', 'Participante excluído com sucesso!');
            allParticipantsData = []; // Limpa o cache para recarregar
            loadParticipants();
            loadDashboardData();
        }
    }
}

document.getElementById('form-participant').addEventListener('submit', saveParticipant);

// --- Funções de Inscrições ---
let allRegistrationsData = []; // Cache para todas as inscrições
let allRegistrationsParticipants = []; // Cache para participantes das inscrições
let allRegistrationsActivities = []; // Cache para atividades das inscrições
let allRegistrationsEvents = []; // Cache para eventos das inscrições

async function loadRegistrations() {
    const registrationsTableBody = document.getElementById('registrations-table-body');
    const searchTerm = document.getElementById('registration-search').value.toLowerCase();
    const birthYearFilter = document.getElementById('registration-birth-date-filter').value; // Apenas o ano
    registrationsTableBody.innerHTML = ''; // Limpa as linhas existentes

    if (allRegistrationsData.length === 0) { // Carrega os dados apenas uma vez
        allRegistrationsData = await fetchData(`${BASE_URL}/participacao`);
        allRegistrationsParticipants = await fetchData(`${BASE_URL}/participante`);
        allRegistrationsActivities = await fetchData(`${BASE_URL}/atividade`);
        allRegistrationsEvents = await fetchData(`${BASE_URL}/evento`);
    }

    const filteredRegistrations = allRegistrationsData.filter(registration => {
        const participant = allRegistrationsParticipants.find(p => p.idParticipante === registration.fk_idParticipante);
        const activity = allRegistrationsActivities.find(a => a.idAtividade === registration.fk_idAtividade);
        const event = activity ? allRegistrationsEvents.find(e => e.idEvento === activity.fk_idEvento) : null;

        const participantName = participant ? participant.nome.toLowerCase() : '';
        const activityTitle = activity ? activity.titulo.toLowerCase() : '';
        const eventTitle = event ? event.titulo.toLowerCase() : '';
        const registrationType = registration.tipo.toLowerCase();

        const textMatch = participantName.includes(searchTerm) ||
                          activityTitle.includes(searchTerm) ||
                          eventTitle.includes(searchTerm) ||
                          registrationType.includes(searchTerm);

        let yearMatch = true;
        if (birthYearFilter) {
            if (participant && participant.dataDeNascimento) {
                const participantBirthYear = new Date(participant.dataDeNascimento).getFullYear().toString();
                yearMatch = (participantBirthYear === birthYearFilter);
            } else {
                yearMatch = false; // Se não tem data de nascimento, não corresponde ao filtro de ano
            }
        }
        return textMatch && yearMatch;
    });

    if (filteredRegistrations && filteredRegistrations.length > 0) {
        filteredRegistrations.forEach(registration => {
            const participantName = allRegistrationsParticipants.find(p => p.idParticipante === registration.fk_idParticipante)?.nome || 'N/A';
            const activity = allRegistrationsActivities.find(a => a.idAtividade === registration.fk_idAtividade);
            const activityTitle = activity ? activity.titulo : 'N/A';
            const eventTitle = (activity && allRegistrationsEvents) ? (allRegistrationsEvents.find(e => e.idEvento === activity.fk_idEvento)?.titulo || 'N/A') : 'N/A';

            const row = registrationsTableBody.insertRow();
            row.innerHTML = `
                <td>${participantName}</td>
                <td>${eventTitle}</td>
                <td>${activityTitle}</td>
                <td>${registration.tipo}</td>
                <td class="actions">
                    <button class="action-btn view-btn" onclick="viewRegistration('${registration.idParticipacao}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" onclick="editRegistration('${registration.idParticipacao}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteRegistration('${registration.idParticipacao}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });
    } else {
        registrationsTableBody.innerHTML = '<tr><td colspan="5">Nenhuma inscrição encontrada.</td></tr>';
    }
}
document.getElementById('registration-search').addEventListener('input', loadRegistrations);
document.getElementById('registration-birth-date-filter').addEventListener('input', loadRegistrations);


// Função para popular os dropdowns do modal de inscrição
async function populateRegistrationDropdowns() {
    const registrationParticipantSelect = document.getElementById('registration-participant');
    const registrationEventSelect = document.getElementById('registration-event');
    const registrationActivitySelect = document.getElementById('registration-activity');

    // Limpa e popula Participantes
    registrationParticipantSelect.innerHTML = '<option value="">Selecione...</option>';
    const participants = await fetchData(`${BASE_URL}/participante`);
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

    // Limpa e popula Eventos
    registrationEventSelect.innerHTML = '<option value="">Selecione...</option>';
    const events = await fetchData(`${BASE_URL}/evento`);
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

    // Inicializa o dropdown de Atividades como desabilitado
    registrationActivitySelect.innerHTML = '<option value="">Selecione um evento primeiro...</option>';
    registrationActivitySelect.disabled = true;
}

// Event listener para o dropdown de Eventos no modal de Inscrição
document.getElementById('registration-event').addEventListener('change', async function () {
    const selectedEventId = this.value;
    const registrationActivitySelect = document.getElementById('registration-activity');

    registrationActivitySelect.innerHTML = '<option value="">Selecione...</option>';
    registrationActivitySelect.disabled = true; // Desabilita enquanto carrega

    if (selectedEventId) {
        // Busca atividades relacionadas ao evento selecionado
        const activities = await fetchData(`${BASE_URL}/atividade/evento/${selectedEventId}`);
        if (activities && activities.length > 0) {
            activities.forEach(activity => {
                const option = document.createElement('option');
                option.value = activity.idAtividade;
                option.textContent = activity.titulo;
                registrationActivitySelect.appendChild(option);
            });
            registrationActivitySelect.disabled = false; // Habilita se houver atividades
        } else {
            registrationActivitySelect.innerHTML += '<option value="" disabled>Nenhuma atividade para este evento</option>';
        }
    } else {
        registrationActivitySelect.innerHTML = '<option value="">Selecione um evento primeiro...</option>';
    }
});


async function saveRegistration(e) {
    e.preventDefault();
    const id = e.target.dataset.id;
    const fk_idParticipante = parseInt(document.getElementById('registration-participant').value);
    const fk_idAtividade = parseInt(document.getElementById('registration-activity').value);
    const tipo = document.getElementById('registration-type').value;

    if (isNaN(fk_idParticipante) || isNaN(fk_idAtividade)) {
        showCustomMessage('Erro', 'Por favor, selecione um participante e uma atividade.');
        return;
    }

    const registrationData = {
        fk_idParticipante,
        fk_idAtividade,
        tipo,
        // A API define automaticamente dataHoraRegistro
    };

    let result;
    if (id) {
        result = await fetchData(`${BASE_URL}/participacao/${id}`, 'PATCH', { tipo }); // Apenas 'tipo' pode ser atualizado para participação
        if (result) showCustomMessage('Sucesso', 'Inscrição atualizada com sucesso!');
    } else {
        result = await fetchData(`${BASE_URL}/participacao`, 'POST', registrationData);
        if (result) showCustomMessage('Sucesso', 'Inscrição criada com sucesso!');
    }

    if (result) {
        closeModal('registration');
        allRegistrationsData = []; // Limpa o cache para recarregar
        loadRegistrations();
    }
}

async function viewRegistration(id) {
    const registration = await fetchData(`${BASE_URL}/participacao/${id}`);
    if (registration) {
        const participant = await fetchData(`${BASE_URL}/participante/${registration.fk_idParticipante}`);
        const activity = await fetchData(`${BASE_URL}/atividade/${registration.fk_idAtividade}`);
        const event = activity ? await fetchData(`${BASE_URL}/evento/${activity.fk_idEvento}`) : null;

        let details = `
Participante: ${participant ? participant.nome : 'N/A'}
Evento: ${event ? event.titulo : 'N/A'}
Atividade: ${activity ? activity.titulo : 'N/A'}
Tipo de Participação: ${registration.tipo}
Data de Registro: ${registration.dataHoraRegistro ? new Date(registration.dataHoraRegistro).toLocaleDateString('pt-BR') : 'N/A'}
        `;
        showCustomMessage('Detalhes da Inscrição', details);
    }
}

async function editRegistration(id) {
    const registration = await fetchData(`${BASE_URL}/participacao/${id}`);
    if (registration) {
        openModal('registration', registration);
    }
}

async function deleteRegistration(id) {
    const confirmed = await showCustomMessage('Confirmação', 'Tem certeza que deseja excluir esta inscrição?', true);
    if (confirmed) {
        const result = await fetchData(`${BASE_URL}/participacao/${id}`, 'DELETE');
        if (result) {
            showCustomMessage('Sucesso', 'Inscrição excluída com sucesso!');
            allRegistrationsData = []; // Limpa o cache para recarregar
            loadRegistrations();
        }
    }
}

document.getElementById('form-registration').addEventListener('submit', saveRegistration);

// --- Funções para a aba de Certificados ---
async function loadCertificatesTab() {
    const certificateEventSelect = document.getElementById('certificate-event');
    const certificateActivitySelect = document.getElementById('certificate-activity');
    const certificateParticipantSelect = document.getElementById('certificate-participant');
    const participationTypeDisplay = document.getElementById('participation-type-display');
    const participationResultGroup = document.getElementById('participation-result-group');

    // Limpar e popular dropdown de Eventos
    certificateEventSelect.innerHTML = '<option value="">Selecione um evento...</option>';
    const events = await fetchData(`${BASE_URL}/evento`);
    if (events && events.length > 0) {
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.idEvento;
            option.textContent = event.titulo;
            certificateEventSelect.appendChild(option);
        });
    }

    // Limpar e popular dropdown de Participantes
    certificateParticipantSelect.innerHTML = '<option value="">Selecione uma atividade primeiro...</option>';
    certificateParticipantSelect.disabled = true; // Inicialmente desabilitado

    // Limpar e desabilitar dropdown de Atividades
    certificateActivitySelect.innerHTML = '<option value="">Selecione um evento primeiro...</option>';
    certificateActivitySelect.disabled = true;

    // Esconder resultado da participação
    participationResultGroup.style.display = 'none';
    participationTypeDisplay.textContent = '';
}

// Event listener para o dropdown de Eventos na aba de Certificados
document.getElementById('certificate-event').addEventListener('change', async function () {
    const selectedEventId = this.value;
    const certificateActivitySelect = document.getElementById('certificate-activity');
    const certificateParticipantSelect = document.getElementById('certificate-participant');
    const participationTypeDisplay = document.getElementById('participation-type-display');
    const participationResultGroup = document.getElementById('participation-result-group');

    certificateActivitySelect.innerHTML = '<option value="">Selecione...</option>';
    certificateActivitySelect.disabled = true;
    certificateParticipantSelect.innerHTML = '<option value="">Selecione uma atividade primeiro...</option>';
    certificateParticipantSelect.disabled = true;
    participationResultGroup.style.display = 'none';
    participationTypeDisplay.textContent = '';

    if (selectedEventId) {
        const activities = await fetchData(`${BASE_URL}/atividade/evento/${selectedEventId}`);
        if (activities && activities.length > 0) {
            activities.forEach(activity => {
                const option = document.createElement('option');
                option.value = activity.idAtividade;
                option.textContent = activity.titulo;
                certificateActivitySelect.appendChild(option);
            });
            certificateActivitySelect.disabled = false;
        } else {
            certificateActivitySelect.innerHTML += '<option value="" disabled>Nenhuma atividade para este evento</option>';
        }
    } else {
        certificateActivitySelect.innerHTML = '<option value="">Selecione um evento primeiro...</option>';
    }
});

// Event listener para o dropdown de Atividades na aba de Certificados
document.getElementById('certificate-activity').addEventListener('change', async function () {
    const selectedActivityId = this.value;
    const certificateParticipantSelect = document.getElementById('certificate-participant');
    const participationTypeDisplay = document.getElementById('participation-type-display');
    const participationResultGroup = document.getElementById('participation-result-group');

    certificateParticipantSelect.innerHTML = '<option value="">Selecione...</option>';
    certificateParticipantSelect.disabled = true;
    participationResultGroup.style.display = 'none';
    participationTypeDisplay.textContent = '';

    if (selectedActivityId) {
        // Para popular os participantes, precisamos de todos os participantes
        // e depois filtrar aqueles que participaram desta atividade específica
        const participants = await fetchData(`${BASE_URL}/participante`);
        const participations = await fetchData(`${BASE_URL}/participacao`); // Buscar todas as participações

        const participantsInActivity = new Set();
        if (participations && participants) {
            participations.forEach(p => {
                if (p.fk_idAtividade == selectedActivityId) { // Comparação com == para permitir string/number
                    participantsInActivity.add(p.fk_idParticipante);
                }
            });

            participants.forEach(participant => {
                if (participantsInActivity.has(participant.idParticipante)) {
                    const option = document.createElement('option');
                    option.value = participant.idParticipante;
                    option.textContent = participant.nome;
                    certificateParticipantSelect.appendChild(option);
                }
            });
            if (certificateParticipantSelect.options.length > 1) { // Se houver mais que a opção "Selecione..."
                certificateParticipantSelect.disabled = false;
            } else {
                certificateParticipantSelect.innerHTML += '<option value="" disabled>Nenhum participante nesta atividade</option>';
            }
        } else {
            certificateParticipantSelect.innerHTML += '<option value="" disabled>Nenhum participante disponível</option>';
        }
    } else {
        certificateParticipantSelect.innerHTML = '<option value="">Selecione uma atividade primeiro...</option>';
    }
});

// Event listener para o botão "Verificar Participação"
document.getElementById('check-participation-btn').addEventListener('click', async function () {
    const selectedActivityId = document.getElementById('certificate-activity').value;
    const selectedParticipantId = document.getElementById('certificate-participant').value;
    const participationTypeDisplay = document.getElementById('participation-type-display');
    const participationResultGroup = document.getElementById('participation-result-group');

    participationTypeDisplay.textContent = '';
    participationResultGroup.style.display = 'none';

    if (!selectedActivityId || !selectedParticipantId) {
        showCustomMessage('Erro', 'Por favor, selecione um evento, uma atividade e um participante.');
        return;
    }

    // Requisição ao novo endpoint do backend para buscar a participação específica
    const participation = await fetchData(`${BASE_URL}/participacao/by-atividade-participante/${selectedActivityId}/${selectedParticipantId}`);

    if (participation && participation.tipo) {
        participationTypeDisplay.textContent = participation.tipo.charAt(0).toUpperCase() + participation.tipo.slice(1); // Capitaliza a primeira letra
        participationResultGroup.style.display = 'block';
    } else {
        showCustomMessage('Informação', 'Participação não encontrada para a combinação selecionada.');
    }
});

// --- Funções para a aba de Palestrantes ---
async function loadSpeakersTab() {
    const speakersEventSelect = document.getElementById('speakers-event');
    const speakersTableBody = document.getElementById('speakers-table-body');

    // Limpar e popular dropdown de Eventos
    speakersEventSelect.innerHTML = '<option value="">Selecione um evento...</option>';
    const events = await fetchData(`${BASE_URL}/evento`);
    if (events && events.length > 0) {
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.idEvento;
            option.textContent = event.titulo;
            speakersEventSelect.appendChild(option);
        });
    }

    // Limpar a tabela de palestrantes
    speakersTableBody.innerHTML = '<tr><td colspan="6">Selecione um evento para ver os palestrantes.</td></tr>';
}

// Event listener para o dropdown de Eventos na aba de Palestrantes
document.getElementById('speakers-event').addEventListener('change', async function () {
    const selectedEventId = this.value;
    const speakersTableBody = document.getElementById('speakers-table-body');
    speakersTableBody.innerHTML = ''; // Limpa a tabela

    if (!selectedEventId) {
        speakersTableBody.innerHTML = '<tr><td colspan="6">Selecione um evento para ver os palestrantes.</td></tr>';
        return;
    }

    const allActivities = await fetchData(`${BASE_URL}/atividade`);
    const allParticipants = await fetchData(`${BASE_URL}/participante`);
    const allParticipations = await fetchData(`${BASE_URL}/participacao`);

    if (!allActivities || !allParticipants || !allParticipations) {
        speakersTableBody.innerHTML = '<tr><td colspan="6">Erro ao carregar dados.</td></tr>';
        return;
    }

    // Filtrar atividades que pertencem ao evento selecionado
    const eventActivities = allActivities.filter(activity => activity.fk_idEvento == selectedEventId);
    const speakerData = [];

    eventActivities.forEach(activity => {
        // Encontrar participações que são de palestrantes e pertencem a esta atividade
        const speakersInActivity = allParticipations.filter(p =>
            p.fk_idAtividade == activity.idAtividade && p.tipo === 'palestrante'
        );

        speakersInActivity.forEach(speakerParticipation => {
            const speaker = allParticipants.find(p => p.idParticipante === speakerParticipation.fk_idParticipante);
            if (speaker) {
                speakerData.push({
                    activityTitle: activity.titulo,
                    activityType: activity.tipo,
                    activityDate: new Date(activity.dataHoraInicio).toLocaleDateString('pt-BR'),
                    activityStartTime: new Date(activity.dataHoraInicio).toLocaleTimeString('pt-BR').substring(0, 5), // HH:MM
                    speakerName: speaker.nome,
                    speakerEmail: speaker.email
                });
            }
        });
    });

    if (speakerData.length > 0) {
        speakerData.forEach(data => {
            const row = speakersTableBody.insertRow();
            row.innerHTML = `
                <td>${data.activityTitle}</td>
                <td>${data.activityType}</td>
                <td>${data.activityDate}</td>
                <td>${data.activityStartTime}</td>
                <td>${data.speakerName}</td>
                <td>${data.speakerEmail}</td>
            `;
        });
    } else {
        speakersTableBody.innerHTML = '<tr><td colspan="6">Nenhum palestrante encontrado para o evento selecionado.</td></tr>';
    }
});

// Função para inicializar os campos de pesquisa com o comportamento de highlight
function initializeSearchInputs() {
    const searchInputs = document.querySelectorAll('.filter-input');
    searchInputs.forEach(input => {
        const wrapper = input.closest('.search-input-wrapper');
        if (!wrapper) return;

        // Verifica o estado inicial do campo (se já tem valor)
        if (input.value.length > 0) {
            wrapper.classList.add('is-active');
        }

        // Adiciona listener para o evento 'input' (digitação)
        input.addEventListener('input', () => {
            if (input.value.length > 0) {
                wrapper.classList.add('is-active');
            } else {
                wrapper.classList.remove('is-active');
            }
            // Chama a função de carregamento/filtro da tabela correspondente
            const tabId = input.closest('.tab-content').id;
            if (tabId === 'events') loadEvents();
            else if (tabId === 'activities') loadActivities();
            else if (tabId === 'participants') loadParticipants();
            else if (tabId === 'registrations') loadRegistrations();
        });

        // Adiciona listener para o evento 'focus' (clicar no campo)
        input.addEventListener('focus', () => {
            wrapper.classList.add('is-active');
        });

        // Adiciona listener para o evento 'blur' (sair do campo)
        input.addEventListener('blur', () => {
            // Remove 'is-active' apenas se o campo estiver vazio ao perder o foco
            if (input.value.length === 0) {
                wrapper.classList.remove('is-active');
            }
        });
    });
}


// Carregamento inicial
document.addEventListener('DOMContentLoaded', () => {
    showTab('dashboard'); // Carrega o conteúdo do dashboard inicialmente
    initializeSearchInputs(); // Inicializa o comportamento de highlight dos campos de pesquisa
});
