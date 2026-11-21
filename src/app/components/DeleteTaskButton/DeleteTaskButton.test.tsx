import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithTRPC } from "@/test/render";
import { routerRefresh } from "@/test/setup-dom";
import { DeleteTaskButton } from "./DeleteTaskButton";

describe("DeleteTaskButton", () => {
  it("shows the error when the task no longer exists", async () => {
    const id = "00000000-0000-4000-8000-000000000000";
    renderWithTRPC(<DeleteTaskButton id={id} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText(`Task ${id} not found`)).toBeTruthy();
    expect(routerRefresh).not.toHaveBeenCalled();
  });
});
