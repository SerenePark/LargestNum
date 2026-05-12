const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { PRICE_MONTHLY } = require("./_lib/prices");

function parseNums(body) {
  const raw = [body.n1, body.n2, body.n3].map((v) =>
    v == null ? "" : String(v).trim()
  );
  if (raw.some((s) => s === "")) {
    return { error: "All three numbers are required" };
  }
  const nums = raw.map((s) => Number(s));
  if (nums.some((n) => Number.isNaN(n))) {
    return { error: "Invalid numbers" };
  }
  return { nums, raw };
}

async function hasActiveMonthlySubscription(customerId) {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 30,
  });
  return subs.data.some((sub) =>
    sub.items.data.some((item) => item.price.id === PRICE_MONTHLY)
  );
}

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
      body: JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const customerId =
    typeof body.customerId === "string" && /^cus_[a-zA-Z0-9]+$/.test(body.customerId)
      ? body.customerId
      : null;
  if (!customerId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "customerId required" }) };
  }

  const parsed = parseNums(body);
  if (parsed.error) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: parsed.error }) };
  }
  const { nums } = parsed;
  const largest = Math.max(nums[0], nums[1], nums[2]);

  try {
    await stripe.customers.retrieve(customerId);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid customer" }) };
  }

  try {
    if (await hasActiveMonthlySubscription(customerId)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          largest,
          unlimited: true,
          creditsRemaining: null,
        }),
      };
    }

    const cust = await stripe.customers.retrieve(customerId);
    const meta = cust.metadata || {};
    let credits = Math.max(0, parseInt(meta.credits || "0", 10) || 0);

    if (credits <= 0) {
      return {
        statusCode: 402,
        headers,
        body: JSON.stringify({ error: "No credits or active subscription" }),
      };
    }

    credits -= 1;
    await stripe.customers.update(customerId, {
      metadata: {
        ...meta,
        credits: String(credits),
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        largest,
        unlimited: false,
        creditsRemaining: credits,
      }),
    };
  } catch (err) {
    console.error("consume-result", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Server error" }),
    };
  }
};
