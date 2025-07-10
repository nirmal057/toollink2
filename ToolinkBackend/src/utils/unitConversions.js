// Unit conversion utilities for inventory management

const UNIT_CONVERSIONS = {
  // Weight conversions (base unit: kg)
  weight: {
    kg: 1,
    tons: 1000,
    g: 0.001,
    lbs: 0.453592,
    oz: 0.0283495
  },
  
  // Length conversions (base unit: meters)
  length: {
    meters: 1,
    m: 1,
    cm: 0.01,
    mm: 0.001,
    km: 1000,
    ft: 0.3048,
    in: 0.0254,
    yards: 0.9144
  },
  
  // Volume conversions (base unit: liters)
  volume: {
    liters: 1,
    l: 1,
    ml: 0.001,
    gallons: 3.78541,
    quarts: 0.946353,
    cups: 0.236588
  },
  
  // Count-based units (base unit: pieces)
  count: {
    pieces: 1,
    units: 1,
    pcs: 1,
    dozen: 12,
    gross: 144,
    pairs: 2
  },
  
  // Container units (base unit: bags)
  container: {
    bags: 1,
    boxes: 1,
    rolls: 1,
    packets: 1,
    bundles: 1,
    cartons: 1
  }
};

// Unit categories mapping
const UNIT_CATEGORIES = {
  kg: 'weight',
  tons: 'weight',
  g: 'weight',
  lbs: 'weight',
  oz: 'weight',
  
  meters: 'length',
  m: 'length',
  cm: 'length',
  mm: 'length',
  km: 'length',
  ft: 'length',
  in: 'length',
  yards: 'length',
  
  liters: 'volume',
  l: 'volume',
  ml: 'volume',
  gallons: 'volume',
  quarts: 'volume',
  cups: 'volume',
  
  pieces: 'count',
  units: 'count',
  pcs: 'count',
  dozen: 'count',
  gross: 'count',
  pairs: 'count',
  
  bags: 'container',
  boxes: 'container',
  rolls: 'container',
  packets: 'container',
  bundles: 'container',
  cartons: 'container'
};

/**
 * Convert quantity from one unit to another
 * @param {number} quantity - The quantity to convert
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {Object} - { success: boolean, convertedQuantity: number, error?: string }
 */
function convertUnits(quantity, fromUnit, toUnit) {
  try {
    // If units are the same, no conversion needed
    if (fromUnit.toLowerCase() === toUnit.toLowerCase()) {
      return {
        success: true,
        convertedQuantity: quantity,
        conversionRate: 1
      };
    }
    
    const fromCategory = UNIT_CATEGORIES[fromUnit.toLowerCase()];
    const toCategory = UNIT_CATEGORIES[toUnit.toLowerCase()];
    
    // Check if both units exist and are in the same category
    if (!fromCategory || !toCategory) {
      return {
        success: false,
        error: `Unknown unit: ${!fromCategory ? fromUnit : toUnit}`
      };
    }
    
    if (fromCategory !== toCategory) {
      return {
        success: false,
        error: `Cannot convert between different unit categories: ${fromCategory} to ${toCategory}`
      };
    }
    
    const conversions = UNIT_CONVERSIONS[fromCategory];
    const fromRate = conversions[fromUnit.toLowerCase()];
    const toRate = conversions[toUnit.toLowerCase()];
    
    if (!fromRate || !toRate) {
      return {
        success: false,
        error: `Conversion rate not found for ${fromUnit} or ${toUnit}`
      };
    }
    
    // Convert to base unit, then to target unit
    const baseQuantity = quantity * fromRate;
    const convertedQuantity = baseQuantity / toRate;
    const conversionRate = fromRate / toRate;
    
    return {
      success: true,
      convertedQuantity: parseFloat(convertedQuantity.toFixed(6)),
      conversionRate: parseFloat(conversionRate.toFixed(6)),
      fromUnit,
      toUnit,
      originalQuantity: quantity
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Conversion error: ${error.message}`
    };
  }
}

/**
 * Get all supported units for a category
 * @param {string} category - Unit category (weight, length, volume, count, container)
 * @returns {Array} - Array of supported units
 */
function getSupportedUnits(category) {
  if (!category || !UNIT_CONVERSIONS[category]) {
    return Object.keys(UNIT_CATEGORIES);
  }
  return Object.keys(UNIT_CONVERSIONS[category]);
}

/**
 * Get the category of a unit
 * @param {string} unit - The unit to check
 * @returns {string|null} - The category or null if not found
 */
function getUnitCategory(unit) {
  return UNIT_CATEGORIES[unit.toLowerCase()] || null;
}

/**
 * Check if two units are compatible for conversion
 * @param {string} unit1 - First unit
 * @param {string} unit2 - Second unit
 * @returns {boolean} - True if units can be converted
 */
function areUnitsCompatible(unit1, unit2) {
  const category1 = getUnitCategory(unit1);
  const category2 = getUnitCategory(unit2);
  return category1 && category2 && category1 === category2;
}

/**
 * Normalize unit name (handle common variations)
 * @param {string} unit - The unit to normalize
 * @returns {string} - Normalized unit name
 */
function normalizeUnit(unit) {
  const normalized = unit.toLowerCase().trim();
  
  // Handle common variations
  const variations = {
    'pcs': 'pieces',
    'pc': 'pieces',
    'pce': 'pieces',
    'unit': 'units',
    'metre': 'meters',
    'litre': 'liters',
    'kilogram': 'kg',
    'tonne': 'tons',
    'gram': 'g',
    'pound': 'lbs',
    'ounce': 'oz',
    'foot': 'ft',
    'inch': 'in',
    'yard': 'yards'
  };
  
  return variations[normalized] || normalized;
}

module.exports = {
  convertUnits,
  getSupportedUnits,
  getUnitCategory,
  areUnitsCompatible,
  normalizeUnit,
  UNIT_CONVERSIONS,
  UNIT_CATEGORIES
};
