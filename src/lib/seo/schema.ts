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

export function generateArticleSchema(
  title: string,
  description: string,
  url: string,
  datePublished?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    url: `${site.url}${url}`,
    datePublished: datePublished ?? new Date().toISOString().split("T")[0],
    author: { "@type": "Organization", name: site.name },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: `${site.url}/brand/kharon-mark.svg` }
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${site.url}${url}` }
  };
}

export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: site.name,
    url: site.url,
    telephone: "+27-61-545-8830",
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressCountry: "ZA"
    },
    areaServed: "ZA",
    priceRange: "$$",
    image: `${site.url}/brand/kharon-mark.svg`,
    openingHours: "Mo-Fr 08:00-17:00"
  };
}

export function generateCollectionPageSchema(
  title: string,
  description: string,
  url: string,
  itemCount: number
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: description,
    url: `${site.url}${url}`,
    numberOfItems: itemCount,
    isPartOf: { "@type": "WebSite", name: site.name, url: site.url }
  };
}
