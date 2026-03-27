(function () {
  const API = {
    session: './api/admin/session.php',
    login: './api/admin/login.php',
    logout: './api/admin/logout.php',
    bootstrap: './api/admin/bootstrap.php',
    trips: './api/admin/trips.php',
    departures: './api/admin/departures.php',
    settings: './api/admin/settings.php'
  };

  const elements = {
    adminAlert: document.querySelector('#adminAlert'),
    authSection: document.querySelector('#authSection'),
    adminApp: document.querySelector('#adminApp'),
    loginForm: document.querySelector('#loginForm'),
    logoutButton: document.querySelector('#logoutButton'),
    adminUserLabel: document.querySelector('#adminUserLabel'),
    tripForm: document.querySelector('#tripForm'),
    departureForm: document.querySelector('#departureForm'),
    settingsForm: document.querySelector('#settingsForm'),
    departureTripSelect: document.querySelector('#departureTripSelect'),
    tripsTableBody: document.querySelector('#tripsTableBody'),
    departuresTableBody: document.querySelector('#departuresTableBody'),
    bookingsTableBody: document.querySelector('#bookingsTableBody'),
    messagesTableBody: document.querySelector('#messagesTableBody'),
    metricTrips: document.querySelector('#metricTrips'),
    metricDepartures: document.querySelector('#metricDepartures'),
    metricBookings: document.querySelector('#metricBookings'),
    metricMessages: document.querySelector('#metricMessages'),
    resetTripButton: document.querySelector('#resetTripButton'),
    resetDepartureButton: document.querySelector('#resetDepartureButton')
  };

  const state = {
    admin: null,
    trips: [],
    departures: [],
    bookings: [],
    messages: [],
    settings: null
  };

  function currency(value) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
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
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
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
      throw new Error(`Respuesta invalida del servidor (${response.status}). ${fallbackMessage}`);
    }

    if (!response.ok || !data || data.ok === false) {
      throw new Error(data?.error || `Error del servidor (${response.status})`);
    }

    return data;
  }

  function setAlert(message, type) {
    elements.adminAlert.textContent = message;
    elements.adminAlert.style.color = type === 'error' ? '#af3a12' : '#1f7a5a';
  }

  function actionBadge(value) {
    if (value === 'paid' || value === 'confirmed' || value === 'published') {
      return `<span class="pill pill-success">${value}</span>`;
    }
    if (value === 'pending_payment' || value === 'unpaid' || value === 'open') {
      return `<span class="pill pill-warning">${value}</span>`;
    }
    return `<span class="pill pill-muted">${value || 'n/a'}</span>`;
  }

  function renderMetrics() {
    elements.metricTrips.textContent = state.trips.filter((trip) => trip.published).length;
    elements.metricDepartures.textContent = state.departures.filter((departure) => departure.status === 'open').length;
    elements.metricBookings.textContent = state.bookings.filter((booking) => booking.payment_status !== 'paid').length;
    elements.metricMessages.textContent = state.messages.filter((message) => message.status === 'new').length;
  }

  function renderTripOptions() {
    const options = state.trips
      .map((trip) => `<option value="${trip.id}">${trip.title} · ${trip.destination}</option>`)
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
            <td><strong>${trip.title}</strong><br /><small>${trip.slug}</small></td>
            <td>${trip.destination}</td>
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
            <td><strong>${departure.trip?.title || 'Viaje'}</strong><br /><small>${departure.trip?.destination || ''}</small></td>
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

  function renderBookingsTable() {
    if (!state.bookings.length) {
      elements.bookingsTableBody.innerHTML = '<tr><td colspan="5">Sin reservas.</td></tr>';
      return;
    }

    elements.bookingsTableBody.innerHTML = state.bookings
      .map(
        (booking) => `
          <tr>
            <td><strong>${booking.customer_name}</strong><br /><small>${booking.customer_email}<br />${booking.customer_phone || ''}</small></td>
            <td>${booking.trip_title_snapshot || 'Viaje'}<br /><small>${friendlyDate(booking.departure_date_snapshot)}</small></td>
            <td>${booking.seats_reserved}</td>
            <td>${currency(booking.total_amount)}</td>
            <td>${actionBadge(booking.payment_status)}</td>
          </tr>
        `
      )
      .join('');
  }

  function renderMessagesTable() {
    if (!state.messages.length) {
      elements.messagesTableBody.innerHTML = '<tr><td colspan="3">Sin mensajes.</td></tr>';
      return;
    }

    elements.messagesTableBody.innerHTML = state.messages
      .map(
        (message) => `
          <tr>
            <td><strong>${message.full_name}</strong><br />${actionBadge(message.status)}</td>
            <td>${message.email}<br />${message.phone || 'Sin telefono'}</td>
            <td>${message.message}</td>
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function refreshAndRender(successMessage) {
    const data = await request(API.bootstrap, { method: 'GET' });
    state.settings = data.settings;
    state.trips = data.trips || [];
    state.departures = data.departures || [];
    state.bookings = data.bookings || [];
    state.messages = data.messages || [];
    renderMetrics();
    renderTripOptions();
    renderTripsTable();
    renderDeparturesTable();
    renderBookingsTable();
    renderMessagesTable();
    fillSettingsForm();
    setAlert(successMessage || 'Dashboard actualizado.');
  }

  async function bootSession() {
    try {
      const data = await request(API.session, { method: 'GET' });
      if (!data.authenticated) {
        state.admin = null;
        elements.authSection.classList.remove('hidden');
        elements.adminApp.classList.add('hidden');
        elements.logoutButton.style.display = 'none';
        elements.adminUserLabel.textContent = 'Sin sesion';
        setAlert('Inicia sesion con tu acceso privado para editar el sitio.');
        return;
      }

      state.admin = data.admin;
      elements.authSection.classList.add('hidden');
      elements.adminApp.classList.remove('hidden');
      elements.logoutButton.style.display = 'inline-flex';
      elements.adminUserLabel.textContent = data.admin?.email || 'Admin';
      await refreshAndRender('Sesion iniciada. Ya puedes administrar paquetes, salidas y mensajes.');
    } catch (error) {
      elements.authSection.classList.remove('hidden');
      elements.adminApp.classList.add('hidden');
      elements.logoutButton.style.display = 'none';
      setAlert(error.message, 'error');
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    const formData = new FormData(elements.loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    setAlert('Validando sesion...');

    try {
      await request(API.login, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      elements.loginForm.reset();
      await bootSession();
    } catch (error) {
      setAlert(error.message, 'error');
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
      chatbot_embed_code: formData.get('chatbot_embed_code') || ''
    };

    setAlert('Guardando configuracion...');

    try {
      await request(API.settings, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await refreshAndRender('Configuracion guardada.');
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

  function bindEvents() {
    elements.loginForm.addEventListener('submit', submitLogin);
    elements.logoutButton.addEventListener('click', async () => {
      try {
        await request(API.logout, { method: 'POST', body: JSON.stringify({ logout: true }) });
        await bootSession();
      } catch (error) {
        setAlert(error.message, 'error');
      }
    });

    elements.tripForm.addEventListener('submit', submitTrip);
    elements.departureForm.addEventListener('submit', submitDeparture);
    elements.settingsForm.addEventListener('submit', submitSettings);
    elements.resetTripButton.addEventListener('click', resetTripForm);
    elements.resetDepartureButton.addEventListener('click', resetDepartureForm);

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
    });
  }

  async function init() {
    bindEvents();
    await bootSession();
  }

  init();
})();
