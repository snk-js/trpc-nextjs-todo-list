import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pagination } from "./Pagination";

const link = (name: RegExp) => screen.queryByRole("link", { name });

describe("Pagination", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} />);
    expect(container.innerHTML).toBe("");
  });

  it("on the first page, links only to the next page", () => {
    render(<Pagination page={1} totalPages={3} />);
    expect(screen.getByText("Page 1 of 3")).toBeTruthy();
    expect(link(/Previous/)).toBeNull();
    expect(link(/Next/)?.getAttribute("href")).toBe("?page=2");
  });

  it("in the middle, links both ways", () => {
    render(<Pagination page={2} totalPages={3} />);
    expect(link(/Previous/)?.getAttribute("href")).toBe("?page=1");
    expect(link(/Next/)?.getAttribute("href")).toBe("?page=3");
  });

  it("on the last page, links only to the previous page", () => {
    render(<Pagination page={3} totalPages={3} />);
    expect(link(/Previous/)?.getAttribute("href")).toBe("?page=2");
    expect(link(/Next/)).toBeNull();
  });
});
