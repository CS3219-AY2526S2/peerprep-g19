import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "../tabs";

const testTabs = [
  { label: "Description", content: <p>Description content</p> },
  { label: "Hints", content: <p>Hints content</p> },
  { label: "Solution", content: <p>Solution content</p> },
];

describe("Tabs", () => {
  it("renders all tab labels", () => {
    render(<Tabs tabs={testTabs} />);
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Hints")).toBeInTheDocument();
    expect(screen.getByText("Solution")).toBeInTheDocument();
  });

  it("shows first tab content by default", () => {
    render(<Tabs tabs={testTabs} />);
    expect(screen.getByText("Description content")).toBeInTheDocument();
    expect(screen.queryByText("Hints content")).not.toBeInTheDocument();
  });

  it("respects defaultIndex prop", () => {
    render(<Tabs tabs={testTabs} defaultIndex={1} />);
    expect(screen.getByText("Hints content")).toBeInTheDocument();
    expect(screen.queryByText("Description content")).not.toBeInTheDocument();
  });

  it("switches tab content on click", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={testTabs} />);

    await user.click(screen.getByText("Solution"));
    expect(screen.getByText("Solution content")).toBeInTheDocument();
    expect(screen.queryByText("Description content")).not.toBeInTheDocument();
  });

  it("applies active styling to selected tab", () => {
    render(<Tabs tabs={testTabs} />);
    const activeTab = screen.getByText("Description");
    expect(activeTab.className).toContain("bg-[#5568EE]");

    const inactiveTab = screen.getByText("Hints");
    expect(inactiveTab.className).not.toContain("bg-[#5568EE]");
  });
});
