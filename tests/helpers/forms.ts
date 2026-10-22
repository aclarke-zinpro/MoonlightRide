/** A valid organizer ride-editor submission (the info sheet values). */
export const validRideForm = {
  title: "Moonlight Ride 2026",
  date: "2026-10-24",
  time: "18:00",
  timeZone: "America/Chicago",
  startLocationName: "Carleton Arboretum North Trailhead",
  startLocationAddress: "Canada Ave and 320th St W, Northfield, MN",
  startLat: "44.4776",
  startLng: "-93.1351",
  parkingNotes: "Extra parking north of the river.",
  intro: "Greetings!",
  whyThisDate: "Closest weekend day to the full moon.",
  ridePrep: "Bring lights.",
  routeDescription: "Along the Cannon River.",
  organizerIntro: "I'm Adam.",
  distanceMiles: "15.8",
  pctGravel: "77",
  pctTrail: "6",
  pctPaved: "17",
  elevationGainFt: "305",
  rwgpsRouteId: "57148740",
  rwgpsEventUrl: "https://ridewithgps.com/events/502033-moonlight-ridge-2026",
  staticMapImageUrl: "/images/route-map-2026.jpg",
};

/** A valid public registration submission (spam fields are added by the test helpers). */
export const validRegistration = {
  fullName: "Riley Rider",
  email: "riley@example.com",
  phone: "507-555-0100",
  emergencyContactName: "Sam Rider",
  emergencyContactPhone: "507-555-0199",
  partySize: "2",
  acceptWaiver: "on",
};
