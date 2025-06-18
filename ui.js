import { DOMElements } from './dom.js';
import { getState } from './state.js';
import { Chart, registerables } from 'chart.js/auto';
Chart.register(...registerables);

let progressChart = null; // To hold the chart instance

export function showToast(message) {
    DOMElements.toast.textContent = message;
    DOMElements.toast.className = "toast show";
    setTimeout(() => { DOMElements.toast.className = DOMElements.toast.className.replace("show", ""); }, 3000);
}

function renderItems() {
    const { items } = getState();
    DOMElements.itemsContainer.innerHTML = '';
    
    if (!items || items.length === 0) {
        // This case should ideally be handled by the state logic to always have at least one item
        return;
    }

    items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.classList.add('item');
        itemEl.dataset.id = item.id;
        itemEl.innerHTML = `
            <div class="form-group item-name-group">
                <label>Item</label>
                <input type="text" class="item-name" placeholder="Ex: Desenvolvimento de Site" value="${item.name || ''}">
            </div>
            <div class="form-group item-desc-group">
                <label>Descrição</label>
                <input type="text" class="item-description" placeholder="Ex: Site institucional com 5 páginas" value="${item.description || ''}">
            </div>
            <div class="form-group item-qtty-group">
                <label>Qtd.</label>
                <input type="number" class="item-quantity" value="${item.quantity || 1}" min="1">
            </div>
            <div class="form-group item-unit-group">
                <label>Unid.</label>
                <select class="item-unit">
                    <option value="unid" ${item.unit === 'unid' ? 'selected' : ''}>Unidade</option>
                    <option value="pç" ${item.unit === 'pç' ? 'selected' : ''}>Peça</option>
                    <option value="cx" ${item.unit === 'cx' ? 'selected' : ''}>Caixa</option>
                    <option value="serv" ${item.unit === 'serv' ? 'selected' : ''}>Serviço</option>
                    <option value="h" ${item.unit === 'h' ? 'selected' : ''}>Hora</option>
                    <option value="m²" ${item.unit === 'm²' ? 'selected' : ''}>m²</option>
                </select>
            </div>
            <div class="form-group item-value-group">
                <label>Valor Unit. (R$)</label>
                <input type="number" step="0.01" class="item-unit-value" placeholder="1500.00" value="${item.unitValue || ''}">
            </div>
            <button class="btn btn-danger delete-item-btn">X</button>
        `;
        DOMElements.itemsContainer.appendChild(itemEl);
    });
}

function calculateAndRenderTotals() {
    const { items, discount } = getState();
    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.unitValue || 0)), 0);
    let discountAmount = 0;

    if (discount.percent > 0) {
        discountAmount = subtotal * (discount.percent / 100);
    } else if (discount.fixed > 0) {
        discountAmount = discount.fixed;
    }

    const total = subtotal - discountAmount;

    DOMElements.subtotalValue.textContent = subtotal.toFixed(2).replace('.', ',');
    DOMElements.discountValue.textContent = discountAmount.toFixed(2).replace('.', ',');
    DOMElements.totalValue.textContent = total.toFixed(2).replace('.', ',');
}

export function renderHistoryAndChart() {
    const { history, theme } = getState();

    // Render History List
    DOMElements.historyList.innerHTML = '';
    if (history && history.length > 0) {
        const sortedHistory = [...history].sort((a, b) => new Date(b.quote.date) - new Date(a.quote.date));
        sortedHistory.forEach((record) => {
            const subtotal = record.items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.unitValue || item.value || 0)), 0);
            let discountAmount = 0;
            if(record.discount.percent > 0) discountAmount = subtotal * (record.discount.percent / 100);
            else if (record.discount.fixed > 0) discountAmount = record.discount.fixed;
            const total = subtotal - discountAmount;
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-item-info">
                    <span><b>#${record.quote.number}</b> - ${new Date(record.quote.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    <span>${record.client.name}</span>
                    <span class="history-item-total">R$ ${total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="history-item-actions">
                    <button class="btn-history edit-history-btn" title="Carregar para Edição" data-quote-number="${record.quote.number}">✏️</button>
                    <button class="btn-history reprint-history-btn" title="Reimprimir PDF" data-quote-number="${record.quote.number}">📄</button>
                    <button class="btn-history delete-history-btn" title="Excluir do Histórico" data-quote-number="${record.quote.number}">🗑️</button>
                </div>
            `;
            DOMElements.historyList.appendChild(historyItem);
        });
    } else {
        DOMElements.historyList.innerHTML = '<p>Nenhum orçamento gerado ainda.</p>';
    }

    // Render Chart
    const isDarkMode = theme === 'dark';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? '#e0e0e0' : '#333333';

    const chartData = history.reduce((acc, q) => {
        const month = new Date(q.quote.date + 'T00:00:00').toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' });
        const subtotal = q.items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.unitValue || item.value || 0)), 0);
        let discountAmount = 0;
        if(q.discount.percent > 0) discountAmount = subtotal * (q.discount.percent / 100);
        else if (q.discount.fixed > 0) discountAmount = q.discount.fixed;
        const total = subtotal - discountAmount;
        
        acc[month] = (acc[month] || 0) + total;
        return acc;
    }, {});

    const labels = Object.keys(chartData).reverse();
    const data = Object.values(chartData).reverse();

    if (progressChart) {
        progressChart.destroy();
    }
    
    if(labels.length === 0) {
        DOMElements.progressChartCanvas.style.display = 'none';
        return;
    }
    DOMElements.progressChartCanvas.style.display = 'block';

    progressChart = new Chart(DOMElements.progressChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Orçado (R$)',
                data: data,
                fill: true,
                backgroundColor: 'rgba(13, 71, 161, 0.2)',
                borderColor: 'rgba(13, 71, 161, 1)',
                tension: 0.3,
                pointBackgroundColor: '#ffc107',
                pointBorderColor: '#0d47a1',
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                 title: {
                    display: true,
                    text: "Progresso Mensal de Orçamentos",
                    color: textColor,
                    font: { size: 16 }
                }
            },
            scales: {
                y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
                x: { ticks: { color: textColor }, grid: { color: gridColor } }
            }
        }
    });
}


export function updateUIFromState() {
    const quoteData = getState();
    // Company
    DOMElements.companyName.value = quoteData.company.name;
    DOMElements.companyCnpj.value = quoteData.company.cnpj;
    DOMElements.companyWhatsapp.value = quoteData.company.whatsapp;
    DOMElements.companyInstagram.value = quoteData.company.instagram;
    DOMElements.companyWebsite.value = quoteData.company.website;
    // Client
    DOMElements.clientName.value = quoteData.client.name;
    DOMElements.clientDoc.value = quoteData.client.doc;
    DOMElements.quoteDate.value = quoteData.quote.date;
    DOMElements.quoteValidity.value = quoteData.quote.validity;
    // Discount
    DOMElements.discountPercent.value = quoteData.discount.percent || '';
    DOMElements.discountFixed.value = quoteData.discount.fixed || '';
    // Config
    DOMElements.useWatermark.checked = quoteData.config.useWatermark;
    DOMElements.pdfBgColor.value = quoteData.config.pdfBgColor;
    // Theme
    DOMElements.themeToggle.checked = quoteData.theme === 'dark';
    document.body.classList.toggle('dark-mode', quoteData.theme === 'dark');

    renderItems();
    calculateAndRenderTotals();
    renderHistoryAndChart();
}

export const updateUI = updateUIFromState;