import { initState, updateState, saveState, exportState, importState, addHistoryEntry, loadStateFromHistory, deleteHistoryEntry, getHistoryEntry } from './state.js';
import { DOMElements } from './dom.js';
import { updateUI, showToast, renderHistoryAndChart } from './ui.js';
import { generatePdf } from './pdf.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- INITIALIZATION ---
    initState();
    updateUI();
    
    // --- EVENT LISTENERS ---
    
    function setupEventListeners() {
        // Delegate input changes to a single listener on the body
        document.body.addEventListener('input', (e) => {
            const id = e.target.id;
            const classList = e.target.classList;
            
            // Company details
            if (id === 'company-name') updateState({ path: 'company.name', value: e.target.value });
            if (id === 'company-cnpj') updateState({ path: 'company.cnpj', value: e.target.value });
            if (id === 'company-whatsapp') updateState({ path: 'company.whatsapp', value: e.target.value });
            if (id === 'company-instagram') updateState({ path: 'company.instagram', value: e.target.value });
            if (id === 'company-website') updateState({ path: 'company.website', value: e.target.value });
            
            // Client details
            if (id === 'client-name') updateState({ path: 'client.name', value: e.target.value });
            if (id === 'client-doc') updateState({ path: 'client.doc', value: e.target.value });
            if (id === 'quote-date') updateState({ path: 'quote.date', value: e.target.value });
            if (id === 'quote-validity') updateState({ path: 'quote.validity', value: parseInt(e.target.value) || 0 });
            
            // Item details
            const itemEl = e.target.closest('.item');
            if (itemEl) {
                const itemId = parseInt(itemEl.dataset.id);
                if (classList.contains('item-name')) updateState({ path: `items.${itemId}.name`, value: e.target.value });
                if (classList.contains('item-description')) updateState({ path: `items.${itemId}.description`, value: e.target.value });
                if (classList.contains('item-unit')) updateState({ path: `items.${itemId}.unit`, value: e.target.value });
                if (classList.contains('item-quantity')) {
                    updateState({ path: `items.${itemId}.quantity`, value: parseInt(e.target.value) || 1 });
                    updateUI(); // recalculate totals
                }
                if (classList.contains('item-unit-value')) {
                    updateState({ path: `items.${itemId}.unitValue`, value: parseFloat(e.target.value) || 0 });
                    updateUI(); // recalculate totals
                }
            }

            // Discount
            if (id === 'discount-percent') {
                updateState({ path: 'discount.percent', value: parseFloat(e.target.value) || 0 });
                if (parseFloat(e.target.value) > 0) updateState({ path: 'discount.fixed', value: 0 });
                updateUI();
            }
            if (id === 'discount-fixed') {
                updateState({ path: 'discount.fixed', value: parseFloat(e.target.value) || 0 });
                if (parseFloat(e.target.value) > 0) updateState({ path: 'discount.percent', value: 0 });
                updateUI();
            }
        });

        DOMElements.itemsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-item-btn')) {
                const itemEl = e.target.closest('.item');
                const id = parseInt(itemEl.dataset.id);
                updateState({ path: `items.${id}`, value: null, action: 'delete' });
                updateUI();
            }
        });

        DOMElements.addItemBtn.addEventListener('click', () => {
            updateState({ path: 'items', value: { id: Date.now(), name: '', description: '', quantity: 1, unit: 'unid', unitValue: 0 }, action: 'add' });
            updateUI();
        });

        DOMElements.logoUpload.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    updateState({ path: 'config.logoDataUrl', value: event.target.result });
                    showToast("Logo carregada.");
                };
                reader.readAsDataURL(file);
            } else {
                updateState({ path: 'config.logoDataUrl', value: 'logo_placeholder.png' });
            }
        });

        DOMElements.useWatermark.addEventListener('change', (e) => updateState({ path: 'config.useWatermark', value: e.target.checked }));
        DOMElements.pdfBgColor.addEventListener('input', (e) => updateState({ path: 'config.pdfBgColor', value: e.target.value }));
        
        DOMElements.themeToggle.addEventListener('change', () => {
             const newTheme = DOMElements.themeToggle.checked ? 'dark' : 'light';
             updateState({ path: 'theme', value: newTheme });
             document.body.classList.toggle('dark-mode', newTheme === 'dark');
             renderHistoryAndChart(); // Re-render chart with new theme colors
             saveState();
        });
        
        DOMElements.saveBtn.addEventListener('click', () => {
            saveState();
            showToast("Progresso salvo com sucesso!");
        });
        
        DOMElements.exportBtn.addEventListener('click', () => {
            exportState();
            showToast("Dados exportados com sucesso!");
        });
        
        DOMElements.importFile.addEventListener('change', (e) => {
            importState(e)
              .then(() => {
                  updateUI();
                  showToast("Dados importados com sucesso!");
              })
              .catch(error => {
                  console.error("Error importing data:", error);
                  alert("Erro ao importar dados. Verifique o console para mais detalhes.");
              });
        });
        
        DOMElements.previewPdfBtn.addEventListener('click', () => generatePdf(true));
        
        DOMElements.generatePdfBtn.addEventListener('click', async () => {
            await generatePdf(false);
            addHistoryEntry();
            saveState();
            updateUI(); // will re-render history and chart
            showToast("Orçamento salvo no histórico!");
        });
        
        // History actions
        DOMElements.historyList.addEventListener('click', async (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const quoteNumber = button.dataset.quoteNumber;
            if (!quoteNumber) return;

            if (button.classList.contains('edit-history-btn')) {
                if (confirm('Deseja carregar este orçamento para edição? Suas alterações atuais serão perdidas.')) {
                    loadStateFromHistory(quoteNumber);
                    updateUI();
                    showToast(`Orçamento #${quoteNumber} carregado.`);
                }
            } else if (button.classList.contains('reprint-history-btn')) {
                const historyState = getHistoryEntry(quoteNumber);
                if (historyState) {
                    await generatePdf(false, historyState);
                    showToast(`PDF do orçamento #${quoteNumber} gerado novamente.`);
                }
            } else if (button.classList.contains('delete-history-btn')) {
                 if (confirm(`Tem certeza que deseja excluir o orçamento #${quoteNumber} do histórico? Esta ação não pode ser desfeita.`)) {
                    deleteHistoryEntry(quoteNumber);
                    saveState();
                    updateUI();
                    showToast(`Orçamento #${quoteNumber} excluído.`);
                }
            }
        });
        
        DOMElements.modalClose.addEventListener('click', () => DOMElements.modal.style.display = 'none');
        DOMElements.modal.addEventListener('click', (e) => {
            if(e.target === DOMElements.modal) DOMElements.modal.style.display = 'none';
        });
    }

    setupEventListeners();
});