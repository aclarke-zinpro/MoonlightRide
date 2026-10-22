// Initial content, taken from the "Moonlight Ride 2026 Info Sheet" supplied by the organizer.
// Everything here is editable later from the organizer area.

export const EDITION_2026 = {
  year: 2026,
  title: "Moonlight Ride 2026",
  startsAt: new Date("2026-10-24T23:00:00Z"), // Saturday, October 24, 2026, 6:00 PM CDT
  timeZone: "America/Chicago",
  startLocationName: "Carleton Arboretum North Trailhead",
  startLocationAddress:
    "Small parking lot near Canada Ave and 320th St W, Northfield, MN, just south of the Waterford Historic Bridge over the Cannon River",
  // Approximate; the "Open in Maps" link searches by name and address.
  startLat: 44.4776,
  startLng: -93.1351,
  parkingNotes:
    "There aren't many parking spots in the lot. Additional parking is on the north side of the river on Canada Ave, where the road widens.",
  intro:
    "Greetings! The 2026 Moonlight Ride is planned for **Saturday, October 24 at 6:00 PM**.",
  whyThisDate:
    "It's the closest weekend day to the full moon (October 26). We start around sunset, so most of the ride will be in the moonlit dark. The leaves should be off the trees, maximizing the light from the moon on the gravel roads and trails, so there will be sections of the ride where we can ride without lights: a magical experience!",
  ridePrep: [
    "- This is a very casual ride with rest stops (maybe even at a bar or restaurant along the way), so **dress warmer than normal**.",
    "- We'll ride as much as possible without lights, but please bring a **fully charged headlight and taillight**. There are sections where you will need them.",
    "- Most of the ride is gravel, and there is a short off-road section, so bring a bike with **wider tires** that can handle a looser surface.",
  ].join("\n"),
  routeDescription:
    "The ride starts in Northfield at the Carleton Arboretum North Trailhead parking lot and follows the Cannon River east toward Randolph on gravel roads. Then we head back on the north side of the river.",
  organizerIntro:
    "My name is Adam Clarke, and I'm taking over ride-coordinator duties from Doug Shidell, who has organized this ride every fall for 30+ years. I've been a participant for most of the last 15 years.",
  distanceMiles: 15.8,
  pctGravel: 77,
  pctTrail: 6,
  pctPaved: 17,
  elevationGainFt: 305,
  rwgpsRouteId: "57148740",
  rwgpsEventUrl: "https://ridewithgps.com/events/502033-moonlight-ridge-2026",
  staticMapImageUrl: "/images/route-map-2026.jpg",
} as const;

export type SeedCue = { text: string; mile?: number; isImportant?: boolean; isOptionalDetour?: boolean };

export const CUES_2026: SeedCue[] = [
  { mile: 0, text: "Head east on 320th Street for 1 mile. At Barnard Avenue, go left (north)." },
  {
    mile: 1,
    text: "Continue north on Barnard for ½ mile. The road turns into Sciota Trail as it bears east. Continue on Sciota for about 1.5 miles. You'll see the old Sciota Town Hall on your right. Head left (north) on Alta Ave.",
  },
  {
    text: "Head north on Alta Ave for ⅛ mile. Right before the bridge over the Cannon River, turn right onto Sciota Trail.",
  },
  {
    text: "Continue on Sciota Trail for about 4 miles until you reach Highway 56, a paved two-lane road. Turn left (north) on 56.",
  },
  {
    mile: 5.8,
    isOptionalDetour: true,
    text: "Optional detour: at mile 5.8, go left (north) on 4th Ave to check out the Cannon River access. Afterward, return to the original route.",
  },
  {
    text: "Head north on 56 across the Cannon River for 1 mile and turn left (west) onto 292nd Street East. There's a convenience store at this intersection: an optional stop.",
  },
  {
    mile: 8.7,
    text: "Take 292nd Street East into the town of Randolph. You'll see the R Bar on your left after about ½ mile. This is another optional stop.",
  },
  {
    text: "Continue west on 292nd Street East for another ½ mile past the R Bar through town, and turn left (south) onto the gravel road Cooper Ave.",
  },
  { text: "After ⅓ mile on Cooper Ave, you'll cross the railroad tracks." },
  {
    isImportant: true,
    text: "Important: we go off-road here. Continue straight south onto the double-track trail next to the corn field. It leads toward the Cannon River, where there is a beach. This is park land owned by Dakota County. We may have a fire here.",
  },
  {
    text: "The double-track trail continues on the south side of the corn field for about a mile and connects back to Cannon River Boulevard, a gravel road. Turn left (west).",
  },
  {
    text: "Continue west on Cannon River Boulevard for 2 miles to a T intersection (Alta Ave). Turn right (north) on Alta, then make an immediate left back onto Cannon River Boulevard (west).",
  },
  {
    text: "Continue west on Cannon River Boulevard for another 2.3 miles to Northfield Boulevard / Hwy 47, which is paved. Turn left (southwest) on Northfield Boulevard.",
  },
  {
    text: "Continue southwest on Northfield Boulevard for ½ mile, then turn left (south) on Canada Ave. After ⅓ mile, the parking lot where we started is on your right.",
  },
];

export type PoiKind = "rest_stop" | "food_drink" | "scenic" | "landmark";
export type SeedPoi = {
  name: string;
  mile: number;
  kind: PoiKind;
  description: string;
  isOptional?: boolean;
};

export const POIS_2026: SeedPoi[] = [
  {
    name: "Waterford Historic Bridge",
    mile: 0,
    kind: "landmark",
    description: "Historic bridge over the Cannon River, just north of the start.",
  },
  {
    name: "Sciota Town Hall",
    mile: 2.5,
    kind: "landmark",
    description: "The old Sciota Town Hall, on your right just before the turn onto Alta Ave.",
  },
  {
    name: "Cannon River access",
    mile: 5.8,
    kind: "scenic",
    isOptional: true,
    description: "A short detour north on 4th Ave to a river access point.",
  },
  {
    name: "Convenience store (Hwy 56 and 292nd St E)",
    mile: 8.2,
    kind: "rest_stop",
    isOptional: true,
    description: "Snacks and drinks at the turn onto 292nd Street East.",
  },
  {
    name: "R Bar, Randolph",
    mile: 8.7,
    kind: "food_drink",
    isOptional: true,
    description: "Bar and restaurant in Randolph, on your left along 292nd Street East.",
  },
  {
    name: "River beach (Dakota County park land)",
    mile: 10,
    kind: "scenic",
    description: "A beach on the Cannon River at the end of the off-road section. Fire if conditions allow.",
  },
];

export const PLACEHOLDER_WAIVER = `# PLACEHOLDER – organizer must review before approving

This is placeholder text, not legal advice. Have it reviewed before opening registration.

## Release and assumption of risk

By registering for the Moonlight Ride, I understand that:

1. **Night riding.** The ride takes place after sunset, partly without lights, on gravel roads,
   paved roads, and an off-road double-track trail. Riding in the dark and on loose surfaces
   carries risks, including falls, collisions with vehicles, animals, or other riders, and
   serious injury.
2. **Lights and equipment.** I will bring a working, fully charged headlight and taillight and
   a bike suited to gravel, and I am responsible for the condition of my equipment.
3. **My own pace.** This is a casual group ride, not a race or a guided tour. I ride at my own
   pace, follow traffic laws, and am responsible for my own safety and navigation.
4. **Release.** I voluntarily assume these risks and release the ride organizer and volunteers
   from liability for injury, loss, or damage arising from my participation, to the extent
   permitted by law.
5. **Photos.** Photos taken during the ride may be shared on the ride website.
`;
