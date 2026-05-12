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

  const sessionId = event.queryStringParameters?.session_id;
  if (!sessionId || typeof sessionId !== "string") {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "session_id required" }) };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (session.status !== "complete") {
      return {
        statusCode: 402,
        headers,
        body: JSON.stringify({ error: "Checkout not complete" }),
      };
    }

    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";
    if (!paid) {
      return {
        statusCode: 402,
        headers,
        body: JSON.stringify({ error: "Payment not completed" }),
      };
    }

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer && session.customer.id;
    if (!customerId) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Missing customer on session" }),
      };
    }

    const planMeta = session.metadata && session.metadata.plan;

    if (session.mode === "payment") {
      if (planMeta !== "pack") {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Unsupported or legacy checkout session" }),
        };
      }

      const cust = await stripe.customers.retrieve(customerId);
      const meta = cust.metadata || {};

      if (meta.last_pack_session === sessionId) {
        const credits = Math.max(0, parseInt(meta.credits || "0", 10) || 0);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            customerId,
            plan: "pack",
            credits,
            duplicate: true,
          }),
        };
      }

      const prev = Math.max(0, parseInt(meta.credits || "0", 10) || 0);
      const next = prev + 10;
      await stripe.customers.update(customerId, {
        metadata: {
          ...meta,
          credits: String(next),
          last_pack_session: sessionId,
        },
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          customerId,
          plan: "pack",
          credits: next,
          duplicate: false,
        }),
      };
    }

    if (session.mode === "subscription") {
      if (planMeta !== "monthly") {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Unsupported subscription checkout" }),
        };
      }

      const cust = await stripe.customers.retrieve(customerId);
      const meta = cust.metadata || {};

      if (meta.last_sub_session === sessionId) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            customerId,
            plan: "monthly",
            unlimited: true,
            duplicate: true,
          }),
        };
      }

      await stripe.customers.update(customerId, {
        metadata: {
          ...meta,
          last_sub_session: sessionId,
        },
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          customerId,
          plan: "monthly",
          unlimited: true,
          duplicate: false,
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Unknown checkout mode" }),
    };
  } catch (err) {
    console.error("verify-session", err);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: err.message || "Invalid session" }),
    };
  }
};
