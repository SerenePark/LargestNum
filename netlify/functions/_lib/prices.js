/** Defaults match your Stripe dashboard; override with Netlify env vars. */
exports.PRICE_PACK =
  process.env.STRIPE_PRICE_PACK || "price_1TVxEXFvdwbjRSVAwdGPdqgk";
exports.PRICE_MONTHLY =
  process.env.STRIPE_PRICE_MONTHLY || "price_1TVxG3FvdwbjRSVAf6no1Tx7";
