import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RenameThreadInput } from "@sidekiq/components/thread/rename-thread-input";

/**
 * Helper to render RenameThreadInput with default props
 */
function renderInput(
  overrides: Partial<React.ComponentProps<typeof RenameThreadInput>> = {},
) {
  const defaultProps = {
    initialTitle: "Initial title",
    onRename: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<RenameThreadInput {...defaultProps} />),
    props: defaultProps,
  };
}

describe("RenameThreadInput", () => {
  describe("initial state", () => {
    it("should render with initialTitle value", () => {
      renderInput({ initialTitle: "My conversation" });

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("My conversation");
    });

    it("should handle null initialTitle", () => {
      renderInput({ initialTitle: null });

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
    });

    it("should auto-focus on mount", () => {
      renderInput();

      const input = screen.getByRole("textbox");
      expect(input).toHaveFocus();
    });

    it("should have maxLength attribute of 255", () => {
      renderInput();

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("maxLength", "255");
    });
  });

  describe("keyboard interactions", () => {
    it("should call onRename with trimmed value on Enter (when changed)", async () => {
      const user = userEvent.setup();
      const { props } = renderInput({ initialTitle: "Old title" });

      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "  New title  ");
      await user.keyboard("{Enter}");

      expect(props.onRename).toHaveBeenCalledWith("New title");
    });

    it("should call onCancel on Enter when value unchanged", async () => {
      const user = userEvent.setup();
      const { props } = renderInput({ initialTitle: "Same title" });

      // Input is auto-focused by the component
      screen.getByRole("textbox");
      await user.keyboard("{Enter}");

      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onRename).not.toHaveBeenCalled();
    });

    it("should call onCancel on Enter when value is empty", async () => {
      const user = userEvent.setup();
      const { props } = renderInput({ initialTitle: "Title" });

      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.keyboard("{Enter}");

      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onRename).not.toHaveBeenCalled();
    });

    it("should call onCancel on Escape", async () => {
      const user = userEvent.setup();
      const { props } = renderInput();

      await user.keyboard("{Escape}");

      expect(props.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("blur behavior", () => {
    it("should call onRename on blur when value changed", () => {
      const { props } = renderInput({ initialTitle: "Old" });

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "New title" } });
      fireEvent.blur(input);

      expect(props.onRename).toHaveBeenCalledWith("New title");
    });

    it("should call onCancel on blur when value unchanged", () => {
      const { props } = renderInput({ initialTitle: "Same" });

      const input = screen.getByRole("textbox");
      fireEvent.blur(input);

      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onRename).not.toHaveBeenCalled();
    });

    it("should call onCancel on blur when value is empty/whitespace", () => {
      const { props } = renderInput({ initialTitle: "Title" });

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.blur(input);

      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onRename).not.toHaveBeenCalled();
    });
  });

  describe("value updates", () => {
    it("should update value on change", async () => {
      const user = userEvent.setup();
      renderInput({ initialTitle: "" });

      const input = screen.getByRole("textbox");
      await user.type(input, "New text");

      expect(input).toHaveValue("New text");
    });
  });
});
