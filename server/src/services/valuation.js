const priceBook = [
  { keys: ["pain", "baguette", "viennoiserie", "bakery"], category: "boulangerie", price: 3.2 },
  { keys: ["riz", "pates", "semoule", "cereale"], category: "feculents", price: 2.4 },
  { keys: ["viande", "poulet", "boeuf", "poisson"], category: "proteines", price: 9.5 },
  { keys: ["plat", "prepare", "repas", "barquette"], category: "plats prepares", price: 7.0 },
  { keys: ["fruit", "legume", "salade"], category: "fruits et legumes", price: 3.0 }
];

export function estimateDonationValue({ description, quantity }) {
  const normalized = `${description} ${quantity}`.toLowerCase();
  const matched = priceBook.find((item) => item.keys.some((key) => normalized.includes(key))) || {
    category: "denrees alimentaires",
    price: 4.5
  };
  const numericQuantity = Number((quantity.match(/[\d,.]+/) || ["1"])[0].replace(",", "."));
  const estimatedQuantityKg = normalized.includes("kg") ? numericQuantity : Math.max(1, numericQuantity * 0.35);
  const estimatedValueEur = Number((estimatedQuantityKg * matched.price).toFixed(2));
  return {
    category: matched.category,
    estimatedQuantityKg: Number(estimatedQuantityKg.toFixed(2)),
    unitPriceEur: matched.price,
    estimatedValueEur,
    confidence: 0.62,
    method: "rule-based-mvp"
  };
}
