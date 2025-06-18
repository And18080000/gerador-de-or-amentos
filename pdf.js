import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getState } from './state.js';
import { DOMElements } from './dom.js';
import { showToast } from './ui.js';

async function populatePdfTemplate(state) {
    const q = state; 
    const t = DOMElements.pdfTemplate;
    const formattedDate = new Date(q.quote.date + 'T00:00:00').toLocaleDateString('pt-BR');
    
    t.companyName.textContent = q.company.name || "Sua Empresa";
    t.companyCnpj.textContent = q.company.cnpj ? `CNPJ: ${q.company.cnpj}` : '';
    t.footerCompanyName.textContent = q.company.name || "Sua Empresa";
    
    t.clientName.textContent = q.client.name || "Cliente";
    if (q.client.doc) {
        t.clientDoc.textContent = q.client.doc;
        t.clientDocContainer.style.display = 'block';
    } else {
        t.clientDocContainer.style.display = 'none';
    }
    
    const quoteNumber = q.quote.number || Date.now().toString().slice(-6);
    // Only assign a new number if it doesn't have one. Important for reprints.
    if (!q.quote.number) {
        q.quote.number = quoteNumber;
    }
    t.quoteNumber.textContent = quoteNumber;

    t.date.textContent = formattedDate;
    t.validity.textContent = q.quote.validity;
    t.validityFooter.textContent = q.quote.validity;
    
    t.logoPreview.src = q.config.logoDataUrl;
    
    t.itemsBody.innerHTML = '';
    q.items.forEach(item => {
        const row = document.createElement('tr');
        const quantity = item.quantity || 1;
        const unitValue = item.unitValue || item.value || 0; 
        const totalValue = quantity * unitValue;
        row.innerHTML = `
            <td>${item.name || ''}</td>
            <td>${item.description || ''}</td>
            <td class="qtty-col">${quantity}</td>
            <td class="unit-col">${item.unit || 'unid'}</td>
            <td class="price-col">${unitValue.toFixed(2).replace('.', ',')}</td>
            <td class="total-col">${totalValue.toFixed(2).replace('.', ',')}</td>
        `;
        t.itemsBody.appendChild(row);
    });

    const subtotal = q.items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.unitValue || item.value || 0)), 0);
    let discountAmount = 0;
    if(q.discount.percent > 0) {
        discountAmount = subtotal * (q.discount.percent / 100);
        t.discountLabel.textContent = `${q.discount.percent}%`;
        t.discountRow.style.display = 'table-row';
    } else if (q.discount.fixed > 0) {
        discountAmount = q.discount.fixed;
        t.discountLabel.textContent = `R$ ${q.discount.fixed.toFixed(2).replace('.', ',')}`;
        t.discountRow.style.display = 'table-row';
    } else {
        t.discountRow.style.display = 'none';
    }
    const total = subtotal - discountAmount;
    t.subtotal.textContent = subtotal.toFixed(2).replace('.', ',');
    t.discount.textContent = discountAmount.toFixed(2).replace('.', ',');
    t.totalValue.textContent = total.toFixed(2).replace('.', ',');

    t.socials.innerHTML = '';
    if(q.company.whatsapp) t.socials.innerHTML += `<a href="#"><img src="whatsapp.png" alt="whatsapp"> ${q.company.whatsapp}</a>`;
    if(q.company.instagram) t.socials.innerHTML += `<a href="#"><img src="instagram.png" alt="instagram"> ${q.company.instagram}</a>`;
    if(q.company.website) t.socials.innerHTML += `<a href="#"><img src="website.png" alt="website"> ${q.company.website.replace(/https?:\/\//, '')}</a>`;

    if (q.config.useWatermark && q.config.logoDataUrl !== 'logo_placeholder.png') {
        t.watermark.innerHTML = `<img src="${q.config.logoDataUrl}" alt="Watermark">`;
    } else {
        t.watermark.innerHTML = '';
    }

    t.template.style.backgroundColor = q.config.pdfBgColor;
}

export async function generatePdf(isPreview = false, sourceState = null) {
    showToast(isPreview ? "Gerando prévia..." : "Gerando PDF...");
    
    const state = sourceState || getState();

    const pdfTemplateWrapper = document.getElementById('pdf-template-wrapper');
    await populatePdfTemplate(state);

    pdfTemplateWrapper.style.display = 'block';

    const canvas = await html2canvas(document.getElementById('pdf-template'), {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: null 
    });

    pdfTemplateWrapper.style.display = 'none';

    const imgData = canvas.toDataURL('image/png');

    if (isPreview) {
        DOMElements.modalContent.innerHTML = `<img src="${imgData}" alt="PDF Preview">`;
        DOMElements.modal.style.display = 'flex';
    } else {
        const q = state;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        const clientName = (q.client.name || 'cliente').replace(/\s/g, '_');
        doc.save(`orcamento-${clientName}-${q.quote.number}.pdf`);
    }
}