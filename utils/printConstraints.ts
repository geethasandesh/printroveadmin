/**
 * Print Position Constraints System
 * Defines which positions are allowed for different product types
 */

export interface ProductType {
  id: string;
  name: string;
  description: string;
  allowedPositions: string[];
  constraints?: {
    maxPositions?: number;
    requiredPositions?: string[];
    exclusivePositions?: string[]; // Positions that can't be used together
  };
}

export interface PrintConstraint {
  productType: string;
  allowedPositions: string[];
  constraints?: {
    maxPositions?: number;
    requiredPositions?: string[];
    exclusivePositions?: string[];
  };
}

/**
 * Product Type Definitions with Position Constraints
 */
export const PRODUCT_TYPES: ProductType[] = [
  {
    id: "t-shirt",
    name: "T-Shirt",
    description: "Basic t-shirt with front, back, and sleeve printing options",
    allowedPositions: [
      "Front",
      "Back", 
      "Left Sleeve",
      "Right Sleeve",
      "Inner Necklable",
      "Outer Necklable"
    ],
    constraints: {
      maxPositions: 6,
      requiredPositions: [],
      exclusivePositions: []
    }
  },
  {
    id: "hoodie",
    name: "Hoodie",
    description: "Hoodie with front, back, and sleeve printing options",
    allowedPositions: [
      "Front",
      "Back",
      "Left Sleeve", 
      "Right Sleeve",
      "Inner Necklable",
      "Outer Necklable"
    ],
    constraints: {
      maxPositions: 6,
      requiredPositions: [],
      exclusivePositions: []
    }
  },
  {
    id: "tote-bag",
    name: "Tote Bag",
    description: "Tote bag with limited printing area - front only",
    allowedPositions: [
      "Front"
    ],
    constraints: {
      maxPositions: 1,
      requiredPositions: ["Front"],
      exclusivePositions: []
    }
  },
  {
    id: "cap",
    name: "Cap",
    description: "Baseball cap with front and back printing options",
    allowedPositions: [
      "Front",
      "Back"
    ],
    constraints: {
      maxPositions: 2,
      requiredPositions: [],
      exclusivePositions: []
    }
  },
  {
    id: "mug",
    name: "Mug",
    description: "Ceramic mug with wrap or front print",
    allowedPositions: [
      "Full Wrap",
      "Front"
    ],
    constraints: {
      maxPositions: 1,
      requiredPositions: ["Full Wrap"],
      exclusivePositions: []
    }
  },
  {
    id: "tank-top",
    name: "Tank Top",
    description: "Tank top with front and back printing options",
    allowedPositions: [
      "Front",
      "Back",
      "Inner Necklable",
      "Outer Necklable"
    ],
    constraints: {
      maxPositions: 4,
      requiredPositions: [],
      exclusivePositions: []
    }
  },
  {
    id: "polo-shirt",
    name: "Polo Shirt",
    description: "Polo shirt with front, back, and sleeve options",
    allowedPositions: [
      "Front",
      "Back",
      "Left Sleeve",
      "Right Sleeve",
      "Inner Necklable",
      "Outer Necklable"
    ],
    constraints: {
      maxPositions: 6,
      requiredPositions: [],
      exclusivePositions: []
    }
  },
  {
    id: "sweatshirt",
    name: "Sweatshirt",
    description: "Sweatshirt with front, back, and sleeve printing options",
    allowedPositions: [
      "Front",
      "Back",
      "Left Sleeve",
      "Right Sleeve",
      "Inner Necklable",
      "Outer Necklable"
    ],
    constraints: {
      maxPositions: 6,
      requiredPositions: [],
      exclusivePositions: []
    }
  },
  {
    id: "long-sleeve",
    name: "Long Sleeve",
    description: "Long sleeve shirt with front, back, and sleeve options",
    allowedPositions: [
      "Front",
      "Back",
      "Left Sleeve",
      "Right Sleeve",
      "Inner Necklable",
      "Outer Necklable"
    ],
    constraints: {
      maxPositions: 6,
      requiredPositions: [],
      exclusivePositions: []
    }
  }
];

/**
 * Get allowed positions for a specific product type
 */
export function getAllowedPositions(productTypeId: string): string[] {
  const productType = PRODUCT_TYPES.find(pt => pt.id === productTypeId);
  return productType?.allowedPositions || [];
}

/**
 * Get product type by ID
 */
export function getProductType(productTypeId: string): ProductType | undefined {
  return PRODUCT_TYPES.find(pt => pt.id === productTypeId);
}

/**
 * Validate position selection for a product type
 */
export function validatePositionSelection(
  productTypeId: string, 
  selectedPositions: string[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const productType = getProductType(productTypeId);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!productType) {
    errors.push(`Unknown product type: ${productTypeId}`);
    return { isValid: false, errors, warnings };
  }

  // Check if all selected positions are allowed (case-insensitive)
  const invalidPositions = selectedPositions.filter(
    pos => !productType.allowedPositions.some(allowed => allowed.toLowerCase() === pos.toLowerCase())
  );
  
  if (invalidPositions.length > 0) {
    errors.push(
      `Invalid positions for ${productType.name}: ${invalidPositions.join(", ")}. ` +
      `Allowed positions: ${productType.allowedPositions.join(", ")}`
    );
  }

  // Check maximum positions constraint
  if (productType.constraints?.maxPositions && 
      selectedPositions.length > productType.constraints.maxPositions) {
    errors.push(
      `Maximum ${productType.constraints.maxPositions} positions allowed for ${productType.name}. ` +
      `You selected ${selectedPositions.length} positions.`
    );
  }

  // Check required positions (case-insensitive)
  if (productType.constraints?.requiredPositions) {
    const missingRequired = productType.constraints.requiredPositions.filter(
      req => !selectedPositions.some(sel => sel.toLowerCase() === req.toLowerCase())
    );
    
    if (missingRequired.length > 0) {
      errors.push(
        `Required positions missing for ${productType.name}: ${missingRequired.join(", ")}`
      );
    }
  }

  // Check exclusive positions (case-insensitive)
  if (productType.constraints?.exclusivePositions) {
    const hasExclusive = productType.constraints.exclusivePositions.some(
      exc => selectedPositions.some(sel => sel.toLowerCase() === exc.toLowerCase())
    );
    
    if (hasExclusive && selectedPositions.length > 1) {
      warnings.push(
        `Some positions for ${productType.name} are mutually exclusive. ` +
        `Consider selecting only one position.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Filter available positions based on product type (case-insensitive)
 */
export function filterPositionsByProductType(
  allPositions: string[],
  productTypeId: string
): string[] {
  const allowedPositions = getAllowedPositions(productTypeId);
  // Case-insensitive matching
  return allPositions.filter(pos => 
    allowedPositions.some(allowed => allowed.toLowerCase() === pos.toLowerCase())
  );
}

/**
 * Get position constraint info for display
 */
export function getPositionConstraintInfo(productTypeId: string): {
  maxPositions?: number;
  requiredPositions?: string[];
  allowedPositions: string[];
} {
  const productType = getProductType(productTypeId);
  
  if (!productType) {
    return { allowedPositions: [] };
  }

  return {
    maxPositions: productType.constraints?.maxPositions,
    requiredPositions: productType.constraints?.requiredPositions,
    allowedPositions: productType.allowedPositions
  };
}

/**
 * Check if a position is allowed for a product type (case-insensitive)
 */
export function isPositionAllowed(productTypeId: string, position: string): boolean {
  const allowedPositions = getAllowedPositions(productTypeId);
  return allowedPositions.some(allowed => allowed.toLowerCase() === position.toLowerCase());
}

/**
 * Get all available product types for dropdown
 */
export function getProductTypeOptions(): Array<{label: string; value: string}> {
  return PRODUCT_TYPES.map(pt => ({
    label: pt.name,
    value: pt.id
  }));
}
