import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Prose } from "@/components/Prose";

describe("US5 Markdown rendering is safe", () => {
  it("strips script tags, event handlers, and javascript: links", () => {
    const { container } = render(
      <Prose
        markdown={[
          "Hello **riders**",
          "",
          "<script>alert(1)</script>",
          "",
          '<img src="x" onerror="alert(1)">',
          "",
          "[click me](javascript:alert(1))",
        ].join("\n")}
      />,
    );
    expect(container.querySelector("strong")?.textContent).toBe("riders");
    expect(container.querySelector("script")).toBeNull();
    expect(container.innerHTML).not.toMatch(/onerror/i);
    const link = container.querySelector("a");
    expect(link?.getAttribute("href") ?? "").not.toMatch(/^javascript:/i);
  });

  it("renders lists and links", () => {
    const { container } = render(<Prose markdown={"- one\n- two\n\n[Route](/route)"} />);
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/route");
  });
});
