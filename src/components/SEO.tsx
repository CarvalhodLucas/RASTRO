"use client";

import React from "react";

interface SEOProps {
    canonicalPath?: string;
    schemaMarkup?: Record<string, any> | Record<string, any>[];
}

export default function SEO({ canonicalPath, schemaMarkup }: SEOProps) {
    const baseUrl = "https://www.rastroia.com";
    const fullUrl = canonicalPath ? `${baseUrl}${canonicalPath}` : baseUrl;

    return (
        <>
            {canonicalPath && <link rel="canonical" href={fullUrl} />}
            {schemaMarkup && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(schemaMarkup)
                    }}
                />
            )}
        </>
    );
}
