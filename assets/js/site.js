(function () {
  const config = window.VIAJES_CONFIG || {};
  const apiBaseUrl = String(config.apiBaseUrl || '').replace(/\/+$/, '');

  function apiUrl(path) {
    return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
  }

  const API = {
    bootstrap: apiUrl('/api/bootstrap.php'),
    contact: apiUrl('/api/contact.php'),
    bookings: apiUrl('/api/bookings.php')
  };

  const demoCatalog = [
    {
      departure_id: 101,
      departure_date: '2026-04-05',
      return_date: '2026-04-05',
      capacity: 18,
      booked_count: 7,
      status: 'open',
      promo_price: 890,
      trip: {
        id: 1,
        slug: 'ruta-tequila-premium',
        title: 'Ruta del Tequila Premium',
        destination: 'Tequila, Jalisco',
        meeting_point: 'Glorieta Minerva, Guadalajara',
        duration_text: '1 dia / 10 horas',
        price: 1090,
        featured: true,
        hero_image_url: '',
        short_description: 'Experiencia con destileria, centro historico y tiempo libre para compras.',
        description: 'Salida ideal para fines de semana con enfoque en viajeros locales que buscan una experiencia rapida, organizada y rentable.',
        includes: ['Transporte redondo', 'Coordinador de viaje', 'Visita guiada', 'Tiempo libre'],
        itinerary: ['Salida desde Guadalajara', 'Llegada a Tequila', 'Recorrido guiado', 'Comida y regreso'],
        tags: ['Fin de semana', 'Parejas', 'Cultura']
      }
    },
    {
      departure_id: 102,
      departure_date: '2026-04-12',
      return_date: '2026-04-12',
      capacity: 20,
      booked_count: 9,
      status: 'open',
      promo_price: 760,
      trip: {
        id: 2,
        slug: 'mazamitla-bosque',
        title: 'Mazamitla y Bosque Encantado',
        destination: 'Mazamitla, Jalisco',
        meeting_point: 'Plaza del Sol, Zapopan',
        duration_text: '1 dia / salida familiar',
        price: 850,
        featured: false,
        hero_image_url: '',
        short_description: 'Ruta relajada para familias y grupos con ambiente de pueblo magico.',
        description: 'Pensado para vender experiencias de escape corto desde la ciudad con enfoque en naturaleza, fotos y convivencia.',
        includes: ['Transporte', 'Paradas turisticas', 'Coordinacion', 'Tiempo libre'],
        itinerary: ['Salida temprano', 'Centro de Mazamitla', 'Bosque y miradores', 'Regreso por la tarde'],
        tags: ['Familiar', 'Naturaleza', 'Pueblo magico']
      }
    },
    {
      departure_id: 103,
      departure_date: '2026-04-19',
      return_date: '2026-04-19',
      capacity: 16,
      booked_count: 4,
      status: 'open',
      promo_price: 690,
      trip: {
        id: 3,
        slug: 'chapala-ajijic-atardecer',
        title: 'Chapala y Ajijic Atardecer',
        destination: 'Chapala y Ajijic',
        meeting_point: 'Forum Tlaquepaque',
        duration_text: '1 dia / paseo panoramico',
        price: 790,
        featured: false,
        hero_image_url: '',
        short_description: 'Paseo turistico perfecto para parejas, grupos pequenos y viajeros casuales.',
        description: 'Una salida de ticket accesible para mover ventas recurrentes y facilitar campanas semanales en redes.',
        includes: ['Traslado', 'Acompanamiento', 'Parada fotografica', 'Tiempo libre'],
        itinerary: ['Salida desde Tlaquepaque', 'Malecon de Chapala', 'Ajijic', 'Atardecer y regreso'],
        tags: ['Accesible', 'Parejas', 'Relax']
      }
    }
  ];

  const elements = {
    runtimeStatus: document.querySelector('#runtimeStatus'),
    catalogGrid: document.querySelector('#catalogGrid'),
    catalogSummary: document.querySelector('#catalogSummary'),
    heroFeaturedGrid: document.querySelector('#heroFeaturedGrid'),
    heroBadge: document.querySelector('#heroBadge'),
    heroTitle: document.querySelector('#heroTitle'),
    heroSubtitle: document.querySelector('#heroSubtitle'),
    brandName: document.querySelector('#brandName'),
    footerBrand: document.querySelector('#footerBrand'),
    heroWhatsappButton: document.querySelector('#heroWhatsappButton'),
    contactEmailLink: document.querySelector('#contactEmailLink'),
    contactPhoneLink: document.querySelector('#contactPhoneLink'),
    contactWhatsappLink: document.querySelector('#contactWhatsappLink'),
    contactPhoneLinkSecondary: document.querySelector('#contactPhoneLinkSecondary'),
    contactWhatsappLinkSecondary: document.querySelector('#contactWhatsappLinkSecondary'),
    floatingWhatsapp: document.querySelector('#floatingWhatsapp'),
    contactForm: document.querySelector('#contactForm'),
    contactFeedback: document.querySelector('#contactFeedback'),
    bookingModal: document.querySelector('#bookingModal'),
    bookingForm: document.querySelector('#bookingForm'),
    bookingFeedback: document.querySelector('#bookingFeedback'),
    bookingTripTitle: document.querySelector('#bookingTripTitle'),
    bookingTripMeta: document.querySelector('#bookingTripMeta'),
    bookingTripPrice: document.querySelector('#bookingTripPrice')
  };

  const state = {
    catalog: [],
    selectedDeparture: null,
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
      return 'Fecha por definir';
    }

    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(`${dateValue}T12:00:00`));
  }

  function slugMessage(message) {
    return encodeURIComponent(String(message || '').trim());
  }

  function normalizeArray(value) {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (error) {
      return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  function initials(text) {
    return String(text || 'JR')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  function imageMarkup(url, label, className) {
    const hasImage = Boolean(url);
    return `
      <div class="${className} ${hasImage ? 'has-image' : ''}" data-fallback="${initials(label)}">
        ${hasImage ? `<img src="${url}" alt="${label}" loading="lazy" />` : ''}
      </div>
    `;
  }

  function mergedSettings(row) {
    return {
      company_name: row?.company_name || config.company?.companyName || 'Jalisco Rutas',
      hero_badge: row?.hero_badge || 'Salidas semanales desde Guadalajara y ZMG',
      hero_title: row?.hero_title || 'Viajes y rutas turisticas con cupo real y apartado rapido',
      hero_subtitle: row?.hero_subtitle || 'Convierte visitas en reservas con una pagina informativa, catalogo vivo y atencion inmediata por WhatsApp.',
      support_email: row?.support_email || config.company?.supportEmail || 'hola@jalisconrutas.com',
      support_phone: row?.support_phone || config.company?.supportPhone || '+52 33 1246 9036',
      whatsapp_number: row?.whatsapp_number || config.company?.whatsappNumber || '523312469036',
      whatsapp_message: row?.whatsapp_message || config.company?.whatsappMessage || 'Hola, quiero informacion sobre los proximos viajes y rutas turisticas.',
      chatbot_enabled: row?.chatbot_enabled ?? config.chatbot?.enabled ?? false,
      chatbot_embed_code: row?.chatbot_embed_code || config.chatbot?.embedCode || ''
    };
  }

  function whatsappUrl(baseMessage) {
    const settings = state.settings || mergedSettings();
    return `https://wa.me/${settings.whatsapp_number}?text=${slugMessage(baseMessage || settings.whatsapp_message)}`;
  }

  function setStatus(message, type) {
    if (!elements.runtimeStatus) {
      return;
    }

    elements.runtimeStatus.textContent = message;
    elements.runtimeStatus.style.color = type === 'error' ? '#af3a12' : '#1f7a5a';
  }

  function applySettings() {
    const settings = state.settings || mergedSettings();
    const phoneHref = `tel:${settings.support_phone.replace(/[^\d+]/g, '')}`;
    const whatsappMain = whatsappUrl(settings.whatsapp_message);
    const whatsappSupport = whatsappUrl('Hola, quiero recibir atencion personalizada para una ruta.');
    const whatsappBooking = whatsappUrl('Hola, quiero apartar un viaje desde la pagina web.');

    elements.heroBadge.textContent = settings.hero_badge;
    elements.heroTitle.textContent = settings.hero_title;
    elements.heroSubtitle.textContent = settings.hero_subtitle;
    elements.brandName.textContent = settings.company_name;
    elements.footerBrand.textContent = settings.company_name;
    elements.heroWhatsappButton.href = whatsappMain;
    elements.contactWhatsappLink.href = whatsappSupport;
    elements.contactPhoneLink.href = phoneHref;
    elements.contactPhoneLink.textContent = `MX: ${settings.support_phone}`;
    elements.contactEmailLink.href = `mailto:${settings.support_email}`;
    elements.contactEmailLink.textContent = settings.support_email;
    elements.floatingWhatsapp.href = whatsappBooking;

    if (elements.contactPhoneLinkSecondary) {
      elements.contactPhoneLinkSecondary.href = phoneHref;
      elements.contactPhoneLinkSecondary.textContent = settings.support_phone;
    }

    if (elements.contactWhatsappLinkSecondary) {
      elements.contactWhatsappLinkSecondary.href = whatsappSupport;
    }

    if (settings.chatbot_enabled && settings.chatbot_embed_code) {
      injectEmbed(settings.chatbot_embed_code);
    }
  }

  function injectEmbed(code) {
    if (document.querySelector('[data-chatbot-injected="true"]')) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-chatbot-injected', 'true');
    wrapper.innerHTML = code.trim();

    Array.from(wrapper.childNodes).forEach((node) => {
      if (node.nodeName === 'SCRIPT') {
        const script = document.createElement('script');
        Array.from(node.attributes || []).forEach((attribute) => {
          script.setAttribute(attribute.name, attribute.value);
        });
        script.textContent = node.textContent;
        document.body.appendChild(script);
        return;
      }

      document.body.appendChild(node.cloneNode(true));
    });
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    const data = await response.json().catch(() => ({ ok: false, error: 'Respuesta invalida del servidor' }));

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || 'Error inesperado');
    }

    return data;
  }

  function featuredTemplate(item) {
    const trip = item.trip || {};
    const price = item.promo_price || trip.price || 0;
    const availableSeats = Math.max((item.capacity || 0) - (item.booked_count || 0), 0);

    return `
      <article class="featured-card">
        ${imageMarkup(trip.hero_image_url, trip.title, 'featured-thumb')}
        <div class="featured-content">
          <h3>${trip.title || 'Tour destacado'}</h3>
          <div class="featured-meta">
            <span>${friendlyDate(item.departure_date)}</span>
            <span>${availableSeats} lugares</span>
          </div>
          <p>${trip.destination || 'Jalisco'} · Desde ${currency(price)}</p>
        </div>
      </article>
    `;
  }

  function cardTemplate(item) {
    const trip = item.trip || {};
    const availableSeats = Math.max((item.capacity || 0) - (item.booked_count || 0), 0);
    const finalPrice = item.promo_price || trip.price || 0;
    const tags = normalizeArray(trip.tags).slice(0, 3);
    const includes = normalizeArray(trip.includes).slice(0, 4);
    const itinerary = normalizeArray(trip.itinerary).slice(0, 4);

    return `
      <article class="catalog-card">
        <div class="catalog-media">
          ${imageMarkup(trip.hero_image_url, trip.title, 'catalog-thumb')}
        </div>
        <div class="catalog-body">
          <div class="catalog-header">
            <div>
              <p class="mini-label">${trip.destination || 'Ruta turistica'}</p>
              <h3>${trip.title || 'Experiencia sin nombre'}</h3>
            </div>
            <div class="catalog-price">
              <span>${item.promo_price ? 'Promo' : 'Desde'}</span>
              <strong>${currency(finalPrice)}</strong>
            </div>
          </div>
          <div class="catalog-meta">
            <span>${friendlyDate(item.departure_date)}</span>
            <span>${trip.duration_text || 'Duracion por definir'}</span>
            <span>${availableSeats} lugares disponibles</span>
          </div>
          <div class="catalog-text">
            <p>${trip.short_description || trip.description || 'Salida turistica disponible para reserva.'}</p>
            <p><strong>Punto de encuentro:</strong> ${trip.meeting_point || 'Guadalajara, Jalisco'}</p>
          </div>
          <div class="catalog-tags">
            ${tags.map((tag) => `<span>${tag}</span>`).join('')}
          </div>
          <ul class="catalog-list">
            ${includes.map((value) => `<li>${value}</li>`).join('')}
          </ul>
          <details>
            <summary>Ver itinerario</summary>
            <ul class="catalog-list">
              ${itinerary.map((value) => `<li>${value}</li>`).join('')}
            </ul>
          </details>
          <div class="catalog-actions">
            <button class="button button-primary js-book" type="button" data-departure-id="${item.departure_id}">Apartar ahora</button>
            <a class="button button-secondary" href="${whatsappUrl(`Hola, me interesa la salida ${trip.title || ''} del ${friendlyDate(item.departure_date)}.`)}" target="_blank" rel="noreferrer">Pedir mas informacion</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderFeatured() {
    if (!elements.heroFeaturedGrid) {
      return;
    }

    if (!state.catalog.length) {
      elements.heroFeaturedGrid.innerHTML = `
        <article class="featured-placeholder">
          <strong>Sin tours destacados</strong>
          <span>En cuanto publiques salidas apareceran aqui.</span>
        </article>
      `;
      return;
    }

    const featured = [...state.catalog]
      .sort((left, right) => Number(Boolean(right.trip?.featured)) - Number(Boolean(left.trip?.featured)))
      .slice(0, 3);

    elements.heroFeaturedGrid.innerHTML = featured.map(featuredTemplate).join('');
  }

  function renderCatalog() {
    if (!elements.catalogGrid) {
      return;
    }

    if (!state.catalog.length) {
      elements.catalogGrid.innerHTML = `
        <article class="empty-state">
          <h3>Sin salidas activas</h3>
          <p>En cuanto publiques viajes desde tu panel privado apareceran aqui automaticamente.</p>
        </article>
      `;
      elements.catalogSummary.innerHTML = '<strong>0 salidas</strong><span>lista vacia</span>';
      renderFeatured();
      return;
    }

    elements.catalogGrid.innerHTML = state.catalog.map(cardTemplate).join('');
    const totalSeats = state.catalog.reduce(
      (sum, item) => sum + Math.max((item.capacity || 0) - (item.booked_count || 0), 0),
      0
    );
    elements.catalogSummary.innerHTML = `<strong>${state.catalog.length} salidas</strong><span>${totalSeats} lugares disponibles</span>`;
    renderFeatured();
  }

  async function loadBootstrap() {
    try {
      const data = await request(API.bootstrap, { method: 'GET' });
      state.settings = mergedSettings(data.settings);
      state.catalog = data.catalog || [];
      applySettings();
      renderCatalog();
      setStatus('Sitio conectado al backend. Catalogo y textos cargados desde la base de datos.');
    } catch (error) {
      state.settings = mergedSettings();
      state.catalog = demoCatalog;
      applySettings();
      renderCatalog();
      setStatus('No se pudo conectar al backend. Se cargo el modo demo para que el sitio siga visible.', 'error');
    }
  }

  function openBooking(departureId) {
    state.selectedDeparture = state.catalog.find((item) => String(item.departure_id) === String(departureId));
    if (!state.selectedDeparture) {
      return;
    }

    const trip = state.selectedDeparture.trip;
    elements.bookingTripTitle.textContent = trip.title;
    elements.bookingTripMeta.textContent = `${friendlyDate(state.selectedDeparture.departure_date)} · ${trip.meeting_point}`;
    elements.bookingTripPrice.textContent = currency(state.selectedDeparture.promo_price || trip.price || 0);
    elements.bookingForm.elements.departure_id.value = state.selectedDeparture.departure_id;
    elements.bookingFeedback.textContent = '';
    elements.bookingModal.classList.remove('hidden');
    elements.bookingModal.setAttribute('aria-hidden', 'false');
  }

  function closeBooking() {
    elements.bookingModal.classList.add('hidden');
    elements.bookingModal.setAttribute('aria-hidden', 'true');
    elements.bookingForm.reset();
    state.selectedDeparture = null;
  }

  async function submitContact(event) {
    event.preventDefault();
    const formData = new FormData(elements.contactForm);
    const payload = Object.fromEntries(formData.entries());
    elements.contactFeedback.textContent = 'Enviando mensaje...';

    try {
      await request(API.contact, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      elements.contactFeedback.textContent = 'Mensaje enviado. Ya quedo guardado para seguimiento comercial.';
      elements.contactForm.reset();
    } catch (error) {
      const fallbackMessage = [
        'Hola, quiero informacion desde el formulario web.',
        `Nombre: ${payload.full_name}`,
        `Correo: ${payload.email}`,
        `Telefono: ${payload.phone || 'No especificado'}`,
        `Mensaje: ${payload.message}`
      ].join('\n');
      window.open(whatsappUrl(fallbackMessage), '_blank', 'noopener,noreferrer');
      elements.contactFeedback.textContent = 'No se pudo guardar el mensaje en el backend. Te enviamos a WhatsApp para no perder el lead.';
    }
  }

  async function submitBooking(event) {
    event.preventDefault();
    const formData = new FormData(elements.bookingForm);
    const payload = Object.fromEntries(formData.entries());
    const seats = Number(payload.seats_reserved || 1);
    const departure = state.selectedDeparture;

    if (!departure) {
      elements.bookingFeedback.textContent = 'Primero selecciona una salida disponible.';
      return;
    }

    elements.bookingFeedback.textContent = 'Preparando tu apartado...';

    try {
      const response = await request(API.bookings, {
        method: 'POST',
        body: JSON.stringify({
          departure_id: Number(payload.departure_id),
          seats_reserved: seats,
          customer_name: payload.customer_name,
          customer_email: payload.customer_email,
          customer_phone: payload.customer_phone
        })
      });

      if (response.checkout_url) {
        window.location.href = response.checkout_url;
        return;
      }

      if (response.whatsapp_url) {
        window.open(response.whatsapp_url, '_blank', 'noopener,noreferrer');
        closeBooking();
        setStatus(
          response.message || 'La reserva quedo registrada y continuamos por WhatsApp desde el backend.',
          'success'
        );
        return;
      }

      throw new Error('No se pudo iniciar el checkout de la reserva.');
    } catch (error) {
      elements.bookingFeedback.textContent = error.message || 'Hubo un problema al iniciar el pago. Intenta otra vez o completa por WhatsApp.';
    }
  }

  function attachEvents() {
    document.addEventListener('click', (event) => {
      const bookButton = event.target.closest('.js-book');
      if (bookButton) {
        openBooking(bookButton.dataset.departureId);
      }

      if (event.target.hasAttribute('data-close-booking')) {
        closeBooking();
      }
    });

    elements.contactForm.addEventListener('submit', submitContact);
    elements.bookingForm.addEventListener('submit', submitBooking);

    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setStatus('Reserva completada. Ya puedes revisarla desde tu panel privado.');
    }
    if (params.get('checkout') === 'cancelled') {
      setStatus('El checkout fue cancelado. Puedes intentar nuevamente desde cualquier salida.', 'error');
    }
  }

  async function init() {
    await loadBootstrap();
    attachEvents();
  }

  init();
})();


