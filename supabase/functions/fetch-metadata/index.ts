import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    try {
        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders })
        }

        const { url } = await req.json()

        if (!url) throw new Error('URL is required');

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
            }
        });

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        if (!doc) throw new Error('Failed to parse HTML');

        const getMeta = (prop: string) =>
            doc.querySelector(`meta[property="${prop}"]`)?.getAttribute("content") ||
            doc.querySelector(`meta[name="${prop}"]`)?.getAttribute("content");

        const title = getMeta("og:title") || getMeta("twitter:title") || doc.querySelector("title")?.textContent || "";
        const description = getMeta("og:description") || getMeta("twitter:description") || getMeta("description") || "";

        // Generic Metadata Image
        let image = getMeta("og:image") ||
            getMeta("twitter:image") ||
            getMeta("twitter:image:src") ||
            doc.querySelector("link[rel='image_src']")?.getAttribute("href");

        // Amazon/E-commerce specific image fallbacks
        if (!image) {
            image = doc.querySelector('#landingImage')?.getAttribute('src') || // Amazon Desktop
                doc.querySelector('#imgBlkFront')?.getAttribute('src') || // Amazon Books
                doc.querySelector('#main-image')?.getAttribute('src') ||  // Generic Ecommerce
                doc.querySelector('.a-dynamic-image')?.getAttribute('data-old-hires') || // Amazon Dynamic
                "";
        }

        // Ensure image is absolute
        if (image && !image.startsWith('http')) {
            try {
                image = new URL(image, url).toString();
            } catch (e) {
                // ignore invalid urls
            }
        }

        // Attempt price extraction (Meta tags first)
        let price = getMeta("product:price:amount") ||
            getMeta("price") ||
            getMeta("og:price:amount");

        // Amazon/E-commerce specific price fallbacks (DOM)
        if (!price) {
            price = doc.querySelector('.a-price .a-offscreen')?.textContent || // Amazon Modern
                doc.querySelector('#priceblock_ourprice')?.textContent ||  // Amazon Legacy
                doc.querySelector('#priceblock_dealprice')?.textContent || // Amazon Deal
                doc.querySelector('.price')?.textContent ||                // Generic
                "";
        }

        // Fallback: Try regex on title/description/price-text
        // Supports "$50.00" (Prefix) and "50,00 €" (Suffix)
        if (!price || isNaN(parseFloat(price.replace(/[^0-9.,]/g, '')))) {
            const priceRegex = /([\$€£]\s*\d+[.,]?\d*)|(\d+[.,]?\d*\s*[\$€£])/;
            const priceSource = price + " " + title + " " + description; // Search everywhere
            const priceMatch = priceSource.match(priceRegex);
            if (priceMatch) {
                price = priceMatch[0]; // Take the whole string first (e.g. "€50")
            }
        }

        // Clean price string to just number for DB (optional, but good for parsing)
        // The UI expects a string, so we keep the currency symbol if we want, or strip it.
        // Based on Wishlist Item, we store 'price' as string, typically "50.00".
        if (price) {
            // Extract just the numeric part for consistency
            const numericMatch = price.match(/(\d+[.,]?\d*)/);
            if (numericMatch) price = numericMatch[0];
        }

        const metadata = {
            title: title.trim(),
            description: description.trim(),
            image: image,
            price: price ? price.replace(',', '.') : null, // Normalize decimal
            url: url
        };
        return new Response(
            JSON.stringify(metadata),
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
