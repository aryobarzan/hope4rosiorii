// Data access for the team. Pages call getVolunteers(), never the array, so
// swapping the dummy data for a CMS later only changes this file (the same
// pattern as lib/animals.ts).
//
// Text in [square brackets] is a placeholder for real content from the team.
export type Volunteer = {
  id: number;
  name: string;
  position: string;
  caption: string;
};

const volunteers: Volunteer[] = [
  {
    id: 1,
    name: "VICKY CONTATO",
    position: "[position]",
    caption: "[caption]",
  },
  {
    id: 2,
    name: "[NAME]",
    position: "[position]",
    caption: "[caption]",
  },
  {
    id: 3,
    name: "[NAME]",
    position: "[position]",
    caption: "[caption]",
  },
  {
    id: 4,
    name: "[NAME]",
    position: "[position]",
    caption: "[caption]",
  },
];

// Synchronous for now. It becomes async once it reads from Sanity, and the
// callers (server components) then just add `await`.
export function getVolunteers(): Volunteer[] {
  return volunteers;
}
