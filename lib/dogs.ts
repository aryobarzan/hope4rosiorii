// Data access for dogs. Pages and components only call getDogs() and getDog(),
// never the dummy data below, so swapping in Sanity later only changes this file.

// Matches the shape the pages render today. It will be replaced by the planned
// Sanity-based type (estimatedBirthDate, status, gallery, ...).
export type Dog = {
  id: number;
  name: string;
  slug: string;
  age: string;
  size: string;
  type: string;
  personality: string;
  description?: string;
  adopted: boolean;
};

const dogs: Dog[] = [
  {
    id: 1,
    name: "Bali",
    slug: "bali",
    age: "ca. 3 months",
    size: "Medium-sized",
    type: "Puppy",
    personality: "Friendly",
    description: "Hyper, but still gentle.",
    adopted: false,
  },
  {
    id: 2,
    name: "Luna",
    slug: "luna",
    age: "ca. 4 years",
    size: "Small-sized",
    type: "Puppy",
    personality: "Calm",
    adopted: false,
  },
  {
    id: 3,
    name: "Mara",
    slug: "mara",
    age: "ca. 5 years",
    size: "Large-sized",
    type: "Husky",
    personality: "Gentle",
    description: "Quiet and loyal.",
    adopted: false,
  },
  {
    id: 4,
    name: "Pichi",
    slug: "pichi",
    age: "ca. 8 months",
    size: "Small-sized",
    type: "Puppy",
    personality: "Curious",
    description: "Loves long hikes.",
    adopted: true,
  },
];

// Async even though the data is local: Sanity fetches will be, so callers
// already await and do not change when the data source does.
export async function getDogs(): Promise<Dog[]> {
  return dogs;
}

export async function getDog(slug: string): Promise<Dog | undefined> {
  return dogs.find((dog) => dog.slug === slug);
}
