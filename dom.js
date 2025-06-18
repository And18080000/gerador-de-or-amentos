export const DOMElements = {
    // Company
    companyName: document.getElementById('company-name'),
    companyCnpj: document.getElementById('company-cnpj'),
    companyWhatsapp: document.getElementById('company-whatsapp'),
    companyInstagram: document.getElementById('company-instagram'),
    companyWebsite: document.getElementById('company-website'),
    // Client
    clientName: document.getElementById('client-name'),
    clientDoc: document.getElementById('client-doc'),
    quoteDate: document.getElementById('quote-date'),
    quoteValidity: document.getElementById('quote-validity'),
    // Items
    itemsContainer: document.getElementById('items-container'),
    addItemBtn: document.getElementById('add-item-btn'),
    // Totals
    subtotalValue: document.getElementById('subtotal-value'),
    discountValue: document.getElementById('discount-value'),
    totalValue: document.getElementById('total-value'),
    discountPercent: document.getElementById('discount-percent'),
    discountFixed: document.getElementById('discount-fixed'),
    // PDF & Data
    logoUpload: document.getElementById('logo-upload'),
    useWatermark: document.getElementById('use-watermark'),
    pdfBgColor: document.getElementById('pdf-bg-color'),
    previewPdfBtn: document.getElementById('preview-pdf-btn'),
    generatePdfBtn: document.getElementById('generate-pdf-btn'),
    saveBtn: document.getElementById('save-btn'),
    exportBtn: document.getElementById('export-btn'),
    importFile: document.getElementById('import-file'),
    // Theme
    themeToggle: document.getElementById('theme-toggle'),
    // Modal
    modal: document.getElementById('pdf-preview-modal'),
    modalContent: document.getElementById('pdf-preview-container'),
    modalClose: document.querySelector('.modal-close-btn'),
    // Toast
    toast: document.getElementById('toast-notification'),
    // History & Analytics
    progressChartCanvas: document.getElementById('progress-chart'),
    historyList: document.getElementById('history-list'),
    // PDF Template Elements
    pdfTemplate: {
        template: document.getElementById('pdf-template'),
        companyName: document.getElementById('pdf-company-name'),
        companyCnpj: document.getElementById('pdf-company-cnpj'),
        footerCompanyName: document.getElementById('pdf-footer-company-name'),
        clientName: document.getElementById('pdf-client-name'),
        clientDoc: document.getElementById('pdf-client-doc'),
        clientDocContainer: document.getElementById('pdf-client-doc-container'),
        quoteNumber: document.getElementById('pdf-quote-number'),
        date: document.getElementById('pdf-date'),
        validity: document.getElementById('pdf-validity'),
        validityFooter: document.getElementById('pdf-validity-footer'),
        logoPreview: document.getElementById('pdf-logo-preview'),
        itemsBody: document.getElementById('pdf-items-body'),
        subtotal: document.getElementById('pdf-subtotal'),
        discount: document.getElementById('pdf-discount'),
        discountRow: document.getElementById('pdf-discount-row'),
        discountLabel: document.getElementById('pdf-discount-label'),
        totalValue: document.getElementById('pdf-total-value'),
        socials: document.getElementById('pdf-socials'),
        watermark: document.getElementById('pdf-watermark'),
    }
};