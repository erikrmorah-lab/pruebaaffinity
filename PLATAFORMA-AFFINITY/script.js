// script.js

// ============================================
// CONSTANTES Y VARIABLES GLOBALES
// ============================================

const COLORS = {
    primary: '#7772ff',
    secondary: '#ff7400',
    accent: '#cef13b',
    highlight: '#ff9cdc'
};

// Elementos del DOM
const clientLoginContainer = document.getElementById('client-login-container');
const clientPanel = document.getElementById('client-panel');
const adminLoginModal = document.getElementById('admin-login-modal');
const adminPanel = document.getElementById('admin-panel');
const loginTabBtn = document.getElementById('login-tab');
const registerTabBtn = document.getElementById('register-tab');
const clientLoginForm = document.getElementById('client-login-form');
const clientRegisterForm = document.getElementById('client-register-form');
const adminLoginForm = document.getElementById('admin-login-form');
const closeAdminModalBtn = document.getElementById('close-admin-modal');
const generateReceiptBtn = document.getElementById('generate-receipt');
const receiptModal = document.getElementById('receipt-modal');
const closeReceiptModalBtn = document.getElementById('close-receipt-modal');
const sendWhatsappBtn = document.getElementById('send-whatsapp');
const adminLogoutBtn = document.getElementById('admin-logout');
const clientLogoutBtn = document.getElementById('client-logout');
const backToClientBtn = document.getElementById('back-to-client');
const clearSelectionBtn = document.getElementById('clear-selection');
const editModal = document.getElementById('edit-modal');
const closeEditModalBtn = document.getElementById('close-edit-modal');
const saveEditBtn = document.getElementById('save-edit');
const cancelEditBtn = document.getElementById('cancel-edit');
const deleteItemBtn = document.getElementById('delete-item');
const addSectionBtn = document.getElementById('add-section');
const addDivisionBtn = document.getElementById('add-division');
const addServiceBtn = document.getElementById('add-service');
const clientNameDisplay = document.getElementById('client-name-display');
const clientCompanyDisplay = document.getElementById('client-company-display');
const servicesCatalog = document.getElementById('services-catalog');
const selectedServicesList = document.getElementById('selected-services-list');
const totalAmountDisplay = document.getElementById('total-amount');

// Modales de cantidad
const quantityModal = document.getElementById('quantity-modal');
const closeQuantityModalBtn = document.getElementById('close-quantity-modal');
const quantityServiceName = document.getElementById('quantity-service-name');
const quantityServiceDescription = document.getElementById('quantity-service-description');
const quantityUnitPrice = document.getElementById('quantity-unit-price');
const quantityInput = document.getElementById('quantity-input');
const decreaseQuantityBtn = document.getElementById('decrease-quantity');
const increaseQuantityBtn = document.getElementById('increase-quantity');
const quantityTotalPrice = document.getElementById('quantity-total-price');
const confirmQuantityBtn = document.getElementById('confirm-quantity');
const cancelQuantityBtn = document.getElementById('cancel-quantity');

// Modal de cuestionario
const questionnaireModal = document.getElementById('questionnaire-modal');
const closeQuestionnaireModalBtn = document.getElementById('close-questionnaire-modal');
const questionnaireForm = document.getElementById('questionnaire-form');
const submitQuestionnaireBtn = document.getElementById('submit-questionnaire');
const cancelQuestionnaireBtn = document.getElementById('cancel-questionnaire');

// Estado de la aplicación
let appState = {
    currentUser: null,
    isAdmin: false,
    selectedServices: [],
    currentReceipt: null,
    editingItem: null,
    editingType: null,
    quantityService: null,
    quantityQuantity: 1,
    pendingReceipt: null
};

let appData = {
    clients: [],
    admins: [],
    sections: [],
    divisions: [],
    services: [],
    receipts: []
};

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

async function loadData() {
    try {

        const savedData = localStorage.getItem('affinityAppData');

        // Si existen datos guardados
        if (savedData) {

            appData = JSON.parse(savedData);

            // Verificar que exista el admin correcto
            const adminExists = appData.admins?.some(
                admin =>
                    admin.username === 'admin' &&
                    admin.password === 'Affinity2026!'
            );

            // Si NO existe, restaurar datos iniciales
            if (!adminExists) {

                console.log('Admin inválido. Restaurando datos iniciales...');

                await loadInitialData();
                await saveData();

            } else {

                console.log('Datos cargados desde localStorage');

            }

        } else {

            // Si no hay datos guardados
            await loadInitialData();
            await saveData();

        }

    } catch (error) {

        console.error('Error al cargar datos:', error);

        // Si hay error, restaurar datos iniciales
        await loadInitialData();
        await saveData();

    }
}

async function loadInitialData() {
    appData.admins = [{ id: 1, username: 'admin', password: 'Affinity2026!' }];

    appData.sections = [
        { id: 1, name: 'SOCIAL MEDIA', icon: 'fas fa-hashtag', description: 'Servicios de redes sociales', order: 1 },
        { id: 2, name: 'BRANDING', icon: 'fas fa-palette', description: 'Servicios de identidad visual', order: 2 }
    ];

    appData.divisions = [
        { id: 1, name: 'Diseño y creación de contenido visual', sectionId: 1, order: 1, description: 'Diseño de contenido visual para redes sociales' },
        { id: 2, name: 'Gestión y administración de redes sociales', sectionId: 1, order: 2, description: 'Gestión y administración completa de redes' },
        { id: 3, name: 'Auditoría y estrategia', sectionId: 1, order: 3, description: 'Auditoría y estrategia de redes sociales' },
        { id: 4, name: 'Producción de video y fotografía', sectionId: 1, order: 4, description: 'Producción de video y fotografía para redes' },
        { id: 5, name: 'Publicidad en Facebook & Instagram Ads', sectionId: 1, order: 5, description: 'Publicidad y anuncios en redes sociales' },
        { id: 6, name: 'Identidad Corporativa', sectionId: 2, order: 1, description: 'Desarrollo de identidad corporativa' }
    ];

    appData.services = [
        { id: 1, name: 'Post / Historia animada o estática', description: 'Diseño de post o historia para redes sociales', price: 250, divisionId: 1, sectionId: 1, type: 'individual', order: 1, hasQuantity: true, quantityLabel: 'posts' },
        { id: 2, name: 'Carrusel (3–6 diapositivas)', description: 'Diseño de carrusel para Instagram', price: 450, divisionId: 1, sectionId: 1, type: 'individual', order: 2, hasQuantity: false },
        { id: 3, name: 'Portada o destacado de perfil', description: 'Diseño de portada o destacado para perfil', price: 150, divisionId: 1, sectionId: 1, type: 'individual', order: 3, hasQuantity: false },
        { id: 4, name: 'Copywriting visual', description: 'Redacción de textos para contenido visual', price: 80, divisionId: 1, sectionId: 1, type: 'individual', order: 4, hasQuantity: true, quantityLabel: 'copies' },
        { id: 5, name: 'Adaptación a otras plataformas', description: 'Adaptación de contenido para diferentes plataformas', price: 100, divisionId: 1, sectionId: 1, type: 'individual', order: 5, hasQuantity: false },
        { id: 6, name: 'Básico: 10 posts', description: 'Paquete básico de 10 posts para redes sociales', price: 2000, divisionId: 1, sectionId: 1, type: 'package', order: 6, hasQuantity: false },
        { id: 7, name: 'Profesional: 15 posts + 5 carruseles + copies', description: 'Paquete profesional con posts, carruseles y copies', price: 3800, divisionId: 1, sectionId: 1, type: 'package', order: 7, hasQuantity: false },
        { id: 8, name: 'Premium: 20 posts + 5 carruseles + 5 historias', description: 'Paquete premium con posts, carruseles e historias', price: 5500, divisionId: 1, sectionId: 1, type: 'package', order: 8, hasQuantity: false },
        { id: 9, name: 'Planificación y calendario', description: 'Planificación de contenido y calendario editorial', price: 800, divisionId: 2, sectionId: 1, type: 'individual', order: 1, hasQuantity: false },
        { id: 10, name: 'Programación y publicación', description: 'Programación y publicación de contenido en redes', price: 700, divisionId: 2, sectionId: 1, type: 'individual', order: 2, hasQuantity: false },
        { id: 11, name: 'Identidad visual completa', description: 'Desarrollo completo de identidad visual', price: 4000, divisionId: 6, sectionId: 2, type: 'individual', order: 1, hasQuantity: false },
        { id: 12, name: 'Rediseño de marca', description: 'Rediseño y actualización de marca existente', price: 2500, divisionId: 6, sectionId: 2, type: 'individual', order: 2, hasQuantity: false }
    ];

    await saveData();
}

async function saveData() {
    try {
        localStorage.setItem('affinityAppData', JSON.stringify(appData));
        console.log('Datos guardados correctamente');
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        return false;
    }
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

async function registerClient(name, company, phone, email, password) {
    const existingClient = appData.clients.find(client => client.email === email);
    if (existingClient) {
        return { success: false, message: 'Ya existe un cliente con este correo electrónico' };
    }

    const newClient = {
        id: Date.now(),
        name,
        company,
        phone,
        email,
        password,
        registrationDate: new Date().toISOString().split('T')[0],
        receipts: []
    };

    appData.clients.push(newClient);
    await saveData();

    return { success: true, client: newClient };
}

function loginClient(email, password) {
    const client = appData.clients.find(c => c.email === email && c.password === password);
    if (!client) {
        return { success: false, message: 'Correo electrónico o contraseña incorrectos' };
    }
    return { success: true, client };
}

function loginAdmin(username, password) {
    const admin = appData.admins.find(a => a.username === username && a.password === password);
    if (!admin) {
        return { success: false, message: 'Usuario o contraseña incorrectos' };
    }
    return { success: true, admin };
}

function logout() {
    appState.currentUser = null;
    appState.isAdmin = false;
    appState.selectedServices = [];
    sessionStorage.removeItem('affinityCurrentUser');
    showClientLogin();
}

// ============================================
// FUNCIONES DE INTERFAZ DE USUARIO
// ============================================

function showClientLogin() {
    clientLoginContainer.classList.remove('hidden');
    clientPanel.classList.add('hidden');
    adminPanel.classList.add('hidden');
    adminLoginModal.classList.add('hidden');
    clientLoginForm.reset();
    clientRegisterForm.reset();
    appState.selectedServices = [];
    updateSelectionSummary();
}

function showClientPanel() {
    clientLoginContainer.classList.add('hidden');
    clientPanel.classList.remove('hidden');
    adminPanel.classList.add('hidden');
    adminLoginModal.classList.add('hidden');
    loadServicesCatalog();
    if (appState.currentUser) {
        clientNameDisplay.textContent = appState.currentUser.name;
        if (appState.currentUser.company) {
            clientCompanyDisplay.textContent = `- ${appState.currentUser.company}`;
        } else {
            clientCompanyDisplay.textContent = '';
        }
    }
}

function showAdminLogin() {
    adminLoginModal.classList.remove('hidden');
    adminLoginForm.reset();
}

function showAdminPanel() {
    clientLoginContainer.classList.add('hidden');
    clientPanel.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    adminLoginModal.classList.add('hidden');
    loadAdminClients();
    loadAdminReceipts();
    loadAdminSections();
    loadAdminDivisions();
    loadAdminServices();
}

function setupLogoListeners() {
    const logos = document.querySelectorAll('.clickable-logo');
    logos.forEach(logo => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showAdminLogin();
        });
    });
}

function setupTabSwitching() {
    loginTabBtn.addEventListener('click', () => {
        loginTabBtn.classList.add('active');
        registerTabBtn.classList.remove('active');
        clientLoginForm.classList.add('active');
        clientRegisterForm.classList.remove('active');
    });

    registerTabBtn.addEventListener('click', () => {
        registerTabBtn.classList.add('active');
        loginTabBtn.classList.remove('active');
        clientRegisterForm.classList.add('active');
        clientLoginForm.classList.remove('active');
    });
}

function setupPasswordToggles() {
    const toggleLoginPassword = document.getElementById('toggle-login-password');
    const toggleRegisterPassword = document.getElementById('toggle-register-password');
    const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
    const toggleAdminPassword = document.getElementById('toggle-admin-password');

    function togglePasswordVisibility(inputId, icon) {
        const input = document.getElementById(inputId);
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    if (toggleLoginPassword) {
        toggleLoginPassword.addEventListener('click', () => togglePasswordVisibility('login-password', toggleLoginPassword));
    }
    if (toggleRegisterPassword) {
        toggleRegisterPassword.addEventListener('click', () => togglePasswordVisibility('register-password', toggleRegisterPassword));
    }
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', () => togglePasswordVisibility('confirm-password', toggleConfirmPassword));
    }
    if (toggleAdminPassword) {
        toggleAdminPassword.addEventListener('click', () => togglePasswordVisibility('admin-password', toggleAdminPassword));
    }
}

// ============================================
// FUNCIONES DEL CATÁLOGO DE SERVICIOS
// ============================================

function loadServicesCatalog() {
    servicesCatalog.innerHTML = '';
    const sections = [...appData.sections].sort((a, b) => a.order - b.order);
    
    sections.forEach(section => {
        const sectionDivisions = appData.divisions
            .filter(division => division.sectionId === section.id)
            .sort((a, b) => a.order - b.order);
        
        if (sectionDivisions.length === 0) return;
        
        const sectionElement = document.createElement('div');
        sectionElement.className = 'service-section';
        sectionElement.dataset.sectionId = section.id;
        
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.innerHTML = `<h3><i class="${section.icon}"></i> ${section.name}</h3><span class="section-description">${section.description}</span>`;
        sectionElement.appendChild(sectionHeader);
        
        const divisionsContainer = document.createElement('div');
        divisionsContainer.className = 'categories-container';
        
        sectionDivisions.forEach(division => {
            const divisionServices = appData.services
                .filter(service => service.divisionId === division.id)
                .sort((a, b) => a.order - b.order);
            
            if (divisionServices.length === 0) return;
            
            const servicesByType = { individual: [], packages: [] };
            divisionServices.forEach(service => {
                if (service.type === 'package') {
                    servicesByType.packages.push(service);
                } else {
                    servicesByType.individual.push(service);
                }
            });
            
            const divisionElement = document.createElement('div');
            divisionElement.className = 'category';
            
            const divisionHeader = document.createElement('div');
            divisionHeader.className = 'category-header';
            divisionHeader.innerHTML = `<h4>${division.name}</h4>`;
            divisionElement.appendChild(divisionHeader);
            
            if (servicesByType.individual.length > 0) {
                const servicesList = document.createElement('div');
                servicesList.className = 'services-list';
                servicesByType.individual.forEach(service => {
                    const serviceElement = createServiceElement(service, section, division);
                    servicesList.appendChild(serviceElement);
                });
                divisionElement.appendChild(servicesList);
            }
            
            if (servicesByType.packages.length > 0) {
                const packagesContainer = document.createElement('div');
                packagesContainer.className = 'packages-container';
                const packagesTitle = document.createElement('div');
                packagesTitle.className = 'packages-title';
                packagesTitle.innerHTML = `<i class="fas fa-box"></i> Paquetes`;
                packagesContainer.appendChild(packagesTitle);
                const packagesList = document.createElement('div');
                packagesList.className = 'packages-list';
                servicesByType.packages.forEach(service => {
                    const packageElement = createPackageElement(service, section, division);
                    packagesList.appendChild(packageElement);
                });
                packagesContainer.appendChild(packagesList);
                divisionElement.appendChild(packagesContainer);
            }
            
            divisionsContainer.appendChild(divisionElement);
        });
        
        sectionElement.appendChild(divisionsContainer);
        servicesCatalog.appendChild(sectionElement);
    });
}

function createServiceElement(service, section, division) {
    const isSelected = appState.selectedServices.some(s => s.id === service.id);
    const quantityInfo = appState.selectedServices.find(s => s.id === service.id);
    
    const serviceElement = document.createElement('div');
    serviceElement.className = 'service-item';
    serviceElement.innerHTML = `
        <div class="service-info">
            <div class="service-name">${service.name}${service.hasQuantity && quantityInfo ? `<span class="quantity-indicator">${quantityInfo.quantity} ${service.quantityLabel || 'unidades'}</span>` : ''}</div>
            <div class="service-description">${service.description}</div>
        </div>
        <div class="service-price">$${service.price.toLocaleString()}</div>
        <button class="add-service-btn ${isSelected ? 'added' : ''}" data-service-id="${service.id}">${isSelected ? '<i class="fas fa-check"></i>' : '+'}</button>
    `;
    
    const addBtn = serviceElement.querySelector('.add-service-btn');
    addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (service.hasQuantity) {
            showQuantityModal(service, section, division);
        } else {
            toggleServiceSelection(service, section, division, 1);
        }
    });
    
    return serviceElement;
}

function createPackageElement(service, section, division) {
    const isSelected = appState.selectedServices.some(s => s.id === service.id);
    
    const packageElement = document.createElement('div');
    packageElement.className = 'package-item';
    packageElement.innerHTML = `
        <div class="package-header">
            <div class="package-name">${service.name}</div>
            <div class="package-price">$${service.price.toLocaleString()}</div>
        </div>
        <div class="package-description">${service.description}</div>
        <button class="add-package-btn ${isSelected ? 'added' : ''}" data-service-id="${service.id}">${isSelected ? '<i class="fas fa-check"></i> Seleccionado' : '<i class="fas fa-plus"></i> Agregar paquete'}</button>
    `;
    
    const addBtn = packageElement.querySelector('.add-package-btn');
    addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleServiceSelection(service, section, division, 1);
    });
    
    return packageElement;
}

function showQuantityModal(service, section, division) {
    appState.quantityService = service;
    appState.quantityQuantity = 1;
    
    quantityServiceName.textContent = service.name;
    quantityServiceDescription.textContent = service.description;
    quantityUnitPrice.textContent = `$${service.price.toLocaleString()}`;
    quantityInput.value = '1';
    updateQuantityTotal();
    
    quantityModal.classList.remove('hidden');
}

function updateQuantityTotal() {
    if (!appState.quantityService) return;
    const total = appState.quantityService.price * appState.quantityQuantity;
    quantityTotalPrice.textContent = `$${total.toLocaleString()}`;
}

function confirmQuantity() {
    if (!appState.quantityService) return;
    const service = appState.quantityService;
    const section = appData.sections.find(s => s.id === service.sectionId);
    const division = appData.divisions.find(d => d.id === service.divisionId);
    toggleServiceSelection(service, section, division, appState.quantityQuantity);
    quantityModal.classList.add('hidden');
}

function toggleServiceSelection(service, section, division, quantity = 1) {
    const index = appState.selectedServices.findIndex(s => s.id === service.id);
    
    if (index === -1) {
        const sectionObj = appData.sections.find(s => s.id === service.sectionId);
        const divisionObj = appData.divisions.find(d => d.id === service.divisionId);
        
        appState.selectedServices.push({
            ...service,
            quantity: quantity,
            totalPrice: service.price * quantity,
            sectionName: sectionObj ? sectionObj.name : 'Sin sección',
            divisionName: divisionObj ? divisionObj.name : 'Sin división'
        });
    } else {
        appState.selectedServices.splice(index, 1);
    }
    
    updateSelectionSummary();
    loadServicesCatalog();
}

function updateSelectionSummary() {
    selectedServicesList.innerHTML = '';
    
    if (appState.selectedServices.length === 0) {
        selectedServicesList.innerHTML = '<p class="empty-message">No has seleccionado servicios aún.</p>';
        totalAmountDisplay.textContent = '$0';
        return;
    }
    
    let total = 0;
    
    appState.selectedServices.forEach(service => {
        const serviceTotal = service.hasQuantity ? service.totalPrice : service.price;
        total += serviceTotal;
        
        const quantityDisplay = service.hasQuantity ? `<span class="selected-service-quantity">${service.quantity} ${service.quantityLabel || 'unidades'}</span>` : '';
        
        const serviceElement = document.createElement('div');
        serviceElement.className = 'selected-service';
        serviceElement.innerHTML = `
            <div class="selected-service-info">
                <div class="selected-service-name">${service.name}${quantityDisplay}</div>
                <div class="selected-service-section">${service.sectionName} - ${service.divisionName}</div>
            </div>
            <div class="selected-service-price">$${serviceTotal.toLocaleString()}</div>
            <button class="remove-service-btn" data-service-id="${service.id}"><i class="fas fa-times"></i></button>
        `;
        
        const removeBtn = serviceElement.querySelector('.remove-service-btn');
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const idx = appState.selectedServices.findIndex(s => s.id === service.id);
            if (idx !== -1) {
                appState.selectedServices.splice(idx, 1);
                updateSelectionSummary();
                loadServicesCatalog();
            }
        });
        
        selectedServicesList.appendChild(serviceElement);
    });
    
    totalAmountDisplay.textContent = `$${total.toLocaleString()}`;
}

function clearSelection() {
    appState.selectedServices = [];
    updateSelectionSummary();
    loadServicesCatalog();
}

// ============================================
// FUNCIONES DE RECIBOS Y CUESTIONARIO
// ============================================

function generateReceipt() {
    if (appState.selectedServices.length === 0) {
        alert('Por favor, selecciona al menos un servicio para generar un recibo.');
        return;
    }
    
    if (!appState.currentUser) {
        alert('Debes iniciar sesión para generar un recibo.');
        return;
    }
    
    const lastReceipt = appData.receipts[appData.receipts.length - 1];
    const lastFolio = lastReceipt ? parseInt(lastReceipt.folio) : 0;
    const newFolio = (lastFolio + 1).toString().padStart(3, '0');
    
    const total = appState.selectedServices.reduce((sum, service) => {
        return sum + (service.hasQuantity ? service.totalPrice : service.price);
    }, 0);
    
    const receipt = {
        folio: newFolio,
        clientId: appState.currentUser.id,
        clientName: appState.currentUser.name,
        clientCompany: appState.currentUser.company,
        clientPhone: appState.currentUser.phone,
        date: new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        services: appState.selectedServices.map(service => ({
            ...service,
            finalPrice: service.hasQuantity ? service.totalPrice : service.price,
            sectionName: service.sectionName || 'Sin sección',
            divisionName: service.divisionName || 'Sin división'
        })),
        total: total,
        status: 'pendiente'
    };
    
    appState.pendingReceipt = receipt;
    showQuestionnaireModal();
}

function showQuestionnaireModal() {
    questionnaireForm.reset();
    questionnaireModal.classList.remove('hidden');
    
    // Deshabilitar el botón de WhatsApp en el modal de recibo hasta que se complete el cuestionario
    if (sendWhatsappBtn) {
        sendWhatsappBtn.disabled = true;
    }
}

function getQuestionnaireAnswers() {
    const answers = {
        q1: document.querySelector('[name="q1"]')?.value || '',
        q2: document.querySelector('[name="q2"]')?.value || '',
        q3: document.querySelector('[name="q3"]')?.value || '',
        q4: document.querySelector('[name="q4"]')?.value || '',
        q5: document.querySelector('[name="q5"]')?.value || '',
        q6: document.querySelector('[name="q6"]')?.value || '',
        q7: document.querySelector('[name="q7"]')?.value || '',
        q8: document.querySelector('[name="q8"]')?.value || '',
        q9: document.querySelector('[name="q9"]')?.value || '',
        q10: document.querySelector('[name="q10"]')?.value || ''
    };
    return answers;
}

function submitQuestionnaireAndCompleteReceipt() {
    // Validar que todas las preguntas estén respondidas
    const answers = getQuestionnaireAnswers();
    const emptyFields = Object.entries(answers).filter(([key, value]) => !value.trim());
    
    if (emptyFields.length > 0) {
        alert('Por favor, responde todas las preguntas antes de continuar.');
        return;
    }
    
    // Guardar las respuestas en el recibo
    if (appState.pendingReceipt) {
        appState.pendingReceipt.questionnaireAnswers = answers;
        
        // Guardar el recibo en los datos
        appData.receipts.push(appState.pendingReceipt);
        saveData();
        
        // Actualizar cliente
        const clientIndex = appData.clients.findIndex(c => c.id === appState.currentUser.id);
        if (clientIndex !== -1) {
            if (!appData.clients[clientIndex].receipts) {
                appData.clients[clientIndex].receipts = [];
            }
            appData.clients[clientIndex].receipts.push(appState.pendingReceipt.folio);
        }
        
        appState.currentReceipt = appState.pendingReceipt;
        appState.pendingReceipt = null;
        
        // Cerrar modal de cuestionario
        questionnaireModal.classList.add('hidden');
        
        // Mostrar recibo y habilitar botón de WhatsApp
        showReceiptModalWithQuestionnaire();
    }
}

function showReceiptModalWithQuestionnaire() {
    if (!appState.currentReceipt) return;
    
    const receipt = appState.currentReceipt;
    const answers = receipt.questionnaireAnswers || {};
    
    const receiptPreview = document.getElementById('receipt-preview');
    receiptPreview.innerHTML = `
        <div class="receipt-header">
            <img src="Recurso 5.png" alt="Affinity Logo" class="receipt-logo clickable-logo">
            <h2 class="receipt-title">Affinity - Estudio Creativo</h2>
            <p class="receipt-subtitle">Recibo de Servicios Profesionales</p>
        </div>
        
        <div class="receipt-details">
            <div class="receipt-detail"><span class="receipt-detail-label">Folio:</span><span class="receipt-detail-value">${receipt.folio}</span></div>
            <div class="receipt-detail"><span class="receipt-detail-label">Fecha:</span><span class="receipt-detail-value">${receipt.date}</span></div>
            <div class="receipt-detail"><span class="receipt-detail-label">Cliente:</span><span class="receipt-detail-value">${receipt.clientName}</span></div>
            <div class="receipt-detail"><span class="receipt-detail-label">Empresa:</span><span class="receipt-detail-value">${receipt.clientCompany || 'No especificada'}</span></div>
            <div class="receipt-detail"><span class="receipt-detail-label">Teléfono:</span><span class="receipt-detail-value">${receipt.clientPhone || 'No especificado'}</span></div>
            <div class="receipt-detail"><span class="receipt-detail-label">Estado:</span><span class="receipt-detail-value">${receipt.status}</span></div>
        </div>
        
        <div class="receipt-services">
            <h4>Servicios Contratados</h4>
            <div class="receipt-services-list">
                ${receipt.services.map(service => `
                    <div class="receipt-service-item">
                        <div class="receipt-service-info">
                            <span class="receipt-service-name">${service.name}${service.hasQuantity ? `<span class="receipt-service-quantity">${service.quantity} ${service.quantityLabel || 'unidades'}</span>` : ''}</span>
                            <small class="receipt-service-category">${service.sectionName} - ${service.divisionName}</small>
                        </div>
                        <span class="receipt-service-price">$${service.finalPrice.toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="receipt-total">
            <span class="receipt-total-label">Total a Pagar:</span>
            <span class="receipt-total-amount">$${receipt.total.toLocaleString()}</span>
        </div>
        
        <!-- CUESTIONARIO DE MARCA -->
        <div class="receipt-questionnaire" style="margin-top: 25px; padding: 20px; background-color: var(--item-bg); border-radius: 10px; border: 2px solid var(--accent-color);">
            <h4 style="color: var(--accent-color); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-clipboard-list"></i> Cuestionario de Marca
            </h4>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);"><strong>1. Nombre de la marca y significado:</strong><br>${answers.q1 || 'No especificado'}</div>
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);"><strong>2. ¿A qué se dedica la empresa?</strong><br>${answers.q2 || 'No especificado'}</div>
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);"><strong>3. Misión, visión o propósito:</strong><br>${answers.q3 || 'No especificado'}</div>
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);"><strong>4. Público objetivo:</strong><br>${answers.q4 || 'No especificado'}</div>
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);"><strong>5. Valores de la marca:</strong><br>${answers.q5 || 'No especificado'}</div>
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);"><strong>6. Percepción deseada:</strong><br>${answers.q6 || 'No especificado'}</div>
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);"><strong>7. Colores preferidos/evitar:</strong><br>${answers.q7 || 'No especificado'}</div>
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);"><strong>8. Estilo de marca:</strong><br>${answers.q8 || 'No especificado'}</div>
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);"><strong>9. Uso principal de la marca:</strong><br>${answers.q9 || 'No especificado'}</div>
                <div style="padding: 8px 0;"><strong>10. Referencias de marcas:</strong><br>${answers.q10 || 'No especificado'}</div>
            </div>
        </div>
        
        <!-- DATOS DE PAGO -->
        <div class="receipt-payment-info" style="margin-top: 25px; padding: 20px; background-color: var(--item-bg); border-radius: 10px; border: 2px solid var(--primary-color);">
            <h4 style="color: var(--accent-color); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-credit-card"></i> Datos para realizar tu pago
            </h4>
            <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);"><span style="color: var(--gray-color);">No. de Cuenta:</span><span style="color: var(--light-color); font-family: monospace;">125 436 0160</span></div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);"><span style="color: var(--gray-color);">CLABE:</span><span style="color: var(--light-color); font-family: monospace;">0 723 490 125 436 0160 1</span></div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);"><span style="color: var(--gray-color);">BANORTE:</span><span style="color: var(--light-color); font-family: monospace;">4189 1430 9543 4232</span></div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;"><span style="color: var(--gray-color);">Beneficiario:</span><span style="color: var(--light-color);">Edgar Benjamin Zamores Esparza</span></div>
            </div>
            <p style="margin-top: 15px; color: var(--accent-color); font-size: 13px; text-align: center;"><i class="fas fa-info-circle"></i> Una vez realizado el pago, comparte tu comprobante por este medio</p>
        </div>
        
        <div class="receipt-footer" style="margin-top: 20px; text-align: center; color: var(--gray-color);">
            <p><small>Este recibo es generado automáticamente por el sistema de Affinity Estudio Creativo.</small></p>
            <p><small>Para cualquier aclaración, contactar a: info@affinity.com</small></p>
        </div>
    `;
    
    // Habilitar el botón de WhatsApp
    if (sendWhatsappBtn) {
        sendWhatsappBtn.disabled = false;
    }
    
    const receiptLogo = receiptPreview.querySelector('.receipt-logo');
    if (receiptLogo) {
        receiptLogo.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showAdminLogin();
        });
    }
    
    receiptModal.classList.remove('hidden');
}

// ============================================
// FUNCIÓN DE WHATSAPP CON CUESTIONARIO
// ============================================

function sendReceiptViaWhatsApp() {
    if (!appState.currentReceipt) {
        alert('No hay recibo para enviar.');
        return;
    }
    
    const receipt = appState.currentReceipt;
    const answers = receipt.questionnaireAnswers || {};
    
    let message = `*SOLICITUD DE SERVICIOS - Affinity Estudio Creativo*%0A%0A`;
    message += `*Cliente:* ${receipt.clientName}%0A`;
    message += `*Empresa:* ${receipt.clientCompany || 'No especificada'}%0A`;
    message += `*Teléfono:* ${receipt.clientPhone || 'No especificado'}%0A`;
    message += `*Folio:* ${receipt.folio}%0A`;
    message += `*Fecha:* ${receipt.date}%0A%0A`;
    message += `*Servicios solicitados:*%0A`;
    
    receipt.services.slice(0, 10).forEach((service, index) => {
        message += `${index + 1}. ${service.name}`;
        if (service.hasQuantity) {
            message += ` (${service.quantity} ${service.quantityLabel || 'unidades'})`;
        }
        message += ` - $${service.finalPrice.toLocaleString()}%0A`;
    });
    
    if (receipt.services.length > 10) {
        message += `... y ${receipt.services.length - 10} servicios más%0A`;
    }
    
    message += `%0A*Total:* $${receipt.total.toLocaleString()}%0A%0A`;
    
    // AGREGAR CUESTIONARIO DE MARCA
    message += `*=== CUESTIONARIO DE MARCA ===*%0A%0A`;
    message += `1. *Nombre de la marca y significado:*%0A${answers.q1 || 'No especificado'}%0A%0A`;
    message += `2. *¿A qué se dedica la empresa?*%0A${answers.q2 || 'No especificado'}%0A%0A`;
    message += `3. *Misión, visión o propósito:*%0A${answers.q3 || 'No especificado'}%0A%0A`;
    message += `4. *Público objetivo:*%0A${answers.q4 || 'No especificado'}%0A%0A`;
    message += `5. *Valores de la marca:*%0A${answers.q5 || 'No especificado'}%0A%0A`;
    message += `6. *Percepción deseada:*%0A${answers.q6 || 'No especificado'}%0A%0A`;
    message += `7. *Colores preferidos/evitar:*%0A${answers.q7 || 'No especificado'}%0A%0A`;
    message += `8. *Estilo de marca:*%0A${answers.q8 || 'No especificado'}%0A%0A`;
    message += `9. *Uso principal de la marca:*%0A${answers.q9 || 'No especificado'}%0A%0A`;
    message += `10. *Referencias de marca:*%0A${answers.q10 || 'No especificado'}%0A%0A`;
    
    // DATOS DE PAGO
    message += `*DATOS PARA REALIZAR TU PAGO:*%0A`;
    message += `No. de Cuenta: 125 436 0160%0A`;
    message += `CLABE: 0 723 490 125 436 0160 1%0A`;
    message += `BANORTE: 4189 1430 9543 4232%0A`;
    message += `Beneficiario: Edgar Benjamin Zamores Esparza%0A%0A`;
    
    message += `¡Hola! Soy ${receipt.clientName} y solicito estos servicios. Adjunto mis respuestas al cuestionario de marca. Por favor confírmame disponibilidad y detalles de pago.`;
    
    const whatsappUrl = `https://wa.me/5214759514738?text=${message}`;
    
    try {
        const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            const link = document.createElement('a');
            link.href = whatsappUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                if (link.parentNode) document.body.removeChild(link);
            }, 100);
            setTimeout(() => {
                if (!document.hasFocus()) {
                    alert('WhatsApp no se pudo abrir automáticamente. Por favor, copia el mensaje manualmente.');
                }
            }, 500);
        }
    } catch (error) {
        console.error('Error al abrir WhatsApp:', error);
        try {
            window.location.href = whatsappUrl;
        } catch (e) {
            alert(`No se pudo abrir WhatsApp automáticamente. Por favor, copia este enlace:\n\n${whatsappUrl}`);
        }
    }
}

// ============================================
// FUNCIONES DEL PANEL DE ADMINISTRADOR
// ============================================

function loadAdminClients() {
    const clientsTableBody = document.getElementById('clients-table-body');
    clientsTableBody.innerHTML = '';
    
    appData.clients.forEach(client => {
        const clientReceipts = appData.receipts.filter(r => r.clientId === client.id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.id}</td><td>${client.name}</td><td>${client.company || 'N/A'}</td>
            <td>${client.phone || 'N/A'}</td><td>${client.email}</td>
            <td>${client.registrationDate}</td><td>${clientReceipts.length}</td>
            <td class="table-actions">
                <button class="table-action-btn edit" data-client-id="${client.id}"><i class="fas fa-edit"></i></button>
                <button class="table-action-btn delete" data-client-id="${client.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        clientsTableBody.appendChild(row);
    });
    
    document.querySelectorAll('.table-action-btn.edit[data-client-id]').forEach(btn => {
        btn.addEventListener('click', () => editClient(parseInt(btn.dataset.clientId)));
    });
    document.querySelectorAll('.table-action-btn.delete[data-client-id]').forEach(btn => {
        btn.addEventListener('click', () => deleteClient(parseInt(btn.dataset.clientId)));
    });
}

function loadAdminReceipts() {
    const receiptsTableBody = document.getElementById('receipts-table-body');
    receiptsTableBody.innerHTML = '';
    
    appData.receipts.forEach(receipt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${receipt.folio}</td><td>${receipt.clientName}</td><td>${receipt.clientCompany || 'N/A'}</td>
            <td>${receipt.date}</td><td>${receipt.services.length} servicios</td>
            <td>$${receipt.total.toLocaleString()}</td>
            <td class="table-actions">
                <button class="table-action-btn edit" data-receipt-folio="${receipt.folio}"><i class="fas fa-eye"></i></button>
                <button class="table-action-btn delete" data-receipt-folio="${receipt.folio}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        receiptsTableBody.appendChild(row);
    });
    
    document.querySelectorAll('.table-action-btn.edit[data-receipt-folio]').forEach(btn => {
        btn.addEventListener('click', () => viewReceipt(btn.dataset.receiptFolio));
    });
    document.querySelectorAll('.table-action-btn.delete[data-receipt-folio]').forEach(btn => {
        btn.addEventListener('click', () => deleteReceipt(btn.dataset.receiptFolio));
    });
}

function loadAdminSections() {
    const sectionsList = document.getElementById('sections-list');
    sectionsList.innerHTML = '';
    const sortedSections = [...appData.sections].sort((a, b) => a.order - b.order);
    
    sortedSections.forEach(section => {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'editable-item';
        sectionElement.innerHTML = `
            <div class="editable-item-header">
                <div class="editable-item-icon"><i class="${section.icon}"></i></div>
                <div class="editable-item-info"><h4>${section.name}</h4><p>${section.description} | Orden: ${section.order}</p></div>
            </div>
            <div class="editable-item-actions"><button class="btn-primary edit-section" data-section-id="${section.id}"><i class="fas fa-edit"></i> Editar</button></div>
        `;
        sectionsList.appendChild(sectionElement);
    });
    
    document.querySelectorAll('.edit-section').forEach(btn => {
        btn.addEventListener('click', () => editSection(parseInt(btn.dataset.sectionId)));
    });
}

function loadAdminDivisions() {
    const divisionsList = document.getElementById('divisions-list');
    divisionsList.innerHTML = '';
    const sortedDivisions = [...appData.divisions].sort((a, b) => a.order - b.order);
    
    sortedDivisions.forEach(division => {
        const section = appData.sections.find(s => s.id === division.sectionId);
        const sectionName = section ? section.name : 'Sin sección';
        const divisionElement = document.createElement('div');
        divisionElement.className = 'editable-item';
        divisionElement.innerHTML = `
            <div class="editable-item-header">
                <div class="editable-item-icon"><i class="fas fa-layer-group"></i></div>
                <div class="editable-item-info"><h4>${division.name}</h4><p>${sectionName} | ${division.description} | Orden: ${division.order}</p></div>
            </div>
            <div class="editable-item-actions"><button class="btn-primary edit-division" data-division-id="${division.id}"><i class="fas fa-edit"></i> Editar</button></div>
        `;
        divisionsList.appendChild(divisionElement);
    });
    
    document.querySelectorAll('.edit-division').forEach(btn => {
        btn.addEventListener('click', () => editDivision(parseInt(btn.dataset.divisionId)));
    });
}

function loadAdminServices() {
    const servicesList = document.getElementById('services-list');
    servicesList.innerHTML = '';
    const sortedServices = [...appData.services].sort((a, b) => a.order - b.order);
    
    sortedServices.forEach(service => {
        const section = appData.sections.find(s => s.id === service.sectionId);
        const division = appData.divisions.find(d => d.id === service.divisionId);
        const sectionName = section ? section.name : 'Sin sección';
        const divisionName = division ? division.name : 'Sin división';
        const serviceElement = document.createElement('div');
        serviceElement.className = 'editable-item';
        serviceElement.innerHTML = `
            <div class="editable-item-header">
                <div class="editable-item-icon"><i class="fas ${service.type === 'package' ? 'fa-box' : 'fa-star'}"></i></div>
                <div class="editable-item-info">
                    <h4>${service.name}</h4>
                    <p>${sectionName} | ${divisionName} | $${service.price} | Orden: ${service.order}</p>
                    <p><small>${service.description}</small></p>
                    ${service.hasQuantity ? `<p><small><i class="fas fa-calculator"></i> Servicio por cantidad: ${service.quantityLabel || 'unidades'}</small></p>` : ''}
                </div>
            </div>
            <div class="editable-item-actions"><button class="btn-primary edit-service" data-service-id="${service.id}"><i class="fas fa-edit"></i> Editar</button></div>
        `;
        servicesList.appendChild(serviceElement);
    });
    
    document.querySelectorAll('.edit-service').forEach(btn => {
        btn.addEventListener('click', () => editService(parseInt(btn.dataset.serviceId)));
    });
}

function setupAdminTabs() {
    const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
    const adminTabPanes = document.querySelectorAll('.admin-tab-pane');
    
    adminTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            adminTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            adminTabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `${tabId}-tab`) pane.classList.add('active');
            });
        });
    });
}

function editClient(clientId) {
    const client = appData.clients.find(c => c.id === clientId);
    if (!client) return;
    appState.editingItem = client;
    appState.editingType = 'client';
    showEditModal('Cliente', [
        { name: 'name', label: 'Nombre', type: 'text', value: client.name },
        { name: 'company', label: 'Empresa', type: 'text', value: client.company || '' },
        { name: 'phone', label: 'Teléfono', type: 'tel', value: client.phone || '' },
        { name: 'email', label: 'Correo Electrónico', type: 'email', value: client.email },
        { name: 'password', label: 'Contraseña', type: 'password', value: client.password }
    ]);
}

function editSection(sectionId) {
    const section = appData.sections.find(s => s.id === sectionId);
    if (!section) return;
    appState.editingItem = section;
    appState.editingType = 'section';
    showEditModal('Sección', [
        { name: 'name', label: 'Nombre', type: 'text', value: section.name },
        { name: 'icon', label: 'Icono (clase FontAwesome)', type: 'text', value: section.icon },
        { name: 'description', label: 'Descripción', type: 'text', value: section.description },
        { name: 'order', label: 'Orden', type: 'number', value: section.order }
    ]);
}

function editDivision(divisionId) {
    const division = appData.divisions.find(d => d.id === divisionId);
    if (!division) return;
    appState.editingItem = division;
    appState.editingType = 'division';
    const sectionOptions = appData.sections.map(s => `<option value="${s.id}" ${s.id === division.sectionId ? 'selected' : ''}>${s.name}</option>`).join('');
    showEditModal('División', [
        { name: 'name', label: 'Nombre', type: 'text', value: division.name },
        { name: 'description', label: 'Descripción', type: 'text', value: division.description },
        { name: 'sectionId', label: 'Sección', type: 'select', value: division.sectionId, options: sectionOptions },
        { name: 'order', label: 'Orden', type: 'number', value: division.order }
    ]);
}

function editService(serviceId) {
    const service = appData.services.find(s => s.id === serviceId);
    if (!service) return;
    appState.editingItem = service;
    appState.editingType = 'service';
    const sectionOptions = appData.sections.map(s => `<option value="${s.id}" ${s.id === service.sectionId ? 'selected' : ''}>${s.name}</option>`).join('');
    const divisionOptions = appData.divisions.filter(d => d.sectionId === service.sectionId).map(d => `<option value="${d.id}" ${d.id === service.divisionId ? 'selected' : ''}>${d.name}</option>`).join('');
    showEditModal('Servicio', [
        { name: 'name', label: 'Nombre', type: 'text', value: service.name },
        { name: 'description', label: 'Descripción', type: 'textarea', value: service.description },
        { name: 'price', label: 'Precio unitario ($)', type: 'number', value: service.price },
        { name: 'sectionId', label: 'Sección', type: 'select', value: service.sectionId, options: sectionOptions },
        { name: 'divisionId', label: 'División', type: 'select', value: service.divisionId, options: divisionOptions },
        { name: 'type', label: 'Tipo', type: 'select', value: service.type, options: '<option value="individual">Individual</option><option value="package">Paquete</option>' },
        { name: 'hasQuantity', label: '¿Permitir cantidad?', type: 'checkbox', value: service.hasQuantity || false },
        { name: 'quantityLabel', label: 'Etiqueta para cantidad', type: 'text', value: service.quantityLabel || '' },
        { name: 'order', label: 'Orden', type: 'number', value: service.order }
    ]);
}

function viewReceipt(folio) {
    const receipt = appData.receipts.find(r => r.folio === folio);
    if (!receipt) return;
    appState.currentReceipt = receipt;
    showReceiptModalWithQuestionnaire();
}

function deleteClient(clientId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;
    const index = appData.clients.findIndex(c => c.id === clientId);
    if (index !== -1) {
        appData.clients.splice(index, 1);
        saveData();
        loadAdminClients();
    }
}

function deleteReceipt(folio) {
    if (!confirm('¿Estás seguro de que deseas eliminar este recibo?')) return;
    const index = appData.receipts.findIndex(r => r.folio === folio);
    if (index !== -1) {
        appData.receipts.splice(index, 1);
        saveData();
        loadAdminReceipts();
    }
}

function showEditModal(title, fields) {
    const editModalTitle = document.getElementById('edit-modal-title');
    const editForm = document.getElementById('edit-form');
    editModalTitle.textContent = `Editar ${title}`;
    editForm.innerHTML = '';
    
    fields.forEach(field => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        let inputHtml = '';
        if (field.type === 'select') {
            inputHtml = `<label for="edit-${field.name}">${field.label}</label><select id="edit-${field.name}" name="${field.name}" required>${field.options || ''}</select>`;
        } else if (field.type === 'checkbox') {
            const isChecked = field.value ? 'checked' : '';
            inputHtml = `<div class="checkbox-container"><input type="checkbox" id="edit-${field.name}" name="${field.name}" ${isChecked}><label for="edit-${field.name}">${field.label}</label></div>`;
        } else if (field.type === 'textarea') {
            inputHtml = `<label for="edit-${field.name}">${field.label}</label><textarea id="edit-${field.name}" name="${field.name}" rows="3" required>${field.value}</textarea>`;
        } else {
            inputHtml = `<label for="edit-${field.name}">${field.label}</label><input type="${field.type}" id="edit-${field.name}" name="${field.name}" value="${field.value}" required>`;
        }
        formGroup.innerHTML = inputHtml;
        editForm.appendChild(formGroup);
    });
    
    if (appState.editingItem.id) {
        deleteItemBtn.classList.remove('hidden');
    } else {
        deleteItemBtn.classList.add('hidden');
    }
    
    editModal.classList.remove('hidden');
}

async function saveEdit() {
    if (!appState.editingItem || !appState.editingType) return;
    const form = document.getElementById('edit-form');
    const formData = new FormData(form);
    const updatedItem = { ...appState.editingItem };
    
    for (const [key, value] of formData.entries()) {
        if (key === 'price' || key === 'order' || key === 'sectionId' || key === 'divisionId') {
            updatedItem[key] = parseInt(value) || 0;
        } else if (key === 'hasQuantity') {
            updatedItem[key] = value === 'on';
        } else {
            updatedItem[key] = value;
        }
    }
    
    if (updatedItem.hasQuantity && !updatedItem.quantityLabel) updatedItem.quantityLabel = 'unidades';
    
    let dataArray;
    switch (appState.editingType) {
        case 'client': dataArray = appData.clients; break;
        case 'section': dataArray = appData.sections; break;
        case 'division': dataArray = appData.divisions; break;
        case 'service': dataArray = appData.services; break;
        default: return;
    }
    
    const index = dataArray.findIndex(item => item.id === updatedItem.id);
    if (index !== -1) {
        dataArray[index] = updatedItem;
    } else {
        updatedItem.id = Date.now();
        dataArray.push(updatedItem);
    }
    
    await saveData();
    
    switch (appState.editingType) {
        case 'client': loadAdminClients(); break;
        case 'section': loadAdminSections(); loadServicesCatalog(); break;
        case 'division': loadAdminDivisions(); loadServicesCatalog(); break;
        case 'service': loadAdminServices(); loadServicesCatalog(); break;
    }
    
    editModal.classList.add('hidden');
    appState.editingItem = null;
    appState.editingType = null;
}

async function deleteItem() {
    if (!appState.editingItem || !appState.editingType) return;
    if (!confirm('¿Estás seguro de que deseas eliminar este elemento?')) return;
    
    let dataArray;
    switch (appState.editingType) {
        case 'client': dataArray = appData.clients; break;
        case 'section':
            dataArray = appData.sections;
            const sectionDivisions = appData.divisions.filter(d => d.sectionId === appState.editingItem.id);
            const sectionServices = appData.services.filter(s => s.sectionId === appState.editingItem.id);
            if (sectionDivisions.length > 0 || sectionServices.length > 0) {
                alert('No se puede eliminar esta sección porque tiene divisiones o servicios asociados.');
                return;
            }
            break;
        case 'division':
            dataArray = appData.divisions;
            const divisionServices = appData.services.filter(s => s.divisionId === appState.editingItem.id);
            if (divisionServices.length > 0) {
                alert('No se puede eliminar esta división porque tiene servicios asociados.');
                return;
            }
            break;
        case 'service': dataArray = appData.services; break;
        default: return;
    }
    
    const index = dataArray.findIndex(item => item.id === appState.editingItem.id);
    if (index !== -1) {
        dataArray.splice(index, 1);
        await saveData();
        switch (appState.editingType) {
            case 'client': loadAdminClients(); break;
            case 'section': loadAdminSections(); loadServicesCatalog(); break;
            case 'division': loadAdminDivisions(); loadServicesCatalog(); break;
            case 'service': loadAdminServices(); loadServicesCatalog(); break;
        }
    }
    
    editModal.classList.add('hidden');
    appState.editingItem = null;
    appState.editingType = null;
}

// ============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ============================================

async function initApp() {
    await loadData();
    setupEventListeners();
    setupLogoListeners();
    setupTabSwitching();
    setupPasswordToggles();
    setupAdminTabs();
    
    const savedUser = sessionStorage.getItem('affinityCurrentUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            if (user.email) {
                const client = appData.clients.find(c => c.email === user.email);
                if (client && client.password === user.password) {
                    appState.currentUser = client;
                    showClientPanel();
                }
            }
        } catch (error) {
            console.error('Error al cargar usuario guardado:', error);
        }
    }
    
    const savedAdmin = sessionStorage.getItem('affinityAdmin');
    if (savedAdmin) {
        try {
            const admin = JSON.parse(savedAdmin);
            const validAdmin = appData.admins.find(a => a.username === admin.username && a.password === admin.password);
            if (validAdmin) {
                appState.isAdmin = true;
                appState.currentUser = { name: 'Administrador', isAdmin: true };
                showAdminPanel();
            }
        } catch (error) {
            console.error('Error al cargar admin:', error);
        }
    }
}

function setupEventListeners() {
    // Registro de cliente
    clientRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const company = document.getElementById('register-company').value;
        const phone = document.getElementById('register-phone').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        
        const result = await registerClient(name, company, phone, email, password);
        if (result.success) {
            appState.currentUser = result.client;
            sessionStorage.setItem('affinityCurrentUser', JSON.stringify(result.client));
            showClientPanel();
            alert('¡Registro exitoso! Bienvenido a Affinity.');
        } else {
            alert(result.message);
        }
    });

    // Login de cliente
    clientLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const result = loginClient(email, password);
        if (result.success) {
            appState.currentUser = result.client;
            sessionStorage.setItem('affinityCurrentUser', JSON.stringify(result.client));
            showClientPanel();
        } else {
            alert(result.message);
        }
    });

    // Login de administrador
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const result = loginAdmin(username, password);
        if (result.success) {
            appState.isAdmin = true;
            appState.currentUser = { name: 'Administrador', isAdmin: true };
            sessionStorage.setItem('affinityAdmin', JSON.stringify(result.admin));
            showAdminPanel();
            adminLoginModal.classList.add('hidden');
        } else {
            alert(result.message);
        }
    });

    // Cerrar modales
    closeAdminModalBtn.addEventListener('click', () => adminLoginModal.classList.add('hidden'));
    closeReceiptModalBtn.addEventListener('click', () => receiptModal.classList.add('hidden'));
    closeEditModalBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
        appState.editingItem = null;
        appState.editingType = null;
    });
    closeQuantityModalBtn.addEventListener('click', () => {
        quantityModal.classList.add('hidden');
        appState.quantityService = null;
    });
    closeQuestionnaireModalBtn.addEventListener('click', () => {
        questionnaireModal.classList.add('hidden');
        appState.pendingReceipt = null;
    });
    cancelEditBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
        appState.editingItem = null;
        appState.editingType = null;
    });
    cancelQuantityBtn.addEventListener('click', () => {
        quantityModal.classList.add('hidden');
        appState.quantityService = null;
    });
    cancelQuestionnaireBtn.addEventListener('click', () => {
        questionnaireModal.classList.add('hidden');
        appState.pendingReceipt = null;
    });

    // Cerrar sesión
    clientLogoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('affinityCurrentUser');
        logout();
    });
    adminLogoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('affinityAdmin');
        logout();
    });

    // Volver al panel de cliente
    backToClientBtn.addEventListener('click', () => {
        if (appState.currentUser && !appState.currentUser.isAdmin) {
            showClientPanel();
        } else {
            showClientLogin();
        }
    });

    // Generar recibo
    generateReceiptBtn.addEventListener('click', generateReceipt);
    
    // Enviar recibo por WhatsApp (ahora se habilita después del cuestionario)
    sendWhatsappBtn.addEventListener('click', sendReceiptViaWhatsApp);
    
    // Enviar cuestionario
    submitQuestionnaireBtn.addEventListener('click', submitQuestionnaireAndCompleteReceipt);

    // Limpiar selección
    clearSelectionBtn.addEventListener('click', clearSelection);

    // Guardar cambios en edición
    saveEditBtn.addEventListener('click', saveEdit);
    deleteItemBtn.addEventListener('click', deleteItem);

    // Agregar nuevos elementos
    addSectionBtn.addEventListener('click', () => {
        appState.editingItem = {};
        appState.editingType = 'section';
        showEditModal('Sección', [
            { name: 'name', label: 'Nombre', type: 'text', value: '' },
            { name: 'icon', label: 'Icono (clase FontAwesome)', type: 'text', value: 'fas fa-star' },
            { name: 'description', label: 'Descripción', type: 'text', value: '' },
            { name: 'order', label: 'Orden', type: 'number', value: appData.sections.length + 1 }
        ]);
    });

    addDivisionBtn.addEventListener('click', () => {
        appState.editingItem = {};
        appState.editingType = 'division';
        const sectionOptions = appData.sections.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        showEditModal('División', [
            { name: 'name', label: 'Nombre', type: 'text', value: '' },
            { name: 'description', label: 'Descripción', type: 'text', value: '' },
            { name: 'sectionId', label: 'Sección', type: 'select', value: '', options: sectionOptions },
            { name: 'order', label: 'Orden', type: 'number', value: appData.divisions.length + 1 }
        ]);
    });

    addServiceBtn.addEventListener('click', () => {
        appState.editingItem = {};
        appState.editingType = 'service';
        const sectionOptions = appData.sections.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        showEditModal('Servicio', [
            { name: 'name', label: 'Nombre', type: 'text', value: '' },
            { name: 'description', label: 'Descripción', type: 'textarea', value: '' },
            { name: 'price', label: 'Precio unitario ($)', type: 'number', value: 0 },
            { name: 'sectionId', label: 'Sección', type: 'select', value: '', options: sectionOptions },
            { name: 'divisionId', label: 'División', type: 'select', value: '', options: '<option value="">Selecciona primero una sección</option>' },
            { name: 'type', label: 'Tipo', type: 'select', value: 'individual', options: '<option value="individual">Individual</option><option value="package">Paquete</option>' },
            { name: 'hasQuantity', label: '¿Permitir cantidad?', type: 'checkbox', value: false },
            { name: 'quantityLabel', label: 'Etiqueta para cantidad', type: 'text', value: '' },
            { name: 'order', label: 'Orden', type: 'number', value: appData.services.length + 1 }
        ]);
    });

    // Control de cantidad
    decreaseQuantityBtn.addEventListener('click', () => {
        if (appState.quantityQuantity > 1) {
            appState.quantityQuantity--;
            quantityInput.value = appState.quantityQuantity;
            updateQuantityTotal();
        }
    });
    increaseQuantityBtn.addEventListener('click', () => {
        appState.quantityQuantity++;
        quantityInput.value = appState.quantityQuantity;
        updateQuantityTotal();
    });
    quantityInput.addEventListener('input', () => {
        const value = parseInt(quantityInput.value) || 1;
        if (value < 1) {
            quantityInput.value = 1;
            appState.quantityQuantity = 1;
        } else {
            appState.quantityQuantity = value;
        }
        updateQuantityTotal();
    });
    confirmQuantityBtn.addEventListener('click', confirmQuantity);

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === adminLoginModal) adminLoginModal.classList.add('hidden');
        if (e.target === receiptModal) receiptModal.classList.add('hidden');
        if (e.target === editModal) {
            editModal.classList.add('hidden');
            appState.editingItem = null;
            appState.editingType = null;
        }
        if (e.target === quantityModal) {
            quantityModal.classList.add('hidden');
            appState.quantityService = null;
        }
        if (e.target === questionnaireModal) {
            questionnaireModal.classList.add('hidden');
            appState.pendingReceipt = null;
        }
    });

    // Actualizar opciones de divisiones
    document.addEventListener('change', (e) => {
        if (e.target.id === 'edit-sectionId' && appState.editingType === 'service') {
            const sectionId = parseInt(e.target.value);
            const divisionSelect = document.getElementById('edit-divisionId');
            const divisionOptions = appData.divisions.filter(d => d.sectionId === sectionId).map(d => `<option value="${d.id}">${d.name}</option>`).join('');
            divisionSelect.innerHTML = divisionOptions || '<option value="">No hay divisiones para esta sección</option>';
        }
    });
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', initApp);