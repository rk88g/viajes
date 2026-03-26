import Stripe from "npm:stripe@14.25.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2024-04-10"
});

const supabase = createClient(supabaseUrl || "", supabaseServiceRoleKey || "");

Deno.serve(async (request) => {
  try {
    const signature = request.headers.get("stripe-signature");
    const body = await request.text();

    if (!signature || !stripeWebhookSecret) {
      throw new Error("Firma de webhook no disponible.");
    }

    const event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;

      if (!bookingId) {
        throw new Error("El webhook no contiene bookingId.");
      }

      const { error } = await supabase.rpc("confirm_booking_payment", {
        p_booking_id: bookingId,
        p_stripe_payment_intent:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        p_raw_session: session
      });

      if (error) {
        throw new Error(error.message);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Webhook invalido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
});

