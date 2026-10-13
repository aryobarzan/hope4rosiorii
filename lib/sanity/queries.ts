import { defineQuery } from "next-sanity";

// Localized fields are resolved in GROQ: the requested locale, falling back to
// Luxembourgish (`lb`, the only required language) when a translation is empty.
// `select()` is used instead of `field[$locale]` so TypeGen can type the result.

export const ANIMALS_QUERY = defineQuery(`
  *[_type == "animal" && defined(slug.current)] | order(arrivalDate desc) {
    _id,
    "slug": slug.current,
    name,
    species,
    status,
    gender,
    estimatedBirthDate,
    size,
    traits,
    goodWith,
    health,
    location,
    videoUrl,
    featured,
    arrivalDate,
    "description": select(
      $locale == "en" => coalesce(description.en, description.lb),
      $locale == "fr" => coalesce(description.fr, description.lb),
      $locale == "de" => coalesce(description.de, description.lb),
      description.lb
    ),
    "adoptionNote": select(
      $locale == "en" => coalesce(adoptionNote.en, adoptionNote.lb),
      $locale == "fr" => coalesce(adoptionNote.fr, adoptionNote.lb),
      $locale == "de" => coalesce(adoptionNote.de, adoptionNote.lb),
      adoptionNote.lb
    ),
    "gallery": gallery[defined(asset)]{
      alt,
      "url": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height,
      "hotspot": hotspot{x, y}
    }
  }
`);

export const UPDATES_QUERY = defineQuery(`
  *[_type == "update"] | order(date desc) {
    _id,
    date,
    amountSpent,
    "title": select(
      $locale == "en" => coalesce(title.en, title.lb),
      $locale == "fr" => coalesce(title.fr, title.lb),
      $locale == "de" => coalesce(title.de, title.lb),
      title.lb
    ),
    "caption": select(
      $locale == "en" => coalesce(caption.en, caption.lb),
      $locale == "fr" => coalesce(caption.fr, caption.lb),
      $locale == "de" => coalesce(caption.de, caption.lb),
      caption.lb
    ),
    "animalSlug": animal->slug.current,
    "image": image{
      alt,
      "url": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height,
      "hotspot": hotspot{x, y}
    }
  }
`);

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0] {
    contactEmail,
    socialLinks,
    bank,
    paypalUrl,
    impactAmounts
  }
`);
