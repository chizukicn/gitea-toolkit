/**
 * Config: login store interface and in-memory implementation.
 * For file-based store (tea config), see local-file-config.ts.
 */

export interface Login {
  name: string;
  url: string;
  token: string;
  default?: boolean;
  user?: string;
  created?: number;
  insecure?: boolean;
}

/** Adapter for storing and resolving logins (memory, file, etc.). */
export interface ConfigStore {
  getLogins: () => Login[];
  getLoginByName: (name: string) => Login | null;
  getDefaultLogin: () => Login | null;
  addLogin: (login: Login) => void;
  setDefaultLogin: (name: string) => void;
  deleteLogin: (name: string) => void;
  /** Optional: e.g. default remote name for git. */
  getPreferences?: () => { flag_defaults?: { remote?: string } };
}

/** In-memory store. No persistence. */
export class MemoryConfigStore implements ConfigStore {
  private logins: Login[] = [];
  private defaultName: string | null = null;

  getLogins(): Login[] {
    return this.logins.map((l) => ({ ...l }));
  }

  getLoginByName(name: string): Login | null {
    const l = this.logins.find((x) => x.name === name);
    return l ? { ...l } : null;
  }

  getDefaultLogin(): Login | null {
    if (this.logins.length === 0) {
      return null;
    }
    const def = this.defaultName
      ? this.logins.find((l) => l.name === this.defaultName)
      : this.logins.find((l) => l.default) ?? this.logins[0];
    return def ? { ...def } : null;
  }

  addLogin(login: Login): void {
    if (this.logins.some((l) => l.name === login.name)) {
      throw new Error(`login name '${login.name}' has already been used`);
    }
    const next = { ...login, created: login.created ?? Math.floor(Date.now() / 1000) };
    const hasDefault = this.logins.some((l) => l.default) || this.defaultName != null;
    if (!hasDefault && next.default !== false) {
      next.default = true;
      this.defaultName = next.name;
    } else if (next.default) {
      this.defaultName = next.name;
      this.logins = this.logins.map((l) => ({ ...l, default: l.name === next.name }));
    }
    this.logins.push(next);
  }

  setDefaultLogin(name: string): void {
    if (!this.logins.some((l) => l.name === name)) {
      throw new Error(`login '${name}' does not exist`);
    }
    this.defaultName = name;
    this.logins = this.logins.map((l) => ({ ...l, default: l.name === name }));
  }

  deleteLogin(name: string): void {
    const idx = this.logins.findIndex((l) => l.name === name);
    if (idx === -1) {
      throw new Error(`login '${name}' does not exist`);
    }
    const wasDefault = this.logins[idx]!.default || this.defaultName === name;
    this.logins.splice(idx, 1);
    if (wasDefault && this.logins.length > 0) {
      this.defaultName = this.logins[0]!.name;
      this.logins[0]!.default = true;
    } else if (this.logins.length === 0) {
      this.defaultName = null;
    }
  }

  getPreferences(): { flag_defaults?: { remote?: string } } {
    return {};
  }
}
