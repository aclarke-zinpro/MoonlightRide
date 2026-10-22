import { act, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CueSheet } from "@/features/route-guide/components/CueSheet";
import { RouteMap } from "@/features/route-guide/components/RouteMap";
import { StopsList } from "@/features/route-guide/components/StopsList";

const cues = [
  { id: "1", text: "Head east on 320th Street.", mile: 0, isImportant: false, isOptionalDetour: false },
  { id: "2", text: "Optional detour to the river access.", mile: 5.8, isImportant: false, isOptionalDetour: true },
  { id: "3", text: "We go off-road here.", mile: null, isImportant: true, isOptionalDetour: false },
];

describe("US2 route components", () => {
  afterEach(() => vi.useRealTimers());

  it("CueSheet renders an ordered list with Important and Optional labels as text", () => {
    render(<CueSheet cues={cues} />);
    const list = screen.getByRole("list", { name: /turn-by-turn/i });
    expect(list.tagName).toBe("OL");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Head east on 320th Street.");
    expect(items[1]).toHaveTextContent("Optional");
    expect(items[1]).toHaveTextContent("Mile 5.8");
    expect(items[2]).toHaveTextContent("Important");
  });

  it("StopsList shows name, mile, kind, and optional badge", () => {
    render(
      <StopsList
        stops={[
          { id: "a", name: "R Bar, Randolph", mile: 8.7, kind: "food_drink", description: "Bar.", isOptional: true, photoUrl: null, photoAlt: null },
          { id: "b", name: "River beach", mile: 10, kind: "scenic", description: "Fire if conditions allow.", isOptional: false, photoUrl: null, photoAlt: null },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("R Bar, Randolph");
    expect(items[0]).toHaveTextContent("Mile 8.7");
    expect(items[0]).toHaveTextContent("Food & drink");
    expect(items[0]).toHaveTextContent("Optional");
    expect(items[1]).toHaveTextContent("Scenic");
    expect(items[1]).not.toHaveTextContent("Optional");
  });

  it("RouteMap embeds the route with a title and falls back after 8 seconds", () => {
    vi.useFakeTimers();
    render(
      <RouteMap
        routeId="57148740"
        eventUrl="https://ridewithgps.com/events/502033-moonlight-ridge-2026"
        staticImageUrl="/images/route-map-2026.jpg"
        year={2026}
      />,
    );
    const frame = screen.getByTitle("Route map for Moonlight Ride 2026");
    expect(frame.getAttribute("src")).toContain("id=57148740");
    expect(screen.queryByRole("img", { name: /route map/i })).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(8_000));

    expect(screen.getByRole("img", { name: /route map/i })).toHaveAttribute(
      "src",
      expect.stringContaining("route-map-2026"),
    );
    expect(screen.getByText(/couldn't load the interactive map/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ridewithgps/i })).toHaveAttribute(
      "href",
      "https://ridewithgps.com/events/502033-moonlight-ridge-2026",
    );
  });
});
