import { act, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/** jsdom has no IntersectionObserver; this fake lets tests decide when the sentinel is visible. */
const observers = new Set<FakeIntersectionObserver>();
/** When true, like a real observer, observe() reports the element as already visible. */
let stayInView = false;

class FakeIntersectionObserver {
  private targets = new Set<Element>();
  constructor(private callback: IntersectionObserverCallback) {
    observers.add(this);
  }
  observe(el: Element) {
    this.targets.add(el);
    if (stayInView) queueMicrotask(() => observers.has(this) && this.trigger());
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
    observers.delete(this);
  }
  takeRecords() {
    return [];
  }
  trigger() {
    const entries = [...this.targets].map(
      (target) => ({ target, isIntersecting: true }) as IntersectionObserverEntry,
    );
    if (entries.length) this.callback(entries, this as unknown as IntersectionObserver);
  }
}

globalThis.IntersectionObserver =
  FakeIntersectionObserver as unknown as typeof IntersectionObserver;

/**
 * Simulates the user scrolling the end-of-list sentinel into view. By default
 * the next page pushes it back out of view; with `stayInView` it stays visible
 * (a tall screen, or a page that didn't load), so every new observer fires at once.
 */
export function scrollToEnd({ stayInView: stay = false } = {}) {
  stayInView = stay;
  act(() => {
    for (const o of [...observers]) o.trigger();
  });
}

afterEach(() => {
  cleanup();
  observers.clear();
  stayInView = false;
});
