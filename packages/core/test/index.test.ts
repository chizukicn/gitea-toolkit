import type { Issue, PullRequest } from "../src";
import { describe, expect, it } from "vitest";
import {
  GiteaClient,
  issueIndex,
  loadConfig,
  LocalFileConfigStore,
  MemoryConfigStore,
  prIndex,
  resolveContext,
} from "../src";

describe("@gitea-toolkit/core", () => {
  it("exports config helpers", () => {
    const config = loadConfig();
    expect(config).toBeDefined();
    expect(Array.isArray(config.logins ?? [])).toBe(true);
    const store = new LocalFileConfigStore();
    expect(store.getLogins()).toEqual(config.logins ?? []);
  });

  it("giteaClient fromConfig and listLogins via shared store", () => {
    const store = new MemoryConfigStore();
    expect(GiteaClient.fromConfig(store, "__nonexistent__")).toBeNull();
    const login = { name: "test", url: "https://gitea.com", token: "x", default: true };
    store.addLogin(login);
    const client = GiteaClient.fromConfig(store);
    expect(client).not.toBeNull();
    expect(client!.listLogins()).toHaveLength(1);
    expect(client!.listLogins()[0].name).toBe("test");
  });

  it("resolveContext requires store", () => {
    const store = new MemoryConfigStore();
    const ctx = resolveContext(store, { cwd: __dirname });
    expect(ctx === null || typeof ctx === "object").toBe(true);
  });

  it("prIndex / issueIndex fallback", () => {
    const pr = { id: 1, title: "x", state: "open" as const } as PullRequest;
    expect(prIndex(pr)).toBe(1);
    const pr2 = { id: 2, number: 42, title: "y", state: "open" as const } as PullRequest;
    expect(prIndex(pr2)).toBe(42);
    const issue = { id: 3, index: 5, title: "z", state: "closed" as const } as Issue;
    expect(issueIndex(issue)).toBe(5);
  });
});
