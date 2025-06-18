import { showToast } from './ui.js';

let quoteData;

const initialState = {
    company: { name: '', cnpj: '', whatsapp: '', instagram: '', website: '' },
    client: { name: '', doc: '' },
    quote: { date: new Date().toISOString().split('T')[0], validity: 15, number: '' },
    items: [{ id: Date.now(), name: '', description: '', quantity: 1, unit: 'unid', unitValue: 0 }],
    discount: { percent: 0, fixed: 0 },
    config: { logoDataUrl: 'logo_placeholder.png', useWatermark: true, pdfBgColor: '#FFFFFF' },
    history: [],
    theme: 'light'
};

export function initState() {
    const savedData = localStorage.getItem('quoteGeneratorData');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Deep merge to ensure new properties from initialState are included
        quoteData = {
            ...initialState,
            ...parsedData,
            company: { ...initialState.company, ...parsedData.company },
            client: { ...initialState.client, ...parsedData.client },
            quote: { ...initialState.quote, ...parsedData.quote, number: '' }, // Reset quote number on load
            items: parsedData.items && parsedData.items.length > 0 ? parsedData.items.map(item => ({...{quantity: 1, unit: 'unid', unitValue: 0}, ...item})) : initialState.items,
            discount: { ...initialState.discount, ...parsedData.discount },
            config: { ...initialState.config, ...parsedData.config },
            history: parsedData.history || [],
        };
        showToast("Dados carregados do armazenamento local.");
    } else {
        quoteData = JSON.parse(JSON.stringify(initialState)); // Deep copy
    }
}

export function getState() {
    return quoteData;
}

export function updateState({ path, value, action = 'update' }) {
    const keys = path.split('.');

    // Special handling for items array updates, e.g., 'items.12345.name'
    if (keys[0] === 'items' && keys.length > 1) {
        const itemId = parseInt(keys[1]);

        if (action === 'delete') {
             const index = quoteData.items.findIndex(item => item.id === itemId);
            if (index > -1 && quoteData.items.length > 1) {
                quoteData.items.splice(index, 1);
            } else if (quoteData.items.length <= 1) {
                showToast('É necessário ter pelo menos um item no orçamento.');
            }
            return;
        }
        
        // Update a property of a specific item
        const item = quoteData.items.find(i => i.id === itemId);
        if (item) {
            const prop = keys[2];
            if(prop) {
                item[prop] = value;
            }
        }
        return;
    }
    
    // Handling for adding a new item, path is 'items'
    if (path === 'items' && action === 'add') {
        quoteData.items.push(value);
        return;
    }

    // Generic path traversal for other state properties, e.g., 'company.name'
    let current = quoteData;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
            // This should not happen with valid paths, but as a safeguard:
            console.error(`Invalid path in updateState: ${path}`);
            return;
        }
        current = current[keys[i]];
    }

    const finalKey = keys[keys.length - 1];
    current[finalKey] = value;
}

export function saveState() {
    localStorage.setItem('quoteGeneratorData', JSON.stringify(quoteData));
}

export function exportState() {
    // Create a clean copy for export, removing potentially large data URLs
    const dataToExport = JSON.parse(JSON.stringify(quoteData));
    dataToExport.config.logoDataUrl = null; 

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-orcamento-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function importState(event) {
    return new Promise((resolve, reject) => {
        const file = event.target.files[0];
        if (!file) return reject("No file selected");

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // Reset logo, as it's not in the JSON, but keep other configs
                const currentLogo = quoteData.config.logoDataUrl; // Keep current logo
                const currentTheme = quoteData.theme; // Keep current theme
                
                importedData.config = { ...initialState.config, ...importedData.config, logoDataUrl: currentLogo };
                importedData.theme = currentTheme;
                
                quoteData = { ...initialState, ...importedData };
                saveState();
                resolve();
            } catch (error) {
                console.error("Error parsing JSON:", error);
                reject("Error parsing JSON file.");
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    });
}

export function addHistoryEntry() {
    const historyRecord = JSON.parse(JSON.stringify(quoteData)); // Deep copy
    // Don't save image data in history to keep storage light
    historyRecord.config.logoDataUrl = null; 
    
    const existingIndex = quoteData.history.findIndex(h => h.quote.number === historyRecord.quote.number);
    if(existingIndex > -1) {
        // This is an edit of an existing history item, so we update it
        quoteData.history[existingIndex] = historyRecord;
        showToast("Orçamento no histórico foi atualizado.");
    } else {
        // This is a new entry
        historyRecord.quote.number = Date.now().toString().slice(-6);
        quoteData.history.push(historyRecord);
        showToast("Novo orçamento salvo no histórico.");
    }
    
    // Prepare the state for the next quote by clearing the quote number
    quoteData.quote.number = ''; 
}

export function loadStateFromHistory(quoteNumber) {
    const historyRecord = quoteData.history.find(h => h.quote.number === quoteNumber);
    if (historyRecord) {
        const stateToLoad = JSON.parse(JSON.stringify(historyRecord));
        // Restore runtime configs from current state
        stateToLoad.config.logoDataUrl = quoteData.config.logoDataUrl;
        stateToLoad.theme = quoteData.theme;
        quoteData = stateToLoad;
    }
}

export function deleteHistoryEntry(quoteNumber) {
    const index = quoteData.history.findIndex(h => h.quote.number === quoteNumber);
    if (index > -1) {
        quoteData.history.splice(index, 1);
    }
}

export function getHistoryEntry(quoteNumber) {
     const historyRecord = quoteData.history.find(h => h.quote.number === quoteNumber);
     if (historyRecord) {
        const stateToLoad = JSON.parse(JSON.stringify(historyRecord));
        // Restore runtime configs from current state that are not saved in history
        stateToLoad.config.logoDataUrl = getState().config.logoDataUrl; 
        stateToLoad.config.pdfBgColor = getState().config.pdfBgColor; 
        stateToLoad.config.useWatermark = getState().config.useWatermark;
        return stateToLoad;
     }
     return null;
}