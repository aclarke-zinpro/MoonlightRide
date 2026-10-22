import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Countdown } from "@/features/ride/components/Countdown";
import { RideHero } from "@/features/ride/components/RideHero";
import { RouteSummary } from "@/features/ride/components/RouteSummary";
import { EDITION_2026 } from "@/server/db/seed-data";

const startsAt = new Date("2026-10-24T23:00:00Z");
const TZ = "America/Chicago";

describe("US1 home page components", () => {
  it("RideHero shows the title, date, time, and location with an Open in Maps link", () => {
    render(
      <RideHero
        title={EDITION_2026.title}
        startsAt={startsAt}
        timeZone={TZ}
        locationName={EDITION_2026.startLocationName}
        locationAddress={EDITION_2026.startLocationAddress}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Moonlight Ride 2026" })).toBeInTheDocument();
    expect(screen.getByText("Saturday, October 24, 2026")).toBeInTheDocument();
    expect(screen.getByText("6:00 PM CDT")).toBeInTheDocument();
    expect(screen.getByText("Carleton Arboretum North Trailhead")).toBeInTheDocument();
    const maps = screen.getByRole("link", { name: /open in maps/i });
    expect(maps.getAttribute("href")).toContain("google.com/maps/search");
    expect(maps.getAttribute("href")).toContain(encodeURIComponent("Carleton Arboretum"));
  });

  it("Countdown shows days remaining before the ride", () => {
    render(<Countdown startsAt={startsAt} timeZone={TZ} initialNow={new Date("2026-10-14T15:00:00Z")} />);
    expect(screen.getByText("10 days to go")).toBeInTheDocument();
  });

  it("Countdown says 1 day and ride day correctly", () => {
    const { rerender } = render(
      <Countdown startsAt={startsAt} timeZone={TZ} initialNow={new Date("2026-10-23T15:00:00Z")} />,
    );
    expect(screen.getByText("1 day to go")).toBeInTheDocument();
    rerender(
      <Countdown startsAt={startsAt} timeZone={TZ} initialNow={new Date("2026-10-24T15:00:00Z")} />,
    );
    expect(screen.getByText("Tonight's the night!")).toBeInTheDocument();
  });

  it("Countdown says the ride has happened after it is over", () => {
    render(<Countdown startsAt={startsAt} timeZone={TZ} initialNow={new Date("2026-10-26T15:00:00Z")} />);
    expect(screen.getByText("This year's ride has happened")).toBeInTheDocument();
  });

  it("RouteSummary shows distance, surface mix, and elevation", () => {
    render(
      <RouteSummary
        distanceMiles={15.8}
        pctGravel={77}
        pctTrail={6}
        pctPaved={17}
        elevationGainFt={305}
      />,
    );
    expect(screen.getByText("15.8 miles")).toBeInTheDocument();
    expect(screen.getByText("77% gravel")).toBeInTheDocument();
    expect(screen.getByText("6% doubletrack trail")).toBeInTheDocument();
    expect(screen.getByText("17% paved")).toBeInTheDocument();
    expect(screen.getByText("305 ft elevation gain")).toBeInTheDocument();
  });
});
