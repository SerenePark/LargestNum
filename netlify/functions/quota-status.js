const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { PRICE_MONTHLY } = require("./_lib/prices");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }),
    };
  }

  const customerId = event.queryStringParameters?.customer_id;
  if (!customerId || !/^cus_[a-zA-Z0-9]+$/.test(customerId)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "customer_id required" }) };
  }

  try {
    await stripe.customers.retrieve(customerId);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid customer" }) };
  }

  try {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 30,
    });
    const activeMonthly = subs.data.find((sub) =>
      sub.items.data.some((item) => item.price.id === PRICE_MONTHLY)
    );

    if (activeMonthly) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          unlimited: true,
          currentPeriodEnd: activeMonthly.current_period_end,
          creditsRemaining: null,
        }),
      };
    }

    const cust = await stripe.customers.retrieve(customerId);
    const credits = Math.max(
      0,
      parseInt(cust.metadata?.credits || "0", 10) || 0
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        unlimited: false,
        creditsRemaining: credits,
      }),
    };
  } catch (err) {
    console.error("quota-status", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Server error" }),
    };
  }
};
