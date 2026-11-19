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
    videos,
    specialNeeds,
    behaviours,
    featured,
    arrivalDate,
    adoptedDate,
    "adoptedMessage": select(
      $locale == "en" => coalesce(adoptedMessage.en, adoptedMessage.lb),
      $locale == "fr" => coalesce(adoptedMessage.fr, adoptedMessage.lb),
      $locale == "de" => coalesce(adoptedMessage.de, adoptedMessage.lb),
      adoptedMessage.lb
    ),
    "adoptedPhotos": adoptedPhotos[defined(asset)]{
      alt,
      "url": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height,
      "hotspot": hotspot{x, y}
    },
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
    "specialNeedsNote": select(
      $locale == "en" => coalesce(specialNeedsNote.en, specialNeedsNote.lb),
      $locale == "fr" => coalesce(specialNeedsNote.fr, specialNeedsNote.lb),
      $locale == "de" => coalesce(specialNeedsNote.de, specialNeedsNote.lb),
      specialNeedsNote.lb
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

// News posts, newest first. `body` is Portable Text, resolved to one language
// like the other localized fields.
export const POSTS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    "slug": slug.current,
    publishedAt,
    "title": select(
      $locale == "en" => coalesce(title.en, title.lb),
      $locale == "fr" => coalesce(title.fr, title.lb),
      $locale == "de" => coalesce(title.de, title.lb),
      title.lb
    ),
    "body": select(
      $locale == "en" => coalesce(body.en, body.lb),
      $locale == "fr" => coalesce(body.fr, body.lb),
      $locale == "de" => coalesce(body.de, body.lb),
      body.lb
    ),
    "coverImage": coverImage{
      alt,
      "url": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height,
      "hotspot": hotspot{x, y}
    },
    "relatedEvent": relatedEvent->{
      "slug": slug.current,
      startDate,
      "title": select(
        $locale == "en" => coalesce(title.en, title.lb),
        $locale == "fr" => coalesce(title.fr, title.lb),
        $locale == "de" => coalesce(title.de, title.lb),
        title.lb
      )
    },
    "relatedAnimals": relatedAnimals[]->{
      "slug": slug.current,
      name
    }
  }
`);

// All events, soonest first. "Upcoming" is NOT decided here: it depends on the
// current time, which must not be frozen into a cached result. lib/events.ts
// splits upcoming and past at render time.
export const EVENTS_QUERY = defineQuery(`
  *[_type == "event" && defined(slug.current) && defined(startDate)] | order(startDate asc) {
    _id,
    "slug": slug.current,
    startDate,
    endDate,
    allDay,
    cancelled,
    location{name, address, mapUrl},
    externalUrl,
    "title": select(
      $locale == "en" => coalesce(title.en, title.lb),
      $locale == "fr" => coalesce(title.fr, title.lb),
      $locale == "de" => coalesce(title.de, title.lb),
      title.lb
    ),
    "body": select(
      $locale == "en" => coalesce(body.en, body.lb),
      $locale == "fr" => coalesce(body.fr, body.lb),
      $locale == "de" => coalesce(body.de, body.lb),
      body.lb
    ),
    "coverImage": coverImage{
      alt,
      "url": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height,
      "hotspot": hotspot{x, y}
    }
  }
`);
