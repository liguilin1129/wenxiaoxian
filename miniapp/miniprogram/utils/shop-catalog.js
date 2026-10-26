// Official cash shop only. Do not reuse family point rewards as paid products.
// Real products may set pointsDeductionRate (0–0.05) to enable a small task-point deduction.
// Keep empty until real product data is supplied; no demo prices or purchases.
function getProducts() { return []; }
function getProduct(id) { return module.exports.getProducts().find(item => item.id === id) || null; }
module.exports = { getProducts, getProduct };
