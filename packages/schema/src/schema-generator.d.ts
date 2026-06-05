export interface ArticleInput {
    type?: 'Article' | 'BlogPosting' | 'NewsArticle';
    headline: string;
    author: {
        name: string;
        url?: string;
    };
    datePublished: string;
    dateModified?: string;
    image?: string;
    url?: string;
    description?: string;
}
export declare function generateArticleSchema(input: ArticleInput): Record<string, unknown>;
export interface ReviewInput {
    author: string;
    ratingValue: number;
    reviewBody?: string;
}
export interface ProductInput {
    name: string;
    description?: string;
    price?: number;
    currency?: string;
    availability?: string;
    image?: string;
    reviews?: ReviewInput[];
    aggregateRating?: {
        ratingValue: number;
        reviewCount: number;
    };
}
export declare function generateProductSchema(input: ProductInput): Record<string, unknown>;
export declare function generateFAQSchema(items: Array<{
    question: string;
    answer: string;
}>): Record<string, unknown>;
export declare function generateBreadcrumbSchema(items: Array<{
    name: string;
    url: string;
}>): Record<string, unknown>;
export declare function generateOrganizationSchema(input: {
    name: string;
    url: string;
    logo?: string;
    sameAs?: string[];
    description?: string;
}): Record<string, unknown>;
export declare function generateLocalBusinessSchema(input: {
    name: string;
    address: {
        streetAddress: string;
        city: string;
        postalCode: string;
        country: string;
        region?: string;
    };
    telephone?: string;
    openingHours?: string;
    url?: string;
}): Record<string, unknown>;
export declare function generateEventSchema(input: {
    name: string;
    startDate: string;
    endDate?: string;
    location?: {
        name: string;
        address: string;
    };
    url?: string;
    eventStatus?: string;
    eventAttendanceMode?: string;
    description?: string;
}): Record<string, unknown>;
export declare function generateRecipeSchema(input: {
    name: string;
    description?: string;
    image?: string;
    prepTime?: string;
    cookTime?: string;
    totalTime?: string;
    recipeYield?: string;
    ingredients?: string[];
    instructions?: string[];
    author?: {
        name: string;
    };
    datePublished?: string;
}): Record<string, unknown>;
export interface ValidationResult {
    isValid: boolean;
    errors: Array<{
        field: string;
        message: string;
    }>;
    warnings: Array<{
        field: string;
        message: string;
    }>;
}
export declare function validateSchema(schema: Record<string, unknown>): ValidationResult;
export declare function renderSchemaTag(schema: Record<string, unknown>): string;
//# sourceMappingURL=schema-generator.d.ts.map