function showTab(tabId) {
          // Hide all tab contents
          document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
          });

          // Show selected tab content
          document.getElementById(tabId).classList.add('active');

          // Update active menu item
          document.querySelectorAll('.menu-item').forEach(item => {
                    item.classList.remove('active');
          });

          // Find the menu item that corresponds to this tab and make it active
          const menuItems = document.querySelectorAll('.menu-item');
          for (let i = 0; i < menuItems.length; i++) {
                    if (menuItems[i].getAttribute('onclick').includes(tabId)) {
                              menuItems[i].classList.add('active');
                              break;
                    }
          }
}

// Open modal
function openModal(type) {
          document.getElementById(`${type}-modal`).style.display = 'flex';
}

// Close modal
function closeModal(type) {
          document.getElementById(`${type}-modal`).style.display = 'none';
}

// Show/hide fee field based on event type
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

// Close modal when clicking outside
window.addEventListener('click', function (event) {
          if (event.target.classList.contains('modal')) {
                    event.target.style.display = 'none';
          }
});

document.getElementById('form-event').addEventListener('submit', function (e) {
          e.preventDefault();
          alert('Evento enviado!');
          closeModal('event');
});

// Handler para formulário de atividades
document.getElementById('form-activity').addEventListener('submit', function (e) {
          e.preventDefault();
          alert('Atividade enviada!');
          closeModal('activity');
});

// Handler para formulário de participantes
document.getElementById('form-participant').addEventListener('submit', function (e) {
          e.preventDefault();
          alert('Participante enviado!');
          closeModal('participant');
});
