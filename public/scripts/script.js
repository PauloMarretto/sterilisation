// System Data Architecture State
let state = {
    archives: [],
    autoclaves: [],
    responsables: [],
    currentRecordIndex: -1,
    selectedAutoclaveIndex: -1,
    selectedResponsableIndex: -1,
    activeModalType: null
};

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('archDate').valueAsDate = new Date();
    loadAllData();
});

// Async function to load all data from the backend
async function loadAllData() {
    try {
        const [reportsAuto, reportsResp, reportsArch] = await Promise.all([
            fetch('/autoclaves'),
            fetch('/responsables'),
            fetch('/archives')
        ]);

        state.autoclaves = await reportsAuto.json();
        state.responsables = await reportsResp.json();
        state.archives = await reportsArch.json();

        renderAutoclaves();
        renderResponsables();
        updateArchiveCounter();

        if (state.archives.length > 0) {
            loadRecordIntoForm(0);
        } else {
            handleClearForm();
        }
    } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        alert("Erreur de connexion avec le serveur.");
    }
}

// Navigation controller
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`screen-${screenId}`).classList.add('active');
    const btnIndex = ['archives', 'autoclaves', 'responsables', 'rapports'].indexOf(screenId);
    document.querySelectorAll('.nav-btn')[btnIndex].classList.add('active');
}

// Calculate validity date
function calculateValidity(days) {
    const dateInput = document.getElementById('archDate').value;
    if (!dateInput) return;
    
    const baseDate = new Date(dateInput);
    baseDate.setDate(baseDate.getDate() + days);
    document.getElementById('archValidate').valueAsDate = baseDate;
}

// Render autoclaves list
function renderAutoclaves() {
    const container = document.getElementById('autoclaveListBox');
    const select = document.getElementById('archAutoclave');
    
    container.innerHTML = '';
    select.innerHTML = '<option value="">Sélectionnez...</option>';
    
    state.autoclaves.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `list-item ${state.selectedAutoclaveIndex === index ? 'selected' : ''}`;
        div.innerText = item;
        div.onclick = () => {
            state.selectedAutoclaveIndex = index;
            renderAutoclaves();
        };
        container.appendChild(div);

        const opt = document.createElement('option');
        opt.value = item;
        opt.innerText = item;
        select.appendChild(opt);
    });
}

// Render responsables list
function renderResponsables() {
    const container = document.getElementById('responsableListBox');
    const select = document.getElementById('archResponsable');
    
    container.innerHTML = '';
    select.innerHTML = '<option value="">Sélectionnez...</option>';
    
    state.responsables.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `list-item ${state.selectedResponsableIndex === index ? 'selected' : ''}`;
        div.innerText = item;
        div.onclick = () => {
            state.selectedResponsableIndex = index;
            renderResponsables();
        };
        container.appendChild(div);

        const opt = document.createElement('option');
        opt.value = item;
        opt.innerText = item;
        select.appendChild(opt);
    });
}

// Update archive counter
function updateArchiveCounter() {
    document.getElementById('archiveCount').innerText = state.archives.length;
}

// Modal functions
function openModal(type) {
    state.activeModalType = type;
    document.getElementById('modalInput').value = '';
    
    if(type === 'autoclave') {
        document.getElementById('modalTitle').innerText = "Nouvelle Autoclave";
        document.getElementById('modalLabel').innerText = "Nom de l'équipement";
    } else {
        document.getElementById('modalTitle').innerText = "Nouveau Responsable";
        document.getElementById('modalLabel').innerText = "Nom du responsable";
    }
    document.getElementById('inputModal').classList.add('active');
    document.getElementById('modalInput').focus();
}

function closeModal() {
    document.getElementById('inputModal').classList.remove('active');
    state.activeModalType = null;
}

// Save modal input
async function saveModalInput() {
    const val = document.getElementById('modalInput').value.trim();
    if (!val) return;

    const endpoint = state.activeModalType === 'autoclave' ? '/autoclaves' : '/responsables';
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: val })
        });

        if (response.ok) {
            await loadAllData();
            closeModal();
        } else {
            const errData = await response.json();
            alert("Erreur: " + (errData.error || "Élément déjà existant."));
        }
    } catch (err) {
        console.error("Erreur:", err);
        alert("Erreur de connexion.");
    }
}

// Delete selected master (autoclave or responsable)
async function deleteSelectedMaster(type) {
    if(type === 'autoclave' && state.selectedAutoclaveIndex > -1) {
        const name = state.autoclaves[state.selectedAutoclaveIndex];
        if(confirm(`Voulez-vous vraiment supprimer l'autoclave "${name}" ?`)) {
            await fetch(`/autoclaves/${encodeURIComponent(name)}`, { method: 'DELETE' });
            state.selectedAutoclaveIndex = -1;
            await loadAllData();
        }
    } else if(type === 'responsable' && state.selectedResponsableIndex > -1) {
        const name = state.responsables[state.selectedResponsableIndex];
        if(confirm(`Voulez-vous vraiment supprimer le responsable "${name}" ?`)) {
            await fetch(`/responsables/${encodeURIComponent(name)}`, { method: 'DELETE' });
            state.selectedResponsableIndex = -1;
            await loadAllData();
        }
    }
}

// Load record into form
function loadRecordIntoForm(idx) {
    if(idx < 0 || idx >= state.archives.length) return;
    
    state.currentRecordIndex = idx;
    const rec = state.archives[idx];
    
    document.getElementById('archAutoclave').value = rec.autoclave;
    document.getElementById('archResponsable').value = rec.responsable;
    document.getElementById('archCycle').value = rec.cycle;
    document.getElementById('archDate').value = rec.date;
    document.getElementById('archValidate').value = rec.validate;
    document.getElementById('archTemperature').value = rec.temperature;
    document.getElementById('archPression').value = rec.pression;
    document.getElementById('archQuantite').value = rec.quantite;

    document.getElementById('recordStatus').innerText = `Enregistré (${idx + 1}/${state.archives.length})`;
    document.getElementById('btnEnregistrer').innerText = "Nouvelle";
    
    document.getElementById('btnModifier').classList.remove('btn-disabled');
    document.getElementById('btnEteindre').classList.remove('btn-disabled');
    document.getElementById('btnImprimer').classList.remove('btn-disabled');
}

// Clear form
function handleClearForm() {
    state.currentRecordIndex = -1;
    document.getElementById('archiveForm').reset();
    document.getElementById('archDate').valueAsDate = new Date();
    
    document.getElementById('recordStatus').innerText = "Nouveau";
    document.getElementById('btnEnregistrer').innerText = "Enregistrer";
    
    document.getElementById('btnModifier').classList.add('btn-disabled');
    document.getElementById('btnEteindre').classList.add('btn-disabled');
    document.getElementById('btnImprimer').classList.add('btn-disabled');
}

// Save new record
async function handleSave() {
    const btnText = document.getElementById('btnEnregistrer').innerText;
    if(btnText === "Nouvelle") {
        handleClearForm();
        return;
    }

    const form = document.getElementById('archiveForm');
    if(!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const record = {
        autoclave: document.getElementById('archAutoclave').value,
        responsable: document.getElementById('archResponsable').value,
        cycle: String(document.getElementById('archCycle').value).padStart(5, '0').slice(-5),
        date: document.getElementById('archDate').value,
        validate: document.getElementById('archValidate').value,
        temperature: parseFloat(document.getElementById('archTemperature').value).toFixed(1),
        pression: parseFloat(document.getElementById('archPression').value).toFixed(2),
        quantite: parseInt(document.getElementById('archQuantite').value, 10)
    };

    try {
        const response = await fetch('/archives', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });

        if(response.ok) {
            alert("Enregistrement sauvegardé avec succès !");
            await loadAllData();
            loadRecordIntoForm(state.archives.length - 1);
        } else {
            alert("Erreur lors de l'enregistrement.");
        }
    } catch (err) {
        console.error("Erreur:", err);
    }
}

// Modify record
async function handleModify() {
    if(state.currentRecordIndex === -1) return;
    const recordId = state.archives[state.currentRecordIndex].id;

    const form = document.getElementById('archiveForm');
    if(!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const record = {
        autoclave: document.getElementById('archAutoclave').value,
        responsable: document.getElementById('archResponsable').value,
        cycle: String(document.getElementById('archCycle').value).padStart(5, '0').slice(-5),
        date: document.getElementById('archDate').value,
        validate: document.getElementById('archValidate').value,
        temperature: parseFloat(document.getElementById('archTemperature').value).toFixed(1),
        pression: parseFloat(document.getElementById('archPression').value).toFixed(2),
        quantite: parseInt(document.getElementById('archQuantite').value, 10)
    };

    try {
        const response = await fetch(`/archives/${recordId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });

        if(response.ok) {
            alert("Enregistrement modifié avec succès !");
            await loadAllData();
        }
    } catch (err) {
        console.error("Erreur:", err);
    }
}

// Delete record
async function handleDeleteRecord() {
    if(state.currentRecordIndex === -1) return;
    const recordId = state.archives[state.currentRecordIndex].id;
    
    if(confirm("Voulez-vous vraiment supprimer cet enregistrement ?")) {
        try {
            const response = await fetch(`/archives/${recordId}`, { method: 'DELETE' });
            if(response.ok) {
                await loadAllData();
                handleClearForm();
            }
        } catch (err) {
            console.error("Erreur:", err);
        }
    }
}

// Navigate records
function navigateRecord(direction) {
    if(state.archives.length === 0) return;
    
    let targetIndex = state.currentRecordIndex + direction;
    if(targetIndex >= 0 && targetIndex < state.archives.length) {
        loadRecordIntoForm(targetIndex);
    }
}

// Print labels (placeholder)
function handlePrintLabels() {
    if(state.currentRecordIndex === -1) return;
    const rec = state.archives[state.currentRecordIndex];
    alert(`Impression de ${rec.quantite} étiquette(s) pour l'autoclave ${rec.autoclave}`);
}

// Report functions
function handleDateJourCheckbox(cb) {
    const dateFinInput = document.getElementById('repDateFin');
    if(cb.checked) {
        dateFinInput.valueAsDate = new Date();
        dateFinInput.readOnly = true;
    } else {
        dateFinInput.readOnly = false;
    }
}

// Generate report
function generateReport() {
    const debut = document.getElementById('repDateDebut').value;
    const fin = document.getElementById('repDateFin').value;
    
    if(!debut || !fin) {
        alert("Veuillez spécifier les dates.");
        return;
    }

    const dateStart = new Date(debut);
    const dateEnd = new Date(fin);
    
    const filteredRecords = state.archives.filter(r => {
        const current = new Date(r.date);
        return current >= dateStart && current <= dateEnd;
    });

    const tbody = document.querySelector('#uiReportTable tbody');
    tbody.innerHTML = '';

    if(filteredRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">Aucune donnée pour cette période.</td></tr>';
    } else {
        filteredRecords.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(r.date).toLocaleDateString('fr-FR')}</td>
                <td>${r.autoclave}</td>
                <td>${r.responsable}</td>
                <td>${r.cycle}</td>
                <td>${new Date(r.validate).toLocaleDateString('fr-FR')}</td>
                <td>${r.temperature}</td>
                <td>${r.pression}</td>
                <td>${r.quantite}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('reportTitle').innerText = `Rapport de Stérilisation`;
    document.getElementById('reportPeriod').innerText = `Période: ${new Date(debut).toLocaleDateString('fr-FR')} au ${new Date(fin).toLocaleDateString('fr-FR')}`;
    document.getElementById('reportStats').innerText = `Total: ${filteredRecords.length} cycles | Quantité totale: ${filteredRecords.reduce((sum, r) => sum + r.quantite, 0)}`;

    document.getElementById('reportTableContainer').classList.add('active');
}

// Print report
function printReportDocument() {
    const debut = document.getElementById('repDateDebut').value;
    const fin = document.getElementById('repDateFin').value;
    const tbody = document.querySelector('#uiReportTable tbody');
    const rows = tbody.querySelectorAll('tr');
    
    let tableHTML = `
        <table style="width:100%; border-collapse:collapse; font-size: 11px;">
            <thead>
                <tr style="background-color: #0b192c; color: white;">
                    <th style="border: 1px solid #ddd; padding: 8px;">Date</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Autoclave</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Responsable</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Cycle</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Validité</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Temp (°C)</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Pression (bar)</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qté</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        tableHTML += `
            <tr style="background-color: ${index % 2 === 0 ? '#fff' : '#f9f9f9'};">
                <td style="border: 1px solid #ddd; padding: 8px;">${cells[0].innerText}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${cells[1].innerText}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${cells[2].innerText}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[3].innerText}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${cells[4].innerText}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[5].innerText}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[6].innerText}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[7].innerText}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    const printArea = document.getElementById('printReportArea');
    printArea.innerHTML = `
        <div style="padding: 30px; font-family: 'Segoe UI', sans-serif;">
            <h1 style="font-size: 24px; color: #0b192c; border-bottom: 2px solid #0b192c; padding-bottom: 10px; margin-bottom: 20px;">
                
                <img src="img/logo.png" alt="Logo Dr. Brigatto Cássia" class="header-logo"> Rapport de Stérilisation
            </h1>
            <p style="margin-bottom: 10px; color: #666; font-size: 12px;">
                <strong>Période:</strong> ${new Date(debut).toLocaleDateString('fr-FR')} au ${new Date(fin).toLocaleDateString('fr-FR')}
            </p>
            <p style="margin-bottom: 20px; color: #666; font-size: 12px;">
                <strong>Date d'impression:</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
            </p>
            ${tableHTML}
            <div style="margin-top: 40px; font-size: 11px; color: #999; text-align: right;">
                Document généré automatiquement par le Système de Registre de Stérilisation
            </div>
        </div>
    `;

    window.print();
}