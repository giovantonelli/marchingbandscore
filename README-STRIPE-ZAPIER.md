# Integrazione Stripe Checkout + Zapier + Cloudflare Worker

Questa guida ti permette di accettare pagamenti Stripe su un sito statico (es. GitHub Pages) usando Zapier e Cloudflare Workers come "ponte" per superare i limiti CORS e automatizzare la gestione degli ordini.

---

## 1. Stripe: crea un account e ottieni le chiavi
- Vai su https://dashboard.stripe.com/register e crea un account.
- Vai su Developers → API keys e copia la **Secret Key** (es: `sk_test_...`).
- (Opzionale) Crea i prodotti o usa prezzi dinamici.

---

## 2. Zapier: crea uno Zap per Stripe Checkout
1. **Crea un nuovo Zap**
2. **Trigger:**
   - Scegli "Webhooks by Zapier" → "Catch Hook"
   - Copia l’URL del webhook fornito da Zapier (es: `https://hooks.zapier.com/hooks/catch/XXXXXX/stripecheckout`)

3. **Azione:**
   - Scegli "Custom Request" (Webhooks by Zapier)
   - Method: `POST`
   - URL: `https://api.stripe.com/v1/checkout/sessions`
   - Headers:
     - `Authorization: Bearer sk_test_...` (la tua secret key Stripe)
     - `Content-Type: application/x-www-form-urlencoded`
   - Data (esempio):
     ```
     mode=payment&success_url={{success_url}}&cancel_url={{cancel_url}}&line_items[0][price_data][currency]=eur&line_items[0][price_data][product_data][name]={{title}}&line_items[0][price_data][unit_amount]=<prezzo_in_centesimi>&line_items[0][quantity]=1
     ```
     Sostituisci `<prezzo_in_centesimi>` con la variabile Zapier (es: `{{price}}` * 100, oppure calcola in uno step precedente).

4. **Azione finale:**
   - Scegli "Custom Response" (Webhooks by Zapier)
   - Response Data:
     ```json
     { "checkout_url": "{{Step2:Checkout Session URL}}" }
     ```
   - Così il Worker e il frontend riceveranno la URL per il redirect.

---

## 3. Cloudflare Worker: crea il proxy
1. Vai su https://dash.cloudflare.com → Workers & Pages → Create Application → Worker
2. Incolla questo codice:
   ```js
   export default {
     async fetch(request, env, ctx) {
       if (request.method !== 'POST') {
         return new Response('Method Not Allowed', { status: 405 });
       }
       const zapierUrl = 'https://hooks.zapier.com/hooks/catch/XXXXXX/stripecheckout';
       const body = await request.text();
       const zapierResp = await fetch(zapierUrl, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body
       });
       const zapierData = await zapierResp.text();
       return new Response(zapierData, {
         status: zapierResp.status,
         headers: {
           'Content-Type': 'application/json',
           'Access-Control-Allow-Origin': '*'
         }
       });
     }
   }
   ```
3. Deploya il Worker e copia l’URL pubblico (es: `https://tuo-worker.username.workers.dev/`)

---

## 4. Frontend: aggiorna il codice
Nel file JS dove gestisci il pagamento Stripe, usa:
```js
const webhookUrl = 'https://tuo-worker.username.workers.dev/';
// ...
const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: score.title,
    price: score.price,
    score_id: score.id,
    success_url: window.location.href + '?success=1',
    cancel_url: window.location.href + '?canceled=1'
  })
});
const data = await response.json();
if (data && data.checkout_url) {
  window.location.href = data.checkout_url;
} else {
  alert('Errore durante la creazione della sessione di pagamento.');
}
```

---

## 5. Test e produzione
- Usa Stripe in modalità test per provare tutto il flusso.
- Quando sei pronto, passa alle chiavi live di Stripe e aggiorna Zapier.

---

## 6. (Opzionale) Aggiornamento database Supabase dopo il pagamento
- In Zapier, aggiungi uno step dopo "Checkout Session Completed" per aggiornare Supabase (tramite Webhook o plugin Supabase) e abilitare il download allo user.

---

**Hai bisogno di esempi dettagliati per uno step? Chiedi pure!**
