declare module "bun:test" {
  export function test(name: string, fn: () => void | Promise<void>): void;
  interface Matchers {
    toEqual(expected: unknown): void;
    toBe(expected: unknown): void;
    toContain(expected: unknown): void;
    toThrow(expected?: unknown): void;
    readonly not: Matchers;
  }
  export function expect(actual: unknown): Matchers;
}
