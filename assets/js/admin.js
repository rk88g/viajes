(function () {
  const config = window.VIAJES_CONFIG || {};
  const ready =
    Boolean(config.supabaseUrl && config.supabaseAnonKey) &&
    !String(config.supabaseUrl).includes("YOUR_PROJECT") &&
    !String(config.supabaseAnonKey).includes("YOUR_SUPABASE");

  const supabaseClient =
    ready && window.supabase ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;

  const elements = {
    adminAlert: document.querySelector("#adminAlert"),
    authSection: document.querySelector("#authSection"),
    adminApp: document.querySelector("#adminApp"),
    loginForm: document.querySelector("#loginForm"),
    logoutButton: document.querySelector("#logoutButton"),
    adminUserLabel: document.querySelector("#adminUserLabel"),
    tripForm: document.querySelector("#tripForm"),
    departureForm: document.querySelector("#departureForm"),
    settingsForm: document.querySelector("#settingsForm"),
    departureTripSelect: document.querySelector("#departureTripSelect"),
    tripsTableBody: document.querySelector("#tripsTableBody"),
    departuresTableBody: document.querySelector("#departuresTableBody"),
    bookingsTableBody: document.querySelector("#bookingsTableBody"),
    messagesTableBody: document.querySelector("#messagesTableBody"),
    metricTrips: document.querySelector("#metricTrips"),
    metricDepartures: document.querySelector("#metricDepartures"),
    metricBookings: document.querySelector("#metricBookings"),
    metricMessages: document.querySelector("#metricMessages"),
    resetTripButton: document.querySelector("#resetTripButton"),
    resetDepartureButton: document.querySelector("#resetDepartureButton")
  };

  const state = {
    session: null,
    profile: null,
    trips: [],
    departures: [],
    bookings: [],
    messages: [],
    settings: null
  };

  function currency(value) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function friendlyDate(dateValue) {
    if (!dateValue) {
      return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(new Date(`${dateValue}T12:00:00`));
  }

  function parseCsv(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function setAlert(message, type) {
    elements.adminAlert.textContent = message;
    elements.adminAlert.style.color = type === "error" ? "#b64812" : "#1e7463";
  }

  function actionBadge(value) {
    if (value === "paid" || value === "confirmed" || value === "published") {
      return `<span class="pill pill-success">${value}</span>`;
    }
    if (value === "pending_payment" || value === "unpaid" || value === "open") {
      return `<span class="pill pill-warning">${value}</span>`;
    }
    return `<span class="pill pill-muted">${value || "n/a"}</span>`;
  }

  function requireSupabase() {
    if (!supabaseClient) {
      setAlert("Configura primero assets/js/config.js para activar el dashboard real.", "error");
      return false;
    }

    return true;
  }

  async function fetchProfile(userId) {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, full_name, is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async function loadAllData() {
    const [settingsResult, tripsResult, departuresResult, bookingsResult, messagesResult] = await Promise.all([
      supabaseClient.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      supabaseClient.from("trips").select("*").order("created_at", { ascending: false }),
      supabaseClient
        .from("departures")
        .select("id, trip_id, departure_date, return_date, capacity, booked_count, promo_price, status, notes, trip:trips(title, destination, price)")
        .order("departure_date", { ascending: true }),
      supabaseClient
        .from("bookings")
        .select("id, customer_name, customer_email, customer_phone, seats_reserved, total_amount, status, payment_status, trip_title_snapshot, departure_date_snapshot")
        .order("created_at", { ascending: false })
        .limit(12),
      supabaseClient
        .from("contact_messages")
        .select("id, full_name, email, phone, message, status")
        .order("created_at", { ascending: false })
        .limit(12)
    ]);

    [settingsResult, tripsResult, departuresResult, bookingsResult, messagesResult].forEach((result) => {
      if (result.error) {
        throw result.error;
      }
    });

    state.settings = settingsResult.data;
    state.trips = tripsResult.data || [];
    state.departures = departuresResult.data || [];
    state.bookings = bookingsResult.data || [];
    state.messages = messagesResult.data || [];
  }

  function renderMetrics() {
    elements.metricTrips.textContent = state.trips.filter((trip) => trip.published).length;
    elements.metricDepartures.textContent = state.departures.filter((departure) => departure.status === "open").length;
    elements.metricBookings.textContent = state.bookings.filter((booking) => booking.payment_status !== "paid").length;
    elements.metricMessages.textContent = state.messages.filter((message) => message.status === "new").length;
  }

  function renderTripOptions() {
    const options = state.trips
      .map((trip) => `<option value="${trip.id}">${trip.title} · ${trip.destination}</option>`)
      .join("");
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
            <td>${trip.published ? actionBadge("published") : actionBadge("draft")}</td>
            <td>
              <button class="action-link" type="button" data-action="edit-trip" data-id="${trip.id}">Editar</button>
              <button class="action-link" type="button" data-action="delete-trip" data-id="${trip.id}">Eliminar</button>
            </td>
          </tr>
        `
      )
      .join("");
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
            <td><strong>${departure.trip?.title || "Viaje"}</strong><br /><small>${departure.trip?.destination || ""}</small></td>
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
      .join("");
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
            <td><strong>${booking.customer_name}</strong><br /><small>${booking.customer_email}<br />${booking.customer_phone || ""}</small></td>
            <td>${booking.trip_title_snapshot || "Viaje"}<br /><small>${friendlyDate(booking.departure_date_snapshot)}</small></td>
            <td>${booking.seats_reserved}</td>
            <td>${currency(booking.total_amount)}</td>
            <td>${actionBadge(booking.payment_status)}</td>
          </tr>
        `
      )
      .join("");
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
            <td>${message.email}<br />${message.phone || "Sin telefono"}</td>
            <td>${message.message}</td>
          </tr>
        `
      )
      .join("");
  }

  function fillSettingsForm() {
    if (!state.settings) {
      return;
    }

    elements.settingsForm.company_name.value = state.settings.company_name || "";
    elements.settingsForm.hero_badge.value = state.settings.hero_badge || "";
    elements.settingsForm.hero_title.value = state.settings.hero_title || "";
    elements.settingsForm.hero_subtitle.value = state.settings.hero_subtitle || "";
    elements.settingsForm.support_email.value = state.settings.support_email || "";
    elements.settingsForm.support_phone.value = state.settings.support_phone || "";
    elements.settingsForm.whatsapp_number.value = state.settings.whatsapp_number || "";
    elements.settingsForm.whatsapp_message.value = state.settings.whatsapp_message || "";
    elements.settingsForm.chatbot_enabled.checked = Boolean(state.settings.chatbot_enabled);
    elements.settingsForm.chatbot_embed_code.value = state.settings.chatbot_embed_code || "";
  }

  function resetTripForm() {
    elements.tripForm.reset();
    elements.tripForm.trip_id.value = "";
    elements.tripForm.published.checked = true;
  }

  function resetDepartureForm() {
    elements.departureForm.reset();
    elements.departureForm.departure_id.value = "";
    elements.departureForm.booked_count.value = 0;
    elements.departureForm.status.value = "open";
  }

  function fillTripForm(tripId) {
    const trip = state.trips.find((item) => String(item.id) === String(tripId));
    if (!trip) {
      return;
    }

    elements.tripForm.trip_id.value = trip.id;
    elements.tripForm.title.value = trip.title || "";
    elements.tripForm.slug.value = trip.slug || "";
    elements.tripForm.destination.value = trip.destination || "";
    elements.tripForm.meeting_point.value = trip.meeting_point || "";
    elements.tripForm.duration_text.value = trip.duration_text || "";
    elements.tripForm.price.value = trip.price || "";
    elements.tripForm.hero_image_url.value = trip.hero_image_url || "";
    elements.tripForm.short_description.value = trip.short_description || "";
    elements.tripForm.description.value = trip.description || "";
    elements.tripForm.includes_csv.value = (trip.includes || []).join(", ");
    elements.tripForm.itinerary_csv.value = (trip.itinerary || []).join(", ");
    elements.tripForm.tags_csv.value = (trip.tags || []).join(", ");
    elements.tripForm.featured.checked = Boolean(trip.featured);
    elements.tripForm.published.checked = Boolean(trip.published);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fillDepartureForm(departureId) {
    const departure = state.departures.find((item) => String(item.id) === String(departureId));
    if (!departure) {
      return;
    }

    elements.departureForm.departure_id.value = departure.id;
    elements.departureForm.trip_id.value = departure.trip_id;
    elements.departureForm.departure_date.value = departure.departure_date || "";
    elements.departureForm.return_date.value = departure.return_date || "";
    elements.departureForm.capacity.value = departure.capacity || 0;
    elements.departureForm.booked_count.value = departure.booked_count || 0;
    elements.departureForm.promo_price.value = departure.promo_price || "";
    elements.departureForm.status.value = departure.status || "open";
    elements.departureForm.notes.value = departure.notes || "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function refreshAndRender(successMessage) {
    await loadAllData();
    renderMetrics();
    renderTripOptions();
    renderTripsTable();
    renderDeparturesTable();
    renderBookingsTable();
    renderMessagesTable();
    fillSettingsForm();
    setAlert(successMessage || "Dashboard actualizado.");
  }

  async function submitLogin(event) {
    event.preventDefault();
    if (!requireSupabase()) {
      return;
    }

    const formData = new FormData(elements.loginForm);
    const email = formData.get("email");
    const password = formData.get("password");
    setAlert("Validando sesion...");

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      setAlert(`No se pudo iniciar sesion: ${error.message}`, "error");
      return;
    }
  }

  async function bootSession() {
    if (!requireSupabase()) {
      return;
    }

    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
      state.session = null;
      state.profile = null;
      elements.authSection.classList.remove("hidden");
      elements.adminApp.classList.add("hidden");
      elements.logoutButton.style.display = "none";
      elements.adminUserLabel.textContent = "Sin sesion";
      setAlert("Inicia sesion con un usuario administrador para editar el sitio.");
      return;
    }

    state.session = session;
    elements.adminUserLabel.textContent = session.user.email;
    elements.logoutButton.style.display = "inline-flex";

    try {
      state.profile = await fetchProfile(session.user.id);

      if (!state.profile?.is_admin) {
        elements.authSection.classList.add("hidden");
        elements.adminApp.classList.add("hidden");
        setAlert("Tu usuario existe, pero aun no tiene permisos de administrador.", "error");
        return;
      }

      elements.authSection.classList.add("hidden");
      elements.adminApp.classList.remove("hidden");
      await refreshAndRender("Sesion iniciada. Ya puedes administrar viajes, salidas y mensajes.");
    } catch (error) {
      elements.authSection.classList.remove("hidden");
      elements.adminApp.classList.add("hidden");
      setAlert(`No se pudo cargar el perfil de administrador: ${error.message}`, "error");
    }
  }

  async function submitTrip(event) {
    event.preventDefault();
    const formData = new FormData(elements.tripForm);
    const payload = {
      title: formData.get("title"),
      slug: formData.get("slug") || slugify(formData.get("title")),
      destination: formData.get("destination"),
      meeting_point: formData.get("meeting_point"),
      duration_text: formData.get("duration_text"),
      price: Number(formData.get("price")),
      hero_image_url: formData.get("hero_image_url") || null,
      short_description: formData.get("short_description"),
      description: formData.get("description"),
      includes: parseCsv(formData.get("includes_csv")),
      itinerary: parseCsv(formData.get("itinerary_csv")),
      tags: parseCsv(formData.get("tags_csv")),
      featured: formData.get("featured") === "on",
      published: formData.get("published") === "on"
    };

    const tripId = formData.get("trip_id");
    setAlert("Guardando viaje...");

    const query = tripId
      ? supabaseClient.from("trips").update(payload).eq("id", tripId)
      : supabaseClient.from("trips").insert(payload);

    const { error } = await query;

    if (error) {
      setAlert(`No se pudo guardar el viaje: ${error.message}`, "error");
      return;
    }

    resetTripForm();
    await refreshAndRender("Viaje guardado correctamente.");
  }

  async function submitDeparture(event) {
    event.preventDefault();
    const formData = new FormData(elements.departureForm);
    const payload = {
      trip_id: Number(formData.get("trip_id")),
      departure_date: formData.get("departure_date"),
      return_date: formData.get("return_date") || null,
      capacity: Number(formData.get("capacity")),
      booked_count: Number(formData.get("booked_count")),
      promo_price: formData.get("promo_price") ? Number(formData.get("promo_price")) : null,
      status: formData.get("status"),
      notes: formData.get("notes") || null
    };

    const departureId = formData.get("departure_id");
    setAlert("Guardando salida...");

    const query = departureId
      ? supabaseClient.from("departures").update(payload).eq("id", departureId)
      : supabaseClient.from("departures").insert(payload);

    const { error } = await query;

    if (error) {
      setAlert(`No se pudo guardar la salida: ${error.message}`, "error");
      return;
    }

    resetDepartureForm();
    await refreshAndRender("Salida guardada correctamente.");
  }

  async function submitSettings(event) {
    event.preventDefault();
    const formData = new FormData(elements.settingsForm);
    const payload = {
      id: 1,
      company_name: formData.get("company_name"),
      hero_badge: formData.get("hero_badge"),
      hero_title: formData.get("hero_title"),
      hero_subtitle: formData.get("hero_subtitle"),
      support_email: formData.get("support_email"),
      support_phone: formData.get("support_phone"),
      whatsapp_number: formData.get("whatsapp_number"),
      whatsapp_message: formData.get("whatsapp_message"),
      chatbot_enabled: formData.get("chatbot_enabled") === "on",
      chatbot_embed_code: formData.get("chatbot_embed_code") || ""
    };

    setAlert("Guardando configuracion...");
    const { error } = await supabaseClient.from("site_settings").upsert(payload);

    if (error) {
      setAlert(`No se pudo guardar la configuracion: ${error.message}`, "error");
      return;
    }

    await refreshAndRender("Configuracion guardada.");
  }

  async function removeTrip(tripId) {
    if (!window.confirm("Eliminar este viaje? Tambien se eliminaran sus salidas.")) {
      return;
    }

    const { error } = await supabaseClient.from("trips").delete().eq("id", tripId);

    if (error) {
      setAlert(`No se pudo eliminar el viaje: ${error.message}`, "error");
      return;
    }

    await refreshAndRender("Viaje eliminado.");
  }

  async function removeDeparture(departureId) {
    if (!window.confirm("Eliminar esta salida?")) {
      return;
    }

    const { error } = await supabaseClient.from("departures").delete().eq("id", departureId);

    if (error) {
      setAlert(`No se pudo eliminar la salida: ${error.message}`, "error");
      return;
    }

    await refreshAndRender("Salida eliminada.");
  }

  function bindEvents() {
    elements.loginForm.addEventListener("submit", submitLogin);
    elements.logoutButton.addEventListener("click", async () => {
      if (!supabaseClient) {
        return;
      }

      await supabaseClient.auth.signOut();
      await bootSession();
    });

    elements.tripForm.addEventListener("submit", submitTrip);
    elements.departureForm.addEventListener("submit", submitDeparture);
    elements.settingsForm.addEventListener("submit", submitSettings);
    elements.resetTripButton.addEventListener("click", resetTripForm);
    elements.resetDepartureButton.addEventListener("click", resetDepartureForm);

    document.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) {
        return;
      }

      const { action, id } = actionButton.dataset;

      if (action === "edit-trip") {
        fillTripForm(id);
      }
      if (action === "delete-trip") {
        removeTrip(id);
      }
      if (action === "edit-departure") {
        fillDepartureForm(id);
      }
      if (action === "delete-departure") {
        removeDeparture(id);
      }
    });

    if (supabaseClient) {
      supabaseClient.auth.onAuthStateChange(() => {
        bootSession();
      });
    }
  }

  async function init() {
    bindEvents();
    if (!ready) {
      setAlert("Configura assets/js/config.js con tu URL y anon key de Supabase para empezar.", "error");
      return;
    }

    await bootSession();
  }

  init();
})();

