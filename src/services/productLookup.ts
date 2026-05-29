export interface ProductInfo {
  // ProductLookup is demo/auxiliary UI data, not the DSCSA verification record.
  // It is useful for display experiments but separate from the core GS1 flow.
  barcode: string;
  name: string;
  brand: string;
  category: string;
  quantity: string;
  imageUrl: string | null;
  found: boolean;
  lotNumber: string;
  expiryDate: string;
}

function generateLotNumber(barcode: string): string {
  // Generates stable demo data so the UI still looks populated when no API data exists.
  const seed = barcode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l1 = letters[(seed * 3) % 26];
  const l2 = letters[(seed * 7) % 26];
  const num = String((seed * 13) % 90000 + 10000);
  return `${l1}${l2}${num}`;
}

function generateExpiryDate(barcode: string): string {
  // Uses the same seed approach so mock data stays consistent for a given barcode.
  const seed = barcode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const now = new Date();
  const monthsAhead = (seed % 24) + 12;
  now.setMonth(now.getMonth() + monthsAhead);
  return now.toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }).replace('/', '/');
}

export async function lookupProduct(barcode: string): Promise<ProductInfo> {
  // Base fallback returned when the external lookup fails or does not know the barcode.
  const base: ProductInfo = {
    barcode,
    name: 'Unknown Product',
    brand: 'Unknown',
    category: 'Medication',
    quantity: '',
    imageUrl: null,
    found: false,
    lotNumber: generateLotNumber(barcode),
    expiryDate: generateExpiryDate(barcode),
  };

  try {
    // This public API is used as a best-effort product label lookup only.
    // The scan verification logic does not depend on this request succeeding.
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`
    );
    if (!res.ok) return base;

    const data = await res.json();
    if (data.status !== 1 || !data.product) return base;

    const p = data.product;

    const name =
      p.product_name_en ||
      p.product_name ||
      p.generic_name_en ||
      p.generic_name ||
      'Unknown Product';

    const brand = p.brands || p.brand_owner || 'Unknown';

    const rawCategory: string =
      p.categories_tags?.[0] ||
      p.categories ||
      '';
    // Normalizes Open Food Facts category strings into friendlier UI text.
    const category = rawCategory
      .replace(/^en:/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Medication';

    const quantity = p.quantity || p.net_weight || '';
    const imageUrl = p.image_front_url || p.image_url || null;

    return {
      ...base,
      name: name.trim(),
      brand: brand.split(',')[0].trim(),
      category,
      quantity,
      imageUrl,
      found: true,
    };
  } catch {
    return base;
  }
}
