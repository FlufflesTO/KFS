import { site } from "../../data/site.js";

// Helper to generate JSON-LD schema objects for pages

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: `${site.url}/brand/kharon-mark.svg`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+27-61-545-8830",
      contactType: "customer service",
      areaServed: "ZA",
      availableLanguage: "English"
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressCountry: "ZA"
    }
  };
}

export function generateServiceSchema(serviceName: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: serviceName,
    provider: {
      "@type": "Organization",
      name: site.name
    },
    areaServed: "ZA",
    description: description,
    url: `${site.url}${url}`
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${site.url}${item.url}`
    }))
  };
}
