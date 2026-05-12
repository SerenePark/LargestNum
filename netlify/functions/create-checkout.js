const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { PRICE_PACK, PRICE_MONTHLY } = require("./_lib/prices");

const siteUrl = () => {
  const u = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (u) return u.replace(/\/$/, "");
  return "http://localhost:8888";
};

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Missing STRIPE_SECRET_KEY on Netlify" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const plan = body.plan === "monthly" ? "monthly" : body.plan === "pack" ? "pack" : null;
  if (!plan) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "plan must be \"pack\" or \"monthly\"" }),
    };
  }

  const existingCustomer =
    typeof body.customer === "string" && /^cus_[a-zA-Z0-9]+$/.test(body.customer)
      ? body.customer
      : undefined;

  const base = siteUrl();
  const priceId = plan === "monthly" ? PRICE_MONTHLY : PRICE_PACK;
  const mode = plan === "monthly" ? "subscription" : "payment";
  const embedded = body.embedded === true;

  if (embedded && !process.env.STRIPE_PUBLISHABLE_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Missing STRIPE_PUBLISHABLE_KEY (required for embedded checkout)",
      }),
    };
  }

  const params = {
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { plan },
  };

  if (existingCustomer) {
    params.customer = existingCustomer;
  } else {
    params.customer_creation = "always";
  }

  try {
    if (embedded) {
      params.ui_mode = "embedded";
      params.return_url = `${base}/?session_id={CHECKOUT_SESSION_ID}`;
      const session = await stripe.checkout.sessions.create(params);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          clientSecret: session.client_secret,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        }),
      };
    }

    params.success_url = `${base}/?session_id={CHECKOUT_SESSION_ID}`;
    params.cancel_url = `${base}/?payment=canceled`;
    const session = await stripe.checkout.sessions.create(params);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("create-checkout", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Stripe error" }),
    };
  }
};
