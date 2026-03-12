/**
 * Local file config: XDG_CONFIG_HOME/tea/config.yml or ~/.tea/tea.yml.
 * Compatible with Go tea. Use TeaFileConfigStore for CLI persistence.
 */

import type { ConfigStore, Login } from "./config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import yaml from "js-yaml";

export interface LocalConfig {
  logins?: Login[];
  preferences?: {
    editor?: boolean;
    flag_defaults?: { remote?: string };
  };
}

const CONFIG_DIR = "tea";
const CONFIG_FILE = "config.yml";
const LEGACY_DIR = ".tea";
const LEGACY_FILE = "tea.yml";

function xdgConfigHome(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg) {
    return xdg;
  }
  return join(homedir(), ".config");
}

function getConfigPath(): string {
  const modern = join(xdgConfigHome(), CONFIG_DIR, CONFIG_FILE);
  if (existsSync(modern)) {
    return modern;
  }
  const legacy = join(homedir(), LEGACY_DIR, LEGACY_FILE);
  if (existsSync(legacy)) {
    return legacy;
  }
  return join(xdgConfigHome(), CONFIG_DIR, CONFIG_FILE);
}

function ensureConfigDir(path: string): void {
  const dir = path.includes(CONFIG_FILE) ? join(path, "..") : path;
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function getConfigPathPublic(): string {
  return getConfigPath();
}

export function loadConfig(): LocalConfig {
  const path = getConfigPath();
  if (!existsSync(path)) {
    return { logins: [] };
  }
  try {
    const raw = readFileSync(path, "utf8");
    const data = yaml.load(raw) as LocalConfig | null;
    return data ?? { logins: [] };
  } catch {
    return { logins: [] };
  }
}

function envLogin(): Login | null {
  const url = process.env.GITEA_URL;
  const token = process.env.GITEA_TOKEN;
  if (!url || !token) {
    return null;
  }
  const baseUrl = url.replace(/\/$/, "");
  return {
    name: process.env.GITEA_LOGIN_NAME ?? new URL(baseUrl).host,
    url: baseUrl,
    token,
    default: true,
    created: Math.floor(Date.now() / 1000),
  };
}

function saveConfigRaw(config: LocalConfig): void {
  const path = getConfigPath();
  ensureConfigDir(path);
  const out = yaml.dump(config, { lineWidth: -1 });
  writeFileSync(path, out, { mode: 0o600 });
}

/** File-based config store (tea config). Use for CLI so logins are persisted. */
export class LocalFileConfigStore implements ConfigStore {
  private readonly envFallback: Login | null = envLogin();

  getLogins(): Login[] {
    const logins = loadConfig().logins ?? [];
    if (logins.length > 0) {
      return logins;
    }
    return this.envFallback ? [this.envFallback] : [];
  }

  getLoginByName(name: string): Login | null {
    return this.getLogins().find((l) => l.name === name) ?? null;
  }

  getDefaultLogin(): Login | null {
    const logins = this.getLogins();
    const def = logins.find((l) => l.default);
    if (def) {
      return def;
    }
    return logins[0] ?? null;
  }

  addLogin(login: Login): void {
    const config = loadConfig();
    const logins = config.logins ?? [];
    if (logins.some((l) => l.name === login.name)) {
      throw new Error(`login name '${login.name}' has already been used`);
    }
    const next = logins.every((l) => l.default !== true) && login.default !== false
      ? { ...login, default: true }
      : login;
    config.logins = [...logins, next];
    saveConfigRaw(config);
  }

  setDefaultLogin(name: string): void {
    const config = loadConfig();
    if ((config.logins ?? []).length === 0 && this.envFallback?.name === name) {
      throw new Error("cannot set default login for env fallback; add it to the config file first");
    }
    const logins = (config.logins ?? []).map((l) => ({
      ...l,
      default: l.name === name,
    }));
    if (!logins.some((l) => l.name === name)) {
      throw new Error(`login '${name}' does not exist`);
    }
    config.logins = logins;
    saveConfigRaw(config);
  }

  deleteLogin(name: string): void {
    const config = loadConfig();
    if ((config.logins ?? []).length === 0 && this.envFallback?.name === name) {
      throw new Error("cannot delete env fallback login; remove env vars or add another login to config file");
    }
    const logins = (config.logins ?? []).filter((l) => l.name !== name);
    if (logins.length === config.logins!.length) {
      throw new Error(`login '${name}' does not exist`);
    }
    if (config.logins?.find((l) => l.name === name)?.default && logins.length > 0) {
      logins[0]!.default = true;
    }
    config.logins = logins;
    saveConfigRaw(config);
  }

  getPreferences(): { flag_defaults?: { remote?: string } } {
    return loadConfig().preferences ?? {};
  }
}
