document.addEventListener('DOMContentLoaded', function() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalClose = document.getElementById('modal-close');

    function openModal(title, text, closeButtonText = 'Zavřít') {
        modalTitle.textContent = title;
        modalText.innerHTML = text;
        modalClose.textContent = closeButtonText;
        modalOverlay.classList.remove('hidden');
        modalOverlay.style.display = 'flex';
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        modalOverlay.style.display = 'none';
    }

    function addModalTriggerListener(trigger) {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const label = trigger.closest('label');
            const title = label.textContent.trim().split('\n')[0].trim();
            const text = label.getAttribute('data-modal-text');
            openModal(title, text);
        });
    }

    // Přidejte event listenery pro existující modal triggers
    const modalTriggers = document.querySelectorAll('.modal-trigger');
    modalTriggers.forEach(addModalTriggerListener);

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Exportujte funkce, aby byly dostupné v jiných souborech
    window.addModalTriggerListener = addModalTriggerListener;
    window.openModal = openModal;
    window.closeModal = closeModal;

    // Zobrazení úvodního modálního okna
    const disclaimerText = `
        <p><strong>[CS]</strong></p>
        <p>⚠️ Upozornění: Toto je experimentální projekt a může obsahovat chyby. Nečiňte žádná investiční rozhodnutí na základě tohoto nástroje.</p>
        <br>
        <p><strong>[EN]</strong></p>
        <p>⚠️ Disclaimer: This is an experimental project and may contain errors. Do not make any investment decisions based on this tool.</p>
    `;
    openModal('Upozornění / Disclaimer', disclaimerText, 'Beru na vědomí / Understood');
});
