(function () {
  const config = window.VIAJES_CONFIG || {};
  const apiBaseUrl = String(config.apiBaseUrl || '').replace(/\/+$/, '');
  const tokenStorageKey = 'jr_admin_token';

  function apiUrl(path) {
    return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
  }

  const API = {
    session: apiUrl('/api/admin/session.php'),
    login: apiUrl('/api/admin/login.php'),
    logout: apiUrl('/api/admin/logout.php'),
    bootstrap: apiUrl('/api/admin/bootstrap.php'),
    trips: apiUrl('/api/admin/trips.php'),
    departures: apiUrl('/api/admin/departures.php'),
    settings: apiUrl('/api/admin/settings.php'),
    bookings: apiUrl('/api/admin/bookings.php'),
    messages: apiUrl('/api/admin/messages.php'),
    income: apiUrl('/api/admin/income.php'),
    expenses: apiUrl('/api/admin/expenses.php')
  };

  const elements = {
    adminAlert: document.querySelector('#adminAlert'),
    authSection: document.querySelector('#authSection'),
    adminApp: document.querySelector('#adminApp'),
    adminSidebar: document.querySelector('#adminSidebar'),
    adminSidebarToggle: document.querySelector('#adminSidebarToggle'),
    adminSectionNav: document.querySelector('#adminSectionNav'),
    adminSyncLabel: document.querySelector('#adminSyncLabel'),
    loginForm: document.querySelector('#loginForm'),
    logoutButton: document.querySelector('#logoutButton'),
    adminUserLabel: document.querySelector('#adminUserLabel'),
    tripForm: document.querySelector('#tripForm'),
    departureForm: document.querySelector('#departureForm'),
    settingsForm: document.querySelector('#settingsForm'),
    incomeForm: document.querySelector('#incomeForm'),
    expenseForm: document.querySelector('#expenseForm'),
    departureTripSelect: document.querySelector('#departureTripSelect'),
    tripsTableBody: document.querySelector('#tripsTableBody'),
    departuresTableBody: document.querySelector('#departuresTableBody'),
    bookingsTableBody: document.querySelector('#bookingsTableBody'),
    messagesTableBody: document.querySelector('#messagesTableBody'),
    incomeTableBody: document.querySelector('#incomeTableBody'),
    expenseTableBody: document.querySelector('#expenseTableBody'),
    visitsTableBody: document.querySelector('#visitsTableBody'),
    incomeSummaryTableBody: document.querySelector('#incomeSummaryTableBody'),
    metricTrips: document.querySelector('#metricTrips'),
    metricDepartures: document.querySelector('#metricDepartures'),
    metricBookings: document.querySelector('#metricBookings'),
    metricMessages: document.querySelector('#metricMessages'),
    metricIncome: document.querySelector('#metricIncome'),
    resetTripButton: document.querySelector('#resetTripButton'),
    resetDepartureButton: document.querySelector('#resetDepartureButton'),
    resetIncomeButton: document.querySelector('#resetIncomeButton'),
    resetExpenseButton: document.querySelector('#resetExpenseButton'),
    scrollTopButton: document.querySelector('#scrollTopButton')
  };

  const state = {
    admin: null,
    trips: [],
    departures: [],
    bookings: [],
    messages: [],
    incomeEntries: [],
    expenseEntries: [],
    siteVisits: [],
    incomeSummary: [],
    settings: null,
    activeSectionId: 'section-viajes',
    autoRefreshTimer: null,
    refreshInFlight: false
  };

  function defaultHomepageContent() {
    return {
      meta: {
        title: 'Jalisco Rutas | Viajes y rutas turisticas desde Guadalajara',
        description: 'Vende viajes y rutas turisticas desde Guadalajara con catalogo vivo, reservas por WhatsApp y panel administrable.'
      },
      navigation: {
        brand_subtitle: 'Experiencias turisticas en Jalisco',
        links: [
          { label: 'Tours', href: '#salidas' },
          { label: 'Colecciones', href: '#colecciones' },
          { label: 'Por que elegirnos', href: '#porque' },
          { label: 'FAQ', href: '#faq' },
          { label: 'Contacto', href: '#contacto' }
        ],
        cta_label: 'Cotizar ahora',
        cta_href: '#contacto'
      },
      hero: {
        eyebrow: 'Tours en Jalisco',
        primary_cta_label: 'Ver tours disponibles',
        primary_cta_href: '#salidas',
        secondary_cta_label: 'Hablar por WhatsApp',
        facts: [
          { title: 'Salidas nuevas', text: 'Cada mes puedes cambiar rutas, fechas y precios sin tocar codigo.' },
          { title: 'Ventas directas', text: 'Formulario, chatbot y WhatsApp listos para convertir interes en reserva.' },
          { title: 'Enfoque local', text: 'Contenido orientado a clientes de Guadalajara, Zapopan y toda la ZMG.' }
        ]
      },
      featured: {
        label: 'Experiencias destacadas',
        title: 'Rutas listas para vender',
        link_label: 'Ver todas',
        link_href: '#salidas',
        empty_title: 'Cargando tours',
        empty_text: 'Estamos preparando la portada comercial.'
      },
      runtime: {
        visitor_intro: 'Eres el cliente numero {count} en entrar a nuestra red.',
        visitor_outro: 'Esperamos llevarte a un lugar interesante y ayudarte a encontrar el viaje ideal para tu proxima aventura.',
        fallback_message: 'Explora nuestras rutas y dejate sorprender. Estamos listos para ayudarte a encontrar una experiencia inolvidable.'
      },
      trust_strip: {
        items: [
          { value: '50+', text: 'Salidas potenciales al ano entre rutas, experiencias y escapadas.' },
          { value: 'Cupo visible', text: 'Urgencia comercial real para que la gente reserve antes de que se llene.' },
          { value: 'Soporte rapido', text: 'WhatsApp, formulario y espacio para chatbot comercial embebido.' },
          { value: 'Panel editable', text: 'Publica, pausa y cambia salidas desde tu dashboard administrativo.' }
        ]
      },
      collections: {
        label: 'Colecciones comerciales',
        title: 'Organiza tu oferta como una agencia que siempre tiene algo nuevo',
        description: 'La referencia que compartiste trabaja muy bien el efecto de abundancia. Aqui dejamos una estructura pensada para vender rutas clasicas, premium y escapadas de fin de semana.',
        items: [
          { number: '01', title: 'Clasicos de Jalisco', text: 'Tequila, Chapala, Ajijic, centro historico y pueblos magicos con alta demanda continua.' },
          { number: '02', title: 'Experiencias premium', text: 'Tren, catas, helicoptero, globo, gastronomia o recorridos privados de mayor ticket.' },
          { number: '03', title: 'Salidas mensuales', text: 'Rutas nuevas, temporadas especiales y viajes de oportunidad para redes y campanas semanales.' }
        ]
      },
      catalog: {
        label: 'Catalogo activo',
        title: 'Proximas salidas y rutas disponibles',
        description: 'Cada salida muestra fecha, punto de encuentro, precio estimado y disponibilidad. Todo sale de Supabase cuando conectes tus datos.',
        empty_title: 'Cargando experiencias',
        empty_text: 'Estamos preparando las proximas rutas disponibles para tu audiencia.',
        loading_summary: 'cargando catalogo'
      },
      proof: {
        label: 'Confianza',
        title: 'Un layout pensado para convertir como un sitio de tours consolidado',
        score_label: 'Recomendaciones',
        score_value: '4.9 / 5',
        score_text: 'Presenta reputacion, opiniones y claridad visual para reducir friccion en la compra.',
        testimonials: [
          {
            quote: 'La estructura da sensacion de agencia real: muchos tours, contacto directo, confianza y llamados claros para reservar.',
            author: 'Enfoque ideal para vender desde redes'
          },
          {
            quote: 'En movil el usuario puede ver tours, precio, cupo y CTA sin perderse. Esa parte la vamos a cuidar al maximo.',
            author: 'Diseno responsivo primero'
          }
        ]
      },
      workflow: {
        label: 'Como apartan tus clientes',
        title: 'Un flujo directo para vender por semana',
        items: [
          { number: '1', title: 'Publicas el tour', text: 'Creas el viaje, eliges fecha, cupo, punto de salida, precio y texto comercial desde el dashboard.' },
          { number: '2', title: 'El cliente aparta', text: 'Ve la salida, deja sus datos y pasa a WhatsApp para cerrar la reserva contigo.' },
          { number: '3', title: 'Tu confirmas y llenas cupo', text: 'Revisas reservas y mensajes desde el panel para dar seguimiento rapido.' }
        ]
      },
      faq: {
        label: 'Preguntas frecuentes',
        title: 'La informacion clave antes de reservar',
        items: [
          { question: 'Desde donde salen los viajes?', answer: 'El sitio esta pensado para operar salidas desde Guadalajara y toda la Zona Metropolitana.', open: true },
          { question: 'Puedo actualizar tours cada mes sin tocar codigo?', answer: 'Si. El dashboard administra viajes, salidas, cupos, textos del sitio y datos de contacto.', open: false },
          { question: 'Como se aparta un viaje?', answer: 'El cliente deja sus datos, la reserva queda registrada y se le dirige a WhatsApp para confirmar el cierre contigo.', open: false },
          { question: 'El sitio ya esta pensado para celular?', answer: 'Si. Esta version prioriza lectura, botones y tarjetas para que funcione muy bien en movil.', open: false }
        ]
      },
      contact: {
        label: 'Contacto directo',
        title: 'Recibe solicitudes incluso cuando no estas conectado',
        description: 'Este formulario guarda mensajes en la base para seguimiento comercial. Tambien dejas salida rapida a WhatsApp para cerrar reservas de forma inmediata.',
        points: [
          { type: 'link', label: 'Ver tours disponibles', href: '#salidas' },
          { type: 'phone', label: '' },
          { type: 'whatsapp', label: 'Atencion por WhatsApp' }
        ],
        form_title: 'Solicita informacion o cotizacion',
        name_label: 'Nombre',
        name_placeholder: 'Tu nombre completo',
        email_label: 'Correo',
        email_placeholder: 'tu@correo.com',
        phone_label: 'Telefono',
        phone_placeholder: '33 1234 5678',
        message_label: 'Mensaje',
        message_placeholder: 'Que ruta te interesa, cuantas personas viajan y para que fecha?',
        submit_label: 'Enviar mensaje'
      },
      footer: {
        description: 'Sitio preparado para vender viajes, rutas y experiencias turisticas desde Guadalajara.',
        links: [
          { label: 'Tours', href: '#salidas' },
          { label: 'Contacto', href: '#contacto' }
        ]
      }
    };
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeObject(value) {
    if (isPlainObject(value)) {
      return value;
    }

    if (!value) {
      return {};
    }

    try {
      const parsed = JSON.parse(value);
      return isPlainObject(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function parseJsonObjectStrict(value) {
    const rawValue = String(value || '').trim();
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue);
    if (!isPlainObject(parsed)) {
      throw new Error('El contenido dinamico debe ser un objeto JSON valido.');
    }

    return parsed;
  }

  function deepMerge(base, override) {
    if (Array.isArray(base)) {
      return Array.isArray(override) ? override : cloneValue(base);
    }

    if (!isPlainObject(base)) {
      return override === undefined ? base : override;
    }

    const result = { ...base };
    const source = isPlainObject(override) ? override : {};

    Object.keys(source).forEach((key) => {
      const baseValue = base[key];
      const overrideValue = source[key];

      if (Array.isArray(baseValue)) {
        result[key] = Array.isArray(overrideValue) ? overrideValue : cloneValue(baseValue);
        return;
      }

      if (isPlainObject(baseValue)) {
        result[key] = deepMerge(baseValue, overrideValue);
        return;
      }

      result[key] = overrideValue === undefined || overrideValue === null ? baseValue : overrideValue;
    });

    return result;
  }

  function normalizeSettings(settings) {
    if (!settings) {
      return null;
    }

    return {
      ...settings,
      homepage_content: deepMerge(defaultHomepageContent(), normalizeObject(settings.homepage_content))
    };
  }

  function getAdminToken() {
    try {
      return window.localStorage.getItem(tokenStorageKey);
    } catch (error) {
      return null;
    }
  }

  function setAdminToken(token) {
    try {
      if (token) {
        window.localStorage.setItem(tokenStorageKey, token);
      } else {
        window.localStorage.removeItem(tokenStorageKey);
      }
    } catch (error) {
      // noop
    }
  }

  function currency(value) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function friendlyDate(dateValue) {
    if (!dateValue) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(`${dateValue}T12:00:00`));
  }

  function friendlyDateTime(dateValue) {
    if (!dateValue) {
      return 'Sin dato';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateValue));
  }

  function friendlyMonth(monthKey) {
    if (!monthKey) {
      return 'Mes';
    }

    return new Intl.DateTimeFormat('es-MX', {
      month: 'long',
      year: 'numeric'
    }).format(new Date(`${monthKey}-01T12:00:00`));
  }

  function parseCsv(value) {
    return String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async function request(url, options = {}) {
    const adminToken = getAdminToken();
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        ...(options.headers || {})
      },
      ...options
    });

    const rawText = await response.text();
    let data = null;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (error) {
      const compactText = rawText.replace(/\s+/g, ' ').trim().slice(0, 220);
      const fallbackMessage = compactText || `El servidor respondio con estado ${response.status}`;
      throw new Error(`${url}: respuesta invalida (${response.status}). ${fallbackMessage}`);
    }

    if (!response.ok || !data || data.ok === false) {
      throw new Error(data?.error ? `${url}: ${data.error}` : `${url}: error del servidor (${response.status})`);
    }

    return data;
  }

  function setAlert(message, type) {
    elements.adminAlert.textContent = message;
    elements.adminAlert.style.color = type === 'error' ? '#af3a12' : '#1f7a5a';
  }

  function showAuthScreen(message, type) {
    state.admin = null;
    elements.authSection.classList.remove('hidden');
    elements.adminApp.classList.add('hidden');
    elements.logoutButton.style.display = 'none';
    elements.adminUserLabel.textContent = 'Sin sesion';
    setAlert(message || 'Inicia sesion con tu acceso privado para editar el sitio.', type);
  }

  function showAdminScreen(admin) {
    state.admin = admin || null;
    elements.authSection.classList.add('hidden');
    elements.adminApp.classList.remove('hidden');
    elements.logoutButton.style.display = 'inline-flex';
    elements.adminUserLabel.textContent = admin?.email || 'Admin';
    setSyncStatus('Actualizacion automatica activa');
  }

  function actionBadge(value) {
    if (value === 'paid' || value === 'confirmed' || value === 'published' || value === 'contacted') {
      return `<span class="pill pill-success">${value}</span>`;
    }
    if (value === 'pending_payment' || value === 'unpaid' || value === 'open' || value === 'new') {
      return `<span class="pill pill-warning">${value}</span>`;
    }
    if (value === 'refunded' || value === 'closed') {
      return `<span class="pill pill-muted">${value}</span>`;
    }
    return `<span class="pill pill-muted">${value || 'n/a'}</span>`;
  }

  function pendingBookingsCount() {
    return state.bookings.filter((booking) => {
      const status = String(booking.status || '');
      const paymentStatus = String(booking.payment_status || '');

      if (status === 'cancelled' || status === 'confirmed' || status === 'refunded') {
        return false;
      }

      return status === 'pending_payment' || paymentStatus === 'unpaid';
    }).length;
  }

  function setSyncStatus(message, variant = 'ok') {
    if (!elements.adminSyncLabel) {
      return;
    }

    elements.adminSyncLabel.textContent = message;
    elements.adminSyncLabel.classList.remove('admin-sync-updating', 'admin-sync-ok');
    elements.adminSyncLabel.classList.add(variant === 'updating' ? 'admin-sync-updating' : 'admin-sync-ok');
  }

  function renderMetrics() {
    elements.metricTrips.textContent = state.trips.filter((trip) => trip.published).length;
    elements.metricDepartures.textContent = state.departures.filter((departure) => departure.status === 'open').length;
    elements.metricBookings.textContent = pendingBookingsCount();
    elements.metricMessages.textContent = state.messages.filter((message) => message.status === 'new').length;

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const currentMonthSummary = state.incomeSummary.find((item) => item.month_key === currentMonthKey);
    elements.metricIncome.textContent = currency(currentMonthSummary?.received_total || 0);
  }

  function renderTripOptions() {
    const options = state.trips
      .map((trip) => `<option value="${trip.id}">${escapeHtml(trip.title)} · ${escapeHtml(trip.destination)}</option>`)
      .join('');
    elements.departureTripSelect.innerHTML = `<option value="">Selecciona un viaje</option>${options}`;
  }

  function renderTripsTable() {
    if (!state.trips.length) {
      elements.tripsTableBody.innerHTML = '<tr><td colspan="5">Sin viajes registrados.</td></tr>';
      return;
    }

    elements.tripsTableBody.innerHTML = state.trips
      .map(
        (trip) => `
          <tr>
            <td><strong>${escapeHtml(trip.title)}</strong><br /><small>${escapeHtml(trip.slug)}</small></td>
            <td>${escapeHtml(trip.destination)}</td>
            <td>${currency(trip.price)}</td>
            <td>${trip.published ? actionBadge('published') : actionBadge('draft')}</td>
            <td>
              <button class="action-link" type="button" data-action="edit-trip" data-id="${trip.id}">Editar</button>
              <button class="action-link" type="button" data-action="delete-trip" data-id="${trip.id}">Eliminar</button>
            </td>
          </tr>
        `
      )
      .join('');
  }

  function renderDeparturesTable() {
    if (!state.departures.length) {
      elements.departuresTableBody.innerHTML = '<tr><td colspan="5">Sin salidas registradas.</td></tr>';
      return;
    }

    elements.departuresTableBody.innerHTML = state.departures
      .map((departure) => {
        const finalPrice = departure.promo_price || departure.trip?.price || 0;
        const available = Math.max((departure.capacity || 0) - (departure.booked_count || 0), 0);
        return `
          <tr>
            <td><strong>${escapeHtml(departure.trip?.title || 'Viaje')}</strong><br /><small>${escapeHtml(departure.trip?.destination || '')}</small></td>
            <td>${friendlyDate(departure.departure_date)}</td>
            <td>${available} disponibles de ${departure.capacity}</td>
            <td>${currency(finalPrice)}</td>
            <td>
              <button class="action-link" type="button" data-action="edit-departure" data-id="${departure.id}">Editar</button>
              <button class="action-link" type="button" data-action="delete-departure" data-id="${departure.id}">Eliminar</button>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  function renderIncomeTable() {
    if (!state.incomeEntries.length) {
      elements.incomeTableBody.innerHTML = '<tr><td colspan="5">Sin ingresos registrados.</td></tr>';
      return;
    }

    elements.incomeTableBody.innerHTML = state.incomeEntries
      .map((entry) => {
        const isManual = entry.source_type === 'manual';
        return `
          <tr>
            <td>
              <strong>${escapeHtml(entry.concept)}</strong><br />
              <small>${escapeHtml(entry.category || 'General')}${entry.customer_name ? ` · ${escapeHtml(entry.customer_name)}` : ''}</small>
              ${
                entry.payment_method || entry.reference_code
                  ? `<br /><small>${escapeHtml(entry.payment_method || 'Metodo sin definir')}${entry.reference_code ? ` · Ref. ${escapeHtml(entry.reference_code)}` : ''}</small>`
                  : ''
              }
              ${entry.notes ? `<span class="admin-note"><strong>Notas:</strong> ${escapeHtml(entry.notes)}</span>` : ''}
              <span class="pill pill-muted income-source">${entry.source_type === 'booking' ? 'auto' : 'manual'}</span>
            </td>
            <td>${friendlyDate(entry.payment_date)}${entry.due_date ? `<br /><small>Vence: ${friendlyDate(entry.due_date)}</small>` : ''}</td>
            <td>${currency(entry.amount)}</td>
            <td>${actionBadge(entry.status)}</td>
            <td>
              ${isManual ? `<button class="action-link" type="button" data-action="edit-income" data-id="${entry.id}">Editar</button><br />` : ''}
              ${isManual ? `<button class="action-link" type="button" data-action="delete-income" data-id="${entry.id}">Eliminar</button>` : '<span class="pill pill-muted">Ligado a reserva</span>'}
            </td>
          </tr>
        `;
      })
      .join('');
  }

  function renderIncomeSummary() {
    if (!state.incomeSummary.length) {
      elements.incomeSummaryTableBody.innerHTML = '<tr><td colspan="7">Sin resumen disponible.</td></tr>';
      return;
    }

    elements.incomeSummaryTableBody.innerHTML = state.incomeSummary
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(friendlyMonth(item.month_key))}</td>
            <td>${currency(item.received_total)}</td>
            <td>${currency(item.expense_total)}</td>
            <td>${currency(item.net_total)}</td>
            <td>${currency(item.pending_total)}</td>
            <td>${currency(item.refunded_total)}</td>
            <td>${item.entries_count}</td>
          </tr>
        `
      )
      .join('');
  }

  function renderExpenseTable() {
    if (!state.expenseEntries.length) {
      elements.expenseTableBody.innerHTML = '<tr><td colspan="5">Sin gastos registrados.</td></tr>';
      return;
    }

    elements.expenseTableBody.innerHTML = state.expenseEntries
      .map(
        (entry) => `
          <tr>
            <td>
              <strong>${escapeHtml(entry.concept)}</strong><br />
              <small>${escapeHtml(entry.category || 'Operacion')}${entry.vendor_name ? ` · ${escapeHtml(entry.vendor_name)}` : ''}</small>
              ${
                entry.payment_method || entry.reference_code
                  ? `<br /><small>${escapeHtml(entry.payment_method || 'Metodo sin definir')}${entry.reference_code ? ` · Ref. ${escapeHtml(entry.reference_code)}` : ''}</small>`
                  : ''
              }
              ${entry.notes ? `<span class="admin-note"><strong>Notas:</strong> ${escapeHtml(entry.notes)}</span>` : ''}
            </td>
            <td>${friendlyDate(entry.expense_date)}${entry.due_date ? `<br /><small>Vence: ${friendlyDate(entry.due_date)}</small>` : ''}</td>
            <td>${currency(entry.amount)}</td>
            <td>${actionBadge(entry.status)}</td>
            <td>
              <button class="action-link" type="button" data-action="edit-expense" data-id="${entry.id}">Editar</button><br />
              <button class="action-link" type="button" data-action="delete-expense" data-id="${entry.id}">Eliminar</button>
            </td>
          </tr>
        `
      )
      .join('');
  }

  function renderVisitsTable() {
    if (!state.siteVisits.length) {
      elements.visitsTableBody.innerHTML = '<tr><td colspan="4">Sin registros de visita.</td></tr>';
      return;
    }

    elements.visitsTableBody.innerHTML = state.siteVisits
      .map(
        (visit) => `
          <tr>
            <td>
              <strong>Cliente #${visit.id}</strong><br />
              <small>${visit.visit_count} acceso${visit.visit_count === 1 ? '' : 's'} registrados</small>
            </td>
            <td>
              <strong>${escapeHtml(visit.device_type || 'Dispositivo')}</strong><br />
              <small>${escapeHtml(visit.browser_name || 'Navegador')} · ${escapeHtml(visit.os_name || 'Sistema')}</small>
            </td>
            <td>
              <small>IP: ${escapeHtml(visit.ip_address || 'No disponible')}</small><br />
              <small>Token: ${escapeHtml(String(visit.visitor_token || '').slice(0, 18))}${String(visit.visitor_token || '').length > 18 ? '...' : ''}</small>
            </td>
            <td>
              <small>Primera vez: ${escapeHtml(friendlyDateTime(visit.first_seen_at))}</small><br />
              <small>Ultima vez: ${escapeHtml(friendlyDateTime(visit.last_seen_at))}</small>
            </td>
          </tr>
        `
      )
      .join('');
  }

  function bookingActionsTemplate(booking) {
    const actions = [];

    if (booking.payment_status !== 'paid' && booking.status !== 'cancelled') {
      actions.push(
        `<button class="action-link" type="button" data-action="mark-booking-paid" data-id="${booking.id}">Marcar pagada</button>`
      );
      actions.push(
        `<button class="action-link" type="button" data-action="cancel-booking" data-id="${booking.id}">Cancelar</button>`
      );
    }

    if (booking.payment_status === 'paid') {
      actions.push(
        `<button class="action-link" type="button" data-action="refund-booking" data-id="${booking.id}">Reembolsar</button>`
      );
    }

    return actions.length ? actions.join('<br />') : '<span class="pill pill-muted">Sin acciones</span>';
  }

  function messageActionsTemplate(message) {
    const actions = [];

    actions.push(
      `<button class="action-link" type="button" data-action="message-note" data-id="${message.id}">Notas</button>`
    );

    if (message.status === 'new') {
      actions.push(
        `<button class="action-link" type="button" data-action="message-contacted" data-id="${message.id}">Marcar visto</button>`
      );
    }

    if (message.status !== 'closed') {
      actions.push(
        `<button class="action-link" type="button" data-action="message-closed" data-id="${message.id}">Cerrar</button>`
      );
    }

    if (message.status === 'closed') {
      actions.push(
        `<button class="action-link" type="button" data-action="message-reopen" data-id="${message.id}">Reabrir</button>`
      );
    }

    return actions.join('<br />');
  }

  function renderBookingsTable() {
    if (!state.bookings.length) {
      elements.bookingsTableBody.innerHTML = '<tr><td colspan="6">Sin reservas.</td></tr>';
      return;
    }

    elements.bookingsTableBody.innerHTML = state.bookings
      .map(
        (booking) => `
          <tr>
            <td><strong>${escapeHtml(booking.customer_name)}</strong><br /><small>${escapeHtml(booking.customer_email)}<br />${escapeHtml(booking.customer_phone || '')}</small></td>
            <td>${escapeHtml(booking.trip_title_snapshot || 'Viaje')}<br /><small>${friendlyDate(booking.departure_date_snapshot)}</small></td>
            <td>${booking.seats_reserved}</td>
            <td>${currency(booking.total_amount)}</td>
            <td>${actionBadge(booking.status)}<br />${actionBadge(booking.payment_status)}</td>
            <td>${bookingActionsTemplate(booking)}</td>
          </tr>
        `
      )
      .join('');
  }

  function renderMessagesTable() {
    if (!state.messages.length) {
      elements.messagesTableBody.innerHTML = '<tr><td colspan="4">Sin mensajes.</td></tr>';
      return;
    }

    elements.messagesTableBody.innerHTML = state.messages
      .map(
        (message) => `
          <tr>
            <td><strong>${escapeHtml(message.full_name)}</strong><br />${actionBadge(message.status)}</td>
            <td>${escapeHtml(message.email)}<br />${escapeHtml(message.phone || 'Sin telefono')}</td>
            <td>
              ${escapeHtml(message.message)}
              ${message.admin_notes ? `<span class="admin-note"><strong>Notas:</strong> ${escapeHtml(message.admin_notes)}</span>` : ''}
            </td>
            <td>${messageActionsTemplate(message)}</td>
          </tr>
        `
      )
      .join('');
  }

  function fillSettingsForm() {
    if (!state.settings) {
      return;
    }

    elements.settingsForm.company_name.value = state.settings.company_name || '';
    elements.settingsForm.hero_badge.value = state.settings.hero_badge || '';
    elements.settingsForm.hero_title.value = state.settings.hero_title || '';
    elements.settingsForm.hero_subtitle.value = state.settings.hero_subtitle || '';
    elements.settingsForm.support_email.value = state.settings.support_email || '';
    elements.settingsForm.support_phone.value = state.settings.support_phone || '';
    elements.settingsForm.whatsapp_number.value = state.settings.whatsapp_number || '';
    elements.settingsForm.whatsapp_message.value = state.settings.whatsapp_message || '';
    elements.settingsForm.chatbot_enabled.checked = Boolean(state.settings.chatbot_enabled);
    elements.settingsForm.chatbot_embed_code.value = state.settings.chatbot_embed_code || '';
    elements.settingsForm.homepage_content_json.value = JSON.stringify(
      state.settings.homepage_content || defaultHomepageContent(),
      null,
      2
    );
  }

  function applyDashboardData(data, options = {}) {
    const { hydrateSettings = false, resetIncomeDraft = false } = options;

    state.settings = normalizeSettings(data.settings);
    state.trips = data.trips || [];
    state.departures = data.departures || [];
    state.bookings = data.bookings || [];
    state.messages = data.messages || [];
    state.incomeEntries = data.income_entries || [];
    state.expenseEntries = data.expense_entries || [];
    state.siteVisits = data.site_visits || [];
    state.incomeSummary = data.income_summary || [];
    renderMetrics();
    renderTripOptions();
    renderTripsTable();
    renderDeparturesTable();
    renderBookingsTable();
    renderMessagesTable();
    renderIncomeTable();
    renderExpenseTable();
    renderVisitsTable();
    renderIncomeSummary();

    if (hydrateSettings) {
      fillSettingsForm();
    }

    if (resetIncomeDraft) {
      resetIncomeForm();
      resetExpenseForm();
    }
  }

  function sectionButtons() {
    return Array.from(elements.adminSectionNav?.querySelectorAll('[data-section-target]') || []);
  }

  function sectionPanels() {
    return Array.from(document.querySelectorAll('[data-admin-section]'));
  }

  function activateSection(sectionId, options = {}) {
    const { scroll = false } = options;
    state.activeSectionId = sectionId || state.activeSectionId;

    sectionButtons().forEach((button) => {
      button.classList.toggle('is-active', button.dataset.sectionTarget === state.activeSectionId);
    });

    sectionPanels().forEach((panel) => {
      panel.classList.toggle('is-active', panel.id === state.activeSectionId);
    });

    if (scroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function resetTripForm() {
    elements.tripForm.reset();
    elements.tripForm.trip_id.value = '';
    elements.tripForm.published.checked = true;
  }

  function resetDepartureForm() {
    elements.departureForm.reset();
    elements.departureForm.departure_id.value = '';
    elements.departureForm.booked_count.value = 0;
    elements.departureForm.status.value = 'open';
  }

  function resetIncomeForm() {
    if (!elements.incomeForm) {
      return;
    }

    elements.incomeForm.reset();
    elements.incomeForm.income_id.value = '';
    elements.incomeForm.status.value = 'received';
    elements.incomeForm.payment_date.value = new Date().toISOString().slice(0, 10);
  }

  function resetExpenseForm() {
    if (!elements.expenseForm) {
      return;
    }

    elements.expenseForm.reset();
    elements.expenseForm.expense_id.value = '';
    elements.expenseForm.status.value = 'paid';
    elements.expenseForm.expense_date.value = new Date().toISOString().slice(0, 10);
  }

  function fillTripForm(tripId) {
    const trip = state.trips.find((item) => String(item.id) === String(tripId));
    if (!trip) {
      return;
    }

    elements.tripForm.trip_id.value = trip.id;
    elements.tripForm.title.value = trip.title || '';
    elements.tripForm.slug.value = trip.slug || '';
    elements.tripForm.destination.value = trip.destination || '';
    elements.tripForm.meeting_point.value = trip.meeting_point || '';
    elements.tripForm.duration_text.value = trip.duration_text || '';
    elements.tripForm.price.value = trip.price || '';
    elements.tripForm.hero_image_url.value = trip.hero_image_url || '';
    elements.tripForm.short_description.value = trip.short_description || '';
    elements.tripForm.description.value = trip.description || '';
    elements.tripForm.includes_csv.value = (trip.includes || []).join(', ');
    elements.tripForm.itinerary_csv.value = (trip.itinerary || []).join(', ');
    elements.tripForm.tags_csv.value = (trip.tags || []).join(', ');
    elements.tripForm.featured.checked = Boolean(trip.featured);
    elements.tripForm.published.checked = Boolean(trip.published);
    activateSection('section-viajes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fillDepartureForm(departureId) {
    const departure = state.departures.find((item) => String(item.id) === String(departureId));
    if (!departure) {
      return;
    }

    elements.departureForm.departure_id.value = departure.id;
    elements.departureForm.trip_id.value = departure.trip_id;
    elements.departureForm.departure_date.value = departure.departure_date || '';
    elements.departureForm.return_date.value = departure.return_date || '';
    elements.departureForm.capacity.value = departure.capacity || 0;
    elements.departureForm.booked_count.value = departure.booked_count || 0;
    elements.departureForm.promo_price.value = departure.promo_price || '';
    elements.departureForm.status.value = departure.status || 'open';
    elements.departureForm.notes.value = departure.notes || '';
    activateSection('section-salidas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fillIncomeForm(incomeId) {
    const income = state.incomeEntries.find((item) => String(item.id) === String(incomeId));
    if (!income || income.source_type !== 'manual') {
      return;
    }

    elements.incomeForm.income_id.value = income.id;
    elements.incomeForm.concept.value = income.concept || '';
    elements.incomeForm.category.value = income.category || '';
    elements.incomeForm.customer_name.value = income.customer_name || '';
    elements.incomeForm.amount.value = income.amount || '';
    elements.incomeForm.status.value = income.status || 'received';
    elements.incomeForm.payment_date.value = income.payment_date || '';
    elements.incomeForm.due_date.value = income.due_date || '';
    elements.incomeForm.payment_method.value = income.payment_method || '';
    elements.incomeForm.reference_code.value = income.reference_code || '';
    elements.incomeForm.notes.value = income.notes || '';
    activateSection('section-ingreso-mensual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fillExpenseForm(expenseId) {
    const expense = state.expenseEntries.find((item) => String(item.id) === String(expenseId));
    if (!expense) {
      return;
    }

    elements.expenseForm.expense_id.value = expense.id;
    elements.expenseForm.concept.value = expense.concept || '';
    elements.expenseForm.category.value = expense.category || '';
    elements.expenseForm.vendor_name.value = expense.vendor_name || '';
    elements.expenseForm.amount.value = expense.amount || '';
    elements.expenseForm.status.value = expense.status || 'paid';
    elements.expenseForm.expense_date.value = expense.expense_date || '';
    elements.expenseForm.due_date.value = expense.due_date || '';
    elements.expenseForm.payment_method.value = expense.payment_method || '';
    elements.expenseForm.reference_code.value = expense.reference_code || '';
    elements.expenseForm.notes.value = expense.notes || '';
    activateSection('section-gastos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function loadDashboard(options = {}) {
    const {
      successMessage = '',
      showAlert = false,
      hydrateSettings = false,
      resetIncomeDraft = false,
      silent = false
    } = options;

    if (state.refreshInFlight) {
      return;
    }

    state.refreshInFlight = true;
    if (silent) {
      setSyncStatus('Sincronizando...', 'updating');
    }

    try {
      const data = await request(API.bootstrap, { method: 'GET' });
      applyDashboardData(data, { hydrateSettings, resetIncomeDraft });
      activateSection(state.activeSectionId);

      if (showAlert) {
        setAlert(successMessage || 'Dashboard actualizado.');
      }

      if (silent) {
        const timeLabel = new Intl.DateTimeFormat('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date());
        setSyncStatus(`Actualizado ${timeLabel}`);
      }
    } finally {
      state.refreshInFlight = false;
    }
  }

  async function refreshAndRender(successMessage, options = {}) {
    await loadDashboard({
      successMessage,
      showAlert: true,
      hydrateSettings: Boolean(options.hydrateSettings),
      resetIncomeDraft: Boolean(options.resetIncomeDraft)
    });
  }

  async function bootSession() {
    const storedToken = getAdminToken();

    if (storedToken) {
      try {
        showAdminScreen({ email: 'Administrador' });
        await loadDashboard({
          successMessage: 'Sesion iniciada. Ya puedes administrar paquetes, salidas y mensajes.',
          showAlert: true,
          hydrateSettings: true,
          resetIncomeDraft: true,
          silent: true
        });
        return;
      } catch (error) {
        setAdminToken(null);
      }
    }

    try {
      const data = await request(API.session, { method: 'GET' });
      if (!data.authenticated) {
        setAdminToken(null);
        showAuthScreen('Inicia sesion con tu acceso privado para editar el sitio.');
        return;
      }

      showAdminScreen(data.admin);
      await refreshAndRender('Sesion iniciada. Ya puedes administrar paquetes, salidas y mensajes.', {
        hydrateSettings: true,
        resetIncomeDraft: true
      });
    } catch (error) {
      showAuthScreen(error.message, 'error');
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    const formData = new FormData(elements.loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    setAlert('Validando sesion...');

    try {
      const response = await request(API.login, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setAdminToken(response.token || null);
      elements.loginForm.reset();
      showAdminScreen(response.admin || { email });
      await refreshAndRender('Sesion iniciada. Ya puedes administrar paquetes, salidas y mensajes.', {
        hydrateSettings: true,
        resetIncomeDraft: true
      });
    } catch (error) {
      setAdminToken(null);
      showAuthScreen(error.message, 'error');
    }
  }

  async function submitTrip(event) {
    event.preventDefault();
    const formData = new FormData(elements.tripForm);
    const payload = {
      id: formData.get('trip_id') || null,
      title: formData.get('title'),
      slug: formData.get('slug') || slugify(formData.get('title')),
      destination: formData.get('destination'),
      meeting_point: formData.get('meeting_point'),
      duration_text: formData.get('duration_text'),
      price: Number(formData.get('price')),
      hero_image_url: formData.get('hero_image_url') || '',
      short_description: formData.get('short_description'),
      description: formData.get('description'),
      includes: parseCsv(formData.get('includes_csv')),
      itinerary: parseCsv(formData.get('itinerary_csv')),
      tags: parseCsv(formData.get('tags_csv')),
      featured: formData.get('featured') === 'on',
      published: formData.get('published') === 'on'
    };

    setAlert('Guardando viaje...');

    try {
      await request(API.trips, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      resetTripForm();
      await refreshAndRender('Viaje guardado correctamente.');
    } catch (error) {
      setAlert(error.message, 'error');
    }
  }

  async function submitDeparture(event) {
    event.preventDefault();
    const formData = new FormData(elements.departureForm);
    const payload = {
      id: formData.get('departure_id') || null,
      trip_id: Number(formData.get('trip_id')),
      departure_date: formData.get('departure_date'),
      return_date: formData.get('return_date') || '',
      capacity: Number(formData.get('capacity')),
      booked_count: Number(formData.get('booked_count')),
      promo_price: formData.get('promo_price') ? Number(formData.get('promo_price')) : '',
      status: formData.get('status'),
      notes: formData.get('notes') || ''
    };

    setAlert('Guardando salida...');

    try {
      await request(API.departures, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      resetDepartureForm();
      await refreshAndRender('Salida guardada correctamente.');
    } catch (error) {
      setAlert(error.message, 'error');
    }
  }

  async function submitSettings(event) {
    event.preventDefault();
    const formData = new FormData(elements.settingsForm);
    let homepageContent = {};

    try {
      homepageContent = parseJsonObjectStrict(formData.get('homepage_content_json'));
    } catch (error) {
      setAlert(error.message || 'El JSON del home no es valido.', 'error');
      return;
    }

    const payload = {
      company_name: formData.get('company_name'),
      hero_badge: formData.get('hero_badge'),
      hero_title: formData.get('hero_title'),
      hero_subtitle: formData.get('hero_subtitle'),
      support_email: formData.get('support_email'),
      support_phone: formData.get('support_phone'),
      whatsapp_number: formData.get('whatsapp_number'),
      whatsapp_message: formData.get('whatsapp_message'),
      chatbot_enabled: formData.get('chatbot_enabled') === 'on',
      chatbot_embed_code: formData.get('chatbot_embed_code') || '',
      homepage_content: homepageContent
    };

    setAlert('Guardando configuracion...');

    try {
      await request(API.settings, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await refreshAndRender('Configuracion guardada.', { hydrateSettings: true });
    } catch (error) {
      setAlert(error.message, 'error');
    }
  }

  async function submitIncome(event) {
    event.preventDefault();
    const formData = new FormData(elements.incomeForm);
    const payload = {
      id: formData.get('income_id') || null,
      concept: formData.get('concept'),
      category: formData.get('category'),
      customer_name: formData.get('customer_name') || '',
      amount: Number(formData.get('amount')),
      status: formData.get('status'),
      payment_date: formData.get('payment_date'),
      due_date: formData.get('due_date') || '',
      payment_method: formData.get('payment_method') || '',
      reference_code: formData.get('reference_code') || '',
      notes: formData.get('notes') || '',
      source_type: 'manual'
    };

    setAlert('Guardando ingreso...');

    try {
      await request(API.income, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      resetIncomeForm();
      await refreshAndRender('Ingreso guardado correctamente.', { resetIncomeDraft: true });
    } catch (error) {
      setAlert(error.message, 'error');
    }
  }

  async function submitExpense(event) {
    event.preventDefault();
    const formData = new FormData(elements.expenseForm);
    const payload = {
      id: formData.get('expense_id') || null,
      concept: formData.get('concept'),
      category: formData.get('category'),
      vendor_name: formData.get('vendor_name') || '',
      amount: Number(formData.get('amount')),
      status: formData.get('status'),
      expense_date: formData.get('expense_date'),
      due_date: formData.get('due_date') || '',
      payment_method: formData.get('payment_method') || '',
      reference_code: formData.get('reference_code') || '',
      notes: formData.get('notes') || ''
    };

    setAlert('Guardando gasto...');

    try {
      await request(API.expenses, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      resetExpenseForm();
      await refreshAndRender('Gasto guardado correctamente.', { resetIncomeDraft: true });
    } catch (error) {
      setAlert(error.message, 'error');
    }
  }

  async function updateBookingStatus(bookingId, action, successMessage) {
    try {
      await request(API.bookings, {
        method: 'POST',
        body: JSON.stringify({ id: bookingId, action })
      });
      await refreshAndRender(successMessage);
    } catch (error) {
      setAlert(error.message, 'error');
    }
  }

  async function updateMessageNote(messageId) {
    const message = state.messages.find((item) => String(item.id) === String(messageId));
    if (!message) {
      return;
    }

    const note = window.prompt('Escribe una nota interna para identificar a este cliente:', message.admin_notes || '');
    if (note === null) {
      return;
    }

    try {
      await request(API.messages, {
        method: 'POST',
        body: JSON.stringify({ id: messageId, admin_notes: note })
      });
      await refreshAndRender('Nota del cliente actualizada.');
    } catch (error) {
      setAlert(error.message, 'error');
    }
  }

  async function removeIncome(incomeId) {
    if (!window.confirm('Eliminar este ingreso manual?')) {
      return;
    }

    try {
      await request(API.income, {
        method: 'DELETE',
        body: JSON.stringify({ id: incomeId })
      });
      await refreshAndRender('Ingreso eliminado.');
    } catch (error) {
      setAlert(error.message, 'error');
    }
  }

  async function removeExpense(expenseId) {
    if (!window.confirm('Eliminar este gasto?')) {
      return;
    }

    try {
      await request(API.expenses, {
        method: 'DELETE',
        body: JSON.stringify({ id: expenseId })
      });
      await refreshAndRender('Gasto eliminado.');
    } catch (error) {
      setAlert(error.message, 'error');
    }
  }

  async function updateMessageStatus(messageId, status, successMessage) {
    try {
      await request(API.messages, {
        method: 'POST',
        body: JSON.stringify({ id: messageId, status })
      });
      await refreshAndRender(successMessage);
    } catch (error) {
      setAlert(error.message, 'error');
    }
  }

  async function removeTrip(tripId) {
    if (!window.confirm('Eliminar este viaje? Tambien se eliminaran sus salidas.')) {
      return;
    }

    try {
      await request(API.trips, {
        method: 'DELETE',
        body: JSON.stringify({ id: tripId })
      });
      await refreshAndRender('Viaje eliminado.');
    } catch (error) {
      setAlert(error.message, 'error');
    }
  }

  async function removeDeparture(departureId) {
    if (!window.confirm('Eliminar esta salida?')) {
      return;
    }

    try {
      await request(API.departures, {
        method: 'DELETE',
        body: JSON.stringify({ id: departureId })
      });
      await refreshAndRender('Salida eliminada.');
    } catch (error) {
      setAlert(error.message, 'error');
    }
  }

  function setupScrollTopButton() {
    if (!elements.scrollTopButton) {
      return;
    }

    const toggleVisibility = () => {
      if (window.scrollY > 280) {
        elements.scrollTopButton.classList.add('is-visible');
      } else {
        elements.scrollTopButton.classList.remove('is-visible');
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    elements.scrollTopButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function setupSectionNavigation() {
    if (!elements.adminSectionNav) {
      return;
    }

    sectionButtons().forEach((button) => {
      button.addEventListener('click', () => {
        activateSection(button.dataset.sectionTarget, { scroll: true });
      });
    });

    elements.adminSidebarToggle?.addEventListener('click', () => {
      elements.adminApp.classList.toggle('is-collapsed');
    });
  }

  function startAutoRefresh() {
    if (state.autoRefreshTimer) {
      window.clearInterval(state.autoRefreshTimer);
    }

    state.autoRefreshTimer = window.setInterval(() => {
      if (!state.admin || document.hidden) {
        return;
      }

      loadDashboard({ silent: true }).catch(() => {
        setSyncStatus('Sincronizacion pendiente', 'updating');
      });
    }, 30000);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && state.admin) {
        loadDashboard({ silent: true }).catch(() => {
          setSyncStatus('Sincronizacion pendiente', 'updating');
        });
      }
    });

    window.addEventListener('focus', () => {
      if (state.admin) {
        loadDashboard({ silent: true }).catch(() => {
          setSyncStatus('Sincronizacion pendiente', 'updating');
        });
      }
    });
  }

  function bindEvents() {
    elements.loginForm.addEventListener('submit', submitLogin);
    elements.logoutButton.addEventListener('click', async () => {
      setAdminToken(null);
      try {
        await request(API.logout, { method: 'POST', body: JSON.stringify({ logout: true }) });
      } catch (error) {
        // noop
      }
      await bootSession();
    });

    elements.tripForm.addEventListener('submit', submitTrip);
    elements.departureForm.addEventListener('submit', submitDeparture);
    elements.settingsForm.addEventListener('submit', submitSettings);
    elements.incomeForm.addEventListener('submit', submitIncome);
    elements.expenseForm.addEventListener('submit', submitExpense);
    elements.resetTripButton.addEventListener('click', resetTripForm);
    elements.resetDepartureButton.addEventListener('click', resetDepartureForm);
    elements.resetIncomeButton.addEventListener('click', resetIncomeForm);
    elements.resetExpenseButton.addEventListener('click', resetExpenseForm);

    document.addEventListener('click', (event) => {
      const actionButton = event.target.closest('[data-action]');
      if (!actionButton) {
        return;
      }

      const { action, id } = actionButton.dataset;

      if (action === 'edit-trip') {
        fillTripForm(id);
      }
      if (action === 'delete-trip') {
        removeTrip(id);
      }
      if (action === 'edit-departure') {
        fillDepartureForm(id);
      }
      if (action === 'delete-departure') {
        removeDeparture(id);
      }
      if (action === 'edit-income') {
        fillIncomeForm(id);
      }
      if (action === 'delete-income') {
        removeIncome(id);
      }
      if (action === 'edit-expense') {
        fillExpenseForm(id);
      }
      if (action === 'delete-expense') {
        removeExpense(id);
      }
      if (action === 'mark-booking-paid') {
        updateBookingStatus(id, 'mark_paid', 'Reserva marcada como pagada y cupo actualizado.');
      }
      if (action === 'cancel-booking') {
        updateBookingStatus(id, 'cancel', 'Reserva cancelada correctamente.');
      }
      if (action === 'refund-booking') {
        updateBookingStatus(id, 'refund', 'Reserva reembolsada y cupo liberado.');
      }
      if (action === 'message-contacted') {
        updateMessageStatus(id, 'contacted', 'Mensaje marcado como visto.');
      }
      if (action === 'message-note') {
        updateMessageNote(id);
      }
      if (action === 'message-closed') {
        updateMessageStatus(id, 'closed', 'Mensaje cerrado.');
      }
      if (action === 'message-reopen') {
        updateMessageStatus(id, 'new', 'Mensaje reabierto.');
      }
    });
  }

  async function init() {
    bindEvents();
    setupScrollTopButton();
    setupSectionNavigation();
    startAutoRefresh();
    await bootSession();
  }

  init();
})();
