// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function Boom(): never {
  throw new Error("kaboom");
}

async function flushReact() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
}

describe("AppErrorBoundary", () => {
  let container: HTMLElement;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    container.remove();
  });

  it("renders children when nothing throws", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <AppErrorBoundary>
          <div data-testid="ok">all good</div>
        </AppErrorBoundary>,
      );
    });

    expect(container.querySelector('[data-testid="ok"]')).not.toBeNull();
    await act(async () => root.unmount());
  });

  it("renders a recovery screen instead of a blank page when a child throws", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <AppErrorBoundary>
          <Boom />
        </AppErrorBoundary>,
      );
    });
    await flushReact();

    expect(container.textContent).toContain("Something went wrong");
    expect(container.textContent).toContain("kaboom");
    const buttons = Array.from(container.querySelectorAll("button")).map((b) => b.textContent);
    expect(buttons).toContain("Reload");
    expect(buttons).toContain("Reset & reload");

    await act(async () => root.unmount());
  });
});
