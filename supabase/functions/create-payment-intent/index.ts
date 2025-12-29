import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

console.log("Stripe Function Initialized")

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { amount, currency = 'eur' } = await req.json()

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
            automatic_payment_methods: {
                enabled: true,
            },
        })

        return new Response(
            JSON.stringify({
                paymentIntent: paymentIntent.client_secret,
                publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
            }),
            {
                headers: { "Content-Type": "application/json", ...corsHeaders },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { "Content-Type": "application/json", ...corsHeaders },
                status: 400,
            }
        )
    }
})
