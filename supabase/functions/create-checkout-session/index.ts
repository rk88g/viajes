import Stripe from "npm:stripe@14.25.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL");

const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2024-04-10"
});

const supabase = createClient(supabaseUrl || "", supabaseServiceRoleKey || "");

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { departureId, seats, customer } = await request.json();

    if (!departureId || !customer?.name || !customer?.email || !seats) {
      return new Response(JSON.stringify({ error: "Datos incompletos para crear la reserva." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: departure, error: departureError } = await supabase
      .from("departures")
      .select(
        "id, departure_date, capacity, booked_count, promo_price, status, trip:trips(id, title, price, meeting_point)"
      )
      .eq("id", departureId)
      .maybeSingle();

    if (departureError || !departure || !departure.trip) {
      throw new Error("La salida solicitada no existe.");
    }

    if (departure.status !== "open") {
      throw new Error("La salida ya no esta disponible.");
    }

    const availableSeats = departure.capacity - departure.booked_count;
    const seatsNumber = Number(seats);

    if (seatsNumber < 1 || seatsNumber > availableSeats) {
      throw new Error("No hay suficiente cupo disponible para completar el apartado.");
    }

    const unitPrice = Number(departure.promo_price || departure.trip.price || 0);
    const totalAmount = unitPrice * seatsNumber;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        trip_id: departure.trip.id,
        departure_id: departure.id,
        trip_title_snapshot: departure.trip.title,
        departure_date_snapshot: departure.departure_date,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        seats_reserved: seatsNumber,
        total_amount: totalAmount,
        status: "pending_payment",
        payment_status: "unpaid"
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      throw new Error(bookingError?.message || "No se pudo crear el registro de reserva.");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "es",
      success_url: `${publicSiteUrl}/?checkout=success&booking=${booking.id}`,
      cancel_url: `${publicSiteUrl}/?checkout=cancelled&booking=${booking.id}`,
      customer_email: customer.email,
      phone_number_collection: { enabled: true },
      metadata: {
        bookingId: booking.id,
        departureId: String(departure.id),
        tripId: String(departure.trip.id),
        seats: String(seatsNumber)
      },
      line_items: [
        {
          quantity: seatsNumber,
          price_data: {
            currency: "mxn",
            unit_amount: Math.round(unitPrice * 100),
            product_data: {
              name: `${departure.trip.title} | ${departure.departure_date}`,
              description: `Salida desde ${departure.trip.meeting_point || "Guadalajara"}`
            }
          }
        }
      ]
    });

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        stripe_session_id: session.id,
        checkout_payload: session
      })
      .eq("id", booking.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return new Response(JSON.stringify({ checkoutUrl: session.url, bookingId: booking.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Error inesperado" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

