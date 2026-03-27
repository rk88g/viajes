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
        connected_message: 'Sitio conectado al backend. Catalogo y textos cargados desde la base de datos.',
        fallback_message: 'No se pudo conectar al backend. Se cargo el modo demo para que el sitio siga visible.'
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

  const elements = {
    metaDescription: document.querySelector('#metaDescription'),
    runtimeStatus: document.querySelector('#runtimeStatus'),
    mainNavLinks: document.querySelector('#mainNavLinks'),
    mainNavCta: document.querySelector('#mainNavCta'),
    catalogGrid: document.querySelector('#catalogGrid'),
    catalogSummary: document.querySelector('#catalogSummary'),
    heroFeaturedGrid: document.querySelector('#heroFeaturedGrid'),
    heroBadge: document.querySelector('#heroBadge'),
    heroEyebrow: document.querySelector('#heroEyebrow'),
    heroTitle: document.querySelector('#heroTitle'),
    heroSubtitle: document.querySelector('#heroSubtitle'),
    heroPrimaryButton: document.querySelector('#heroPrimaryButton'),
    brandName: document.querySelector('#brandName'),
    brandSubtitle: document.querySelector('#brandSubtitle'),
    footerBrand: document.querySelector('#footerBrand'),
    footerDescription: document.querySelector('#footerDescription'),
    footerLinks: document.querySelector('#footerLinks'),
    heroWhatsappButton: document.querySelector('#heroWhatsappButton'),
    heroFacts: document.querySelector('#heroFacts'),
    featuredLabel: document.querySelector('#featuredLabel'),
    featuredTitle: document.querySelector('#featuredTitle'),
    featuredLink: document.querySelector('#featuredLink'),
    trustStrip: document.querySelector('#trustStrip'),
    collectionsLabel: document.querySelector('#collectionsLabel'),
    collectionsTitle: document.querySelector('#collectionsTitle'),
    collectionsDescription: document.querySelector('#collectionsDescription'),
    collectionGrid: document.querySelector('#collectionGrid'),
    catalogLabel: document.querySelector('#catalogLabel'),
    catalogTitle: document.querySelector('#catalogTitle'),
    catalogDescription: document.querySelector('#catalogDescription'),
    proofLabel: document.querySelector('#proofLabel'),
    proofTitle: document.querySelector('#proofTitle'),
    proofGrid: document.querySelector('#proofGrid'),
    workflowLabel: document.querySelector('#workflowLabel'),
    workflowTitle: document.querySelector('#workflowTitle'),
    workflowGrid: document.querySelector('#workflowGrid'),
    faqLabel: document.querySelector('#faqLabel'),
    faqTitle: document.querySelector('#faqTitle'),
    faqList: document.querySelector('#faqList'),
    contactLabel: document.querySelector('#contactLabel'),
    contactTitle: document.querySelector('#contactTitle'),
    contactDescription: document.querySelector('#contactDescription'),
    contactPoints: document.querySelector('#contactPoints'),
    contactFormTitle: document.querySelector('#contactFormTitle'),
    contactNameLabel: document.querySelector('#contactNameLabel'),
    contactEmailLabel: document.querySelector('#contactEmailLabel'),
    contactPhoneLabel: document.querySelector('#contactPhoneLabel'),
    contactMessageLabel: document.querySelector('#contactMessageLabel'),
    contactNameInput: document.querySelector('#contactNameInput'),
    contactEmailInput: document.querySelector('#contactEmailInput'),
    contactPhoneInput: document.querySelector('#contactPhoneInput'),
    contactMessageInput: document.querySelector('#contactMessageInput'),
    contactSubmitButton: document.querySelector('#contactSubmitButton'),
    contactEmailLink: document.querySelector('#contactEmailLink'),
    contactPhoneLink: document.querySelector('#contactPhoneLink'),
    contactWhatsappLink: document.querySelector('#contactWhatsappLink'),
    contactPhoneLinkSecondary: document.querySelector('#contactPhoneLinkSecondary'),
    contactWhatsappLinkSecondary: document.querySelector('#contactWhatsappLinkSecondary'),
    floatingWhatsapp: document.querySelector('#floatingWhatsapp'),
    scrollTopButton: document.querySelector('#scrollTopButton'),
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

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeHref(value, fallback = '#') {
    const href = String(value || '').trim();

    if (!href) {
      return fallback;
    }

    if (href.startsWith('#') || href.startsWith('/') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return href;
    }

    if (/^https?:\/\//i.test(href)) {
      return href;
    }

    return fallback;
  }

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
    const safeLabel = escapeHtml(label);
    return `
      <div class="${className} ${hasImage ? 'has-image' : ''}" data-fallback="${escapeHtml(initials(label))}">
        ${hasImage ? `<img src="${escapeHtml(url)}" alt="${safeLabel}" loading="lazy" />` : ''}
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
      chatbot_embed_code: row?.chatbot_embed_code || config.chatbot?.embedCode || '',
      homepage_content: deepMerge(defaultHomepageContent(), normalizeObject(row?.homepage_content))
    };
  }

  function homepageContent() {
    return state.settings?.homepage_content || defaultHomepageContent();
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

  function setText(element, value) {
    if (element) {
      element.textContent = String(value || '');
    }
  }

  function setLabelText(labelElement, value) {
    if (!labelElement) {
      return;
    }

    const textNode = Array.from(labelElement.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = `${value}\n`;
      return;
    }

    labelElement.insertBefore(document.createTextNode(`${value}\n`), labelElement.firstChild);
  }

  function renderNavigation(content) {
    const navigation = content.navigation || {};
    const links = Array.isArray(navigation.links) ? navigation.links : [];

    if (elements.mainNavLinks) {
      elements.mainNavLinks.innerHTML = links
        .map((item) => `<a href="${escapeHtml(safeHref(item.href, '#contacto'))}">${escapeHtml(item.label || 'Enlace')}</a>`)
        .join('');
    }

    if (elements.mainNavCta) {
      elements.mainNavCta.href = safeHref(navigation.cta_href, '#contacto');
      elements.mainNavCta.textContent = navigation.cta_label || 'Cotizar ahora';
    }

    setText(elements.brandSubtitle, navigation.brand_subtitle || 'Experiencias turisticas en Jalisco');
  }

  function renderHeroFacts(content) {
    const facts = Array.isArray(content.hero?.facts) ? content.hero.facts : [];
    elements.heroFacts.innerHTML = facts
      .map((item) => `<article><strong>${escapeHtml(item.title || '')}</strong><span>${escapeHtml(item.text || '')}</span></article>`)
      .join('');
  }

  function renderTrustStrip(content) {
    const items = Array.isArray(content.trust_strip?.items) ? content.trust_strip.items : [];
    elements.trustStrip.innerHTML = items
      .map((item) => `<article><strong>${escapeHtml(item.value || '')}</strong><span>${escapeHtml(item.text || '')}</span></article>`)
      .join('');
  }

  function renderCollections(content) {
    const section = content.collections || {};
    const items = Array.isArray(section.items) ? section.items : [];

    setText(elements.collectionsLabel, section.label || '');
    setText(elements.collectionsTitle, section.title || '');
    setText(elements.collectionsDescription, section.description || '');
    elements.collectionGrid.innerHTML = items
      .map(
        (item) => `
          <article>
            <span>${escapeHtml(item.number || '')}</span>
            <h3>${escapeHtml(item.title || '')}</h3>
            <p>${escapeHtml(item.text || '')}</p>
          </article>
        `
      )
      .join('');
  }

  function renderProof(content) {
    const section = content.proof || {};
    const testimonials = Array.isArray(section.testimonials) ? section.testimonials : [];

    setText(elements.proofLabel, section.label || '');
    setText(elements.proofTitle, section.title || '');
    elements.proofGrid.innerHTML = `
      <article class="proof-score">
        <p class="mini-label">${escapeHtml(section.score_label || '')}</p>
        <strong>${escapeHtml(section.score_value || '')}</strong>
        <span>${escapeHtml(section.score_text || '')}</span>
      </article>
      ${testimonials
        .map(
          (item) => `
            <article class="testimonial-card">
              <p>${escapeHtml(item.quote || '')}</p>
              <strong>${escapeHtml(item.author || '')}</strong>
            </article>
          `
        )
        .join('')}
    `;
  }

  function renderWorkflow(content) {
    const section = content.workflow || {};
    const items = Array.isArray(section.items) ? section.items : [];

    setText(elements.workflowLabel, section.label || '');
    setText(elements.workflowTitle, section.title || '');
    elements.workflowGrid.innerHTML = items
      .map(
        (item) => `
          <article>
            <strong>${escapeHtml(item.number || '')}</strong>
            <h3>${escapeHtml(item.title || '')}</h3>
            <p>${escapeHtml(item.text || '')}</p>
          </article>
        `
      )
      .join('');
  }

  function renderFaq(content) {
    const section = content.faq || {};
    const items = Array.isArray(section.items) ? section.items : [];

    setText(elements.faqLabel, section.label || '');
    setText(elements.faqTitle, section.title || '');
    elements.faqList.innerHTML = items
      .map(
        (item) => `
          <details ${item.open ? 'open' : ''}>
            <summary>${escapeHtml(item.question || '')}</summary>
            <p>${escapeHtml(item.answer || '')}</p>
          </details>
        `
      )
      .join('');
  }

  function renderContact(content, settings) {
    const section = content.contact || {};
    const points = Array.isArray(section.points) ? section.points : [];
    const phoneHref = `tel:${settings.support_phone.replace(/[^\d+]/g, '')}`;
    const whatsappSupport = whatsappUrl('Hola, quiero recibir atencion personalizada para una ruta.');

    setText(elements.contactLabel, section.label || '');
    setText(elements.contactTitle, section.title || '');
    setText(elements.contactDescription, section.description || '');
    setText(elements.contactFormTitle, section.form_title || '');
    setLabelText(elements.contactNameLabel, section.name_label || 'Nombre');
    setLabelText(elements.contactEmailLabel, section.email_label || 'Correo');
    setLabelText(elements.contactPhoneLabel, section.phone_label || 'Telefono');
    setLabelText(elements.contactMessageLabel, section.message_label || 'Mensaje');
    elements.contactNameInput.placeholder = section.name_placeholder || '';
    elements.contactEmailInput.placeholder = section.email_placeholder || '';
    elements.contactPhoneInput.placeholder = section.phone_placeholder || '';
    elements.contactMessageInput.placeholder = section.message_placeholder || '';
    elements.contactSubmitButton.textContent = section.submit_label || 'Enviar mensaje';
    elements.contactPoints.innerHTML = points
      .map((item) => {
        const type = String(item.type || 'link').toLowerCase();

        if (type === 'phone') {
          return `<a href="${escapeHtml(phoneHref)}">${escapeHtml(item.label || settings.support_phone)}</a>`;
        }

        if (type === 'whatsapp') {
          return `<a href="${escapeHtml(whatsappSupport)}" target="_blank" rel="noreferrer">${escapeHtml(item.label || 'Atencion por WhatsApp')}</a>`;
        }

        if (type === 'email') {
          return `<a href="mailto:${escapeHtml(settings.support_email)}">${escapeHtml(item.label || settings.support_email)}</a>`;
        }

        return `<a href="${escapeHtml(safeHref(item.href, '#contacto'))}">${escapeHtml(item.label || 'Enlace')}</a>`;
      })
      .join('');
  }

  function renderFooter(content) {
    const footer = content.footer || {};
    const links = Array.isArray(footer.links) ? footer.links : [];

    setText(elements.footerDescription, footer.description || '');
    elements.footerLinks.innerHTML = links
      .map((item) => `<a href="${escapeHtml(safeHref(item.href, '#contacto'))}">${escapeHtml(item.label || 'Enlace')}</a>`)
      .join('');
  }

  function applySettings() {
    const settings = state.settings || mergedSettings();
    const content = homepageContent();
    const phoneHref = `tel:${settings.support_phone.replace(/[^\d+]/g, '')}`;
    const whatsappMain = whatsappUrl(settings.whatsapp_message);
    const whatsappSupport = whatsappUrl('Hola, quiero recibir atencion personalizada para una ruta.');
    const whatsappBooking = whatsappUrl('Hola, quiero apartar un viaje desde la pagina web.');

    document.title = content.meta?.title || document.title;
    if (elements.metaDescription) {
      elements.metaDescription.setAttribute('content', content.meta?.description || '');
    }

    setText(elements.heroBadge, settings.hero_badge);
    setText(elements.heroEyebrow, content.hero?.eyebrow || 'Tours en Jalisco');
    setText(elements.heroTitle, settings.hero_title);
    setText(elements.heroSubtitle, settings.hero_subtitle);
    setText(elements.brandName, settings.company_name);
    setText(elements.footerBrand, settings.company_name);
    setText(elements.featuredLabel, content.featured?.label || '');
    setText(elements.featuredTitle, content.featured?.title || '');
    setText(elements.catalogLabel, content.catalog?.label || '');
    setText(elements.catalogTitle, content.catalog?.title || '');
    setText(elements.catalogDescription, content.catalog?.description || '');
    renderNavigation(content);
    renderHeroFacts(content);
    renderTrustStrip(content);
    renderCollections(content);
    renderProof(content);
    renderWorkflow(content);
    renderFaq(content);
    renderContact(content, settings);
    renderFooter(content);

    elements.heroPrimaryButton.href = safeHref(content.hero?.primary_cta_href, '#salidas');
    elements.heroPrimaryButton.textContent = content.hero?.primary_cta_label || 'Ver tours disponibles';
    elements.heroWhatsappButton.href = whatsappMain;
    elements.heroWhatsappButton.textContent = content.hero?.secondary_cta_label || 'Hablar por WhatsApp';
    elements.featuredLink.href = safeHref(content.featured?.link_href, '#salidas');
    elements.featuredLink.textContent = content.featured?.link_label || 'Ver todas';
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
      elements.contactWhatsappLinkSecondary.textContent = 'Atencion por WhatsApp';
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
          <h3>${escapeHtml(trip.title || 'Tour destacado')}</h3>
          <div class="featured-meta">
            <span>${escapeHtml(friendlyDate(item.departure_date))}</span>
            <span>${escapeHtml(`${availableSeats} lugares`)}</span>
          </div>
          <p>${escapeHtml(`${trip.destination || 'Jalisco'} · Desde ${currency(price)}`)}</p>
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
              <p class="mini-label">${escapeHtml(trip.destination || 'Ruta turistica')}</p>
              <h3>${escapeHtml(trip.title || 'Experiencia sin nombre')}</h3>
            </div>
            <div class="catalog-price">
              <span>${item.promo_price ? 'Promo' : 'Desde'}</span>
              <strong>${escapeHtml(currency(finalPrice))}</strong>
            </div>
          </div>
          <div class="catalog-meta">
            <span>${escapeHtml(friendlyDate(item.departure_date))}</span>
            <span>${escapeHtml(trip.duration_text || 'Duracion por definir')}</span>
            <span>${escapeHtml(`${availableSeats} lugares disponibles`)}</span>
          </div>
          <div class="catalog-text">
            <p>${escapeHtml(trip.short_description || trip.description || 'Salida turistica disponible para reserva.')}</p>
            <p><strong>Punto de encuentro:</strong> ${escapeHtml(trip.meeting_point || 'Guadalajara, Jalisco')}</p>
          </div>
          <div class="catalog-tags">
            ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
          <ul class="catalog-list">
            ${includes.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}
          </ul>
          <details>
            <summary>Ver itinerario</summary>
            <ul class="catalog-list">
              ${itinerary.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}
            </ul>
          </details>
          <div class="catalog-actions">
            <button class="button button-primary js-book" type="button" data-departure-id="${escapeHtml(item.departure_id)}">Apartar ahora</button>
            <a class="button button-secondary" href="${escapeHtml(whatsappUrl(`Hola, me interesa la salida ${trip.title || ''} del ${friendlyDate(item.departure_date)}.`))}" target="_blank" rel="noreferrer">Pedir mas informacion</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderFeatured() {
    if (!elements.heroFeaturedGrid) {
      return;
    }

    const content = homepageContent();

    if (!state.catalog.length) {
      elements.heroFeaturedGrid.innerHTML = `
        <article class="featured-placeholder">
          <strong>${escapeHtml(content.featured?.empty_title || 'Sin tours destacados')}</strong>
          <span>${escapeHtml(content.featured?.empty_text || 'En cuanto publiques salidas apareceran aqui.')}</span>
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

    const content = homepageContent();

    if (!state.catalog.length) {
      elements.catalogGrid.innerHTML = `
        <article class="empty-state">
          <h3>${escapeHtml(content.catalog?.empty_title || 'Sin salidas activas')}</h3>
          <p>${escapeHtml(content.catalog?.empty_text || 'En cuanto publiques viajes desde tu panel privado apareceran aqui automaticamente.')}</p>
        </article>
      `;
      elements.catalogSummary.innerHTML = `<strong>0 salidas</strong><span>${escapeHtml(content.catalog?.loading_summary || 'lista vacia')}</span>`;
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
      setStatus(homepageContent().runtime?.connected_message || 'Sitio conectado al backend.');
    } catch (error) {
      state.settings = mergedSettings();
      state.catalog = demoCatalog;
      applySettings();
      renderCatalog();
      setStatus(homepageContent().runtime?.fallback_message || 'No se pudo conectar al backend.', 'error');
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

      throw new Error('No se pudo iniciar la reserva.');
    } catch (error) {
      elements.bookingFeedback.textContent = error.message || 'Hubo un problema al iniciar la reserva. Intenta otra vez o completa por WhatsApp.';
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
    if (elements.scrollTopButton) {
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
  }

  async function init() {
    await loadBootstrap();
    attachEvents();
  }

  init();
})();


