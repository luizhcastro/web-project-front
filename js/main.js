// js/main.js
import * as dashboard from './modules/dashboard.js';
import * as events from './modules/events.js';
import * as activities from './modules/activities.js';
import * as participants from './modules/participants.js';
import * as registrations from './modules/registrations.js';
import * as certificates from './modules/certificates.js';
import * as speakers from './modules/speakers.js';

// Função para mostrar e esconder abas.
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(tabId)?.classList.add('active');

    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    const menuItems = document.querySelectorAll('.menu-item');
    for (let i = 0; i < menuItems.length; i++) {
        if (menuItems[i].getAttribute('onclick')?.includes(tabId)) {
            menuItems[i].classList.add('active');
            break;
        }
    }

    // Limpa os campos de pesquisa ao trocar de aba
    const eventSearch = document.getElementById('event-search');
    if (eventSearch) eventSearch.value = '';
    const eventYearFilter = document.getElementById('event-year-filter');
    if (eventYearFilter) eventYearFilter.value = '';

    const activitySearch = document.getElementById('activity-search');
    if (activitySearch) activitySearch.value = '';
    const activityYearFilter = document.getElementById('activity-year-filter');
    if (activityYearFilter) activityYearFilter.value = '';

    const participantSearch = document.getElementById('participant-search');
    if (participantSearch) participantSearch.value = '';
    const participantBirthYearFilter = document.getElementById('participant-birth-year-filter');
    if (participantBirthYearFilter) participantBirthYearFilter.value = '';

    const registrationSearch = document.getElementById('registration-search');
    if (registrationSearch) registrationSearch.value = '';
    const registrationBirthDateFilter = document.getElementById('registration-birth-date-filter');
    if (registrationBirthDateFilter) registrationBirthDateFilter.value = '';

    const upcomingEventSearch = document.getElementById('upcoming-event-search');
    if (upcomingEventSearch) upcomingEventSearch.value = '';
    const upcomingEventYearFilter = document.getElementById('upcoming-event-year-filter');
    if (upcomingEventYearFilter) upcomingEventYearFilter.value = '';


    // Carrega os dados da aba ativa
    if (tabId === 'dashboard') {
        dashboard.loadDashboardData();
        dashboard.loadUpcomingEvents();
    } else if (tabId === 'events') {
        events.loadEvents();
    } else if (tabId === 'activities') {
        activities.loadActivities();
    } else if (tabId === 'participants') {
        participants.loadParticipants();
    } else if (tabId === 'registrations') {
        registrations.loadRegistrations();
        registrations.populateRegistrationDropdowns();
    } else if (tabId === 'certificates') {
        certificates.loadCertificatesTab();
    } else if (tabId === 'speakers') {
        speakers.loadSpeakersTab();
    }
}

// Inicializa os event listeners para os campos de busca e filtro
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a funcionalidade de busca para todos os campos com a classe 'filter-input'
    const initializeSearchInputs = () => {
        const searchInputs = document.querySelectorAll('.filter-input');
        searchInputs.forEach(input => {
            const wrapper = input.closest('.search-input-wrapper');
            if (!wrapper) return;

            if (input.value.length > 0) {
                wrapper.classList.add('is-active');
            }

            input.addEventListener('input', () => {
                if (input.value.length > 0) {
                    wrapper.classList.add('is-active');
                } else {
                    wrapper.classList.remove('is-active');
                }
                const tabId = input.closest('.tab-content')?.id;
                if (tabId === 'events') events.loadEvents();
                else if (tabId === 'activities') activities.loadActivities();
                else if (tabId === 'participants') participants.loadParticipants();
                else if (tabId === 'registrations') registrations.loadRegistrations();
                else if (tabId === 'dashboard') dashboard.loadUpcomingEvents(); // Garante que a pesquisa do dashboard chame a função correta
            });

            input.addEventListener('focus', () => {
                wrapper.classList.add('is-active');
            });

            input.addEventListener('blur', () => {
                if (input.value.length === 0) {
                    wrapper.classList.remove('is-active');
                }
            });
        });
    };
    initializeSearchInputs();

    // Adiciona showTab ao escopo global para que possa ser chamado diretamente do HTML
    window.showTab = showTab;

    // Carrega a aba inicial (dashboard)
    showTab('dashboard');
});