import type { ConfigStore } from "@gitea-toolkit/core";
import type { CAC } from "cac";
import process, { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { GiteaClient } from "@gitea-toolkit/core";

async function ask(question: string, def?: string): Promise<string> {
  const rl = readline.createInterface({ input, output });
  const prompt = def !== undefined ? `${question} [${def}]: ` : `${question}: `;
  const s = await rl.question(prompt);
  rl.close();
  return (s.trim() || (def ?? "")).trim();
}

async function runLoginAdd(
  store: ConfigStore,
  options: { name?: string; url?: string; token?: string }
) {
  let url = options.url ?? await ask("Gitea server URL");
  const token = options.token ?? await ask("Application token (from Settings → Applications)");
  const name = options.name ?? await ask("Login name", new URL(url).host);

  url = url.replace(/\/$/, "");
  if (!url || !token) {
    console.error("Error: URL and token are required.");
    process.exit(1);
  }

  try {
    const defaultFirst = store.getLogins().length === 0;
    const client = await GiteaClient.login({
      url,
      token,
      name,
      default: defaultFirst,
      store,
    });
    const user = await client.getCurrentUser();
    console.log(`Login as ${user.login ?? user.username} on ${url} successful. Added this login as ${name}`);
  } catch (e) {
    console.error("Error:", (e as Error).message);
    process.exit(1);
  }
}

export function registerLoginCommands(cli: CAC, store: ConfigStore) {
  cli
    .command("login [...args]", "Log in to a Gitea server")
    .alias("logins")
    .option("--name <name>", "Login profile name (for add)")
    .option("--url <url>", "Gitea server URL (for add)")
    .option("--token <token>", "Application token (for add)")
    .action(async (args: string[], options: { name?: string; url?: string; token?: string }) => {
      const sub = args[0];
      if (sub === "add") {
        await runLoginAdd(store, options);
        return;
      }
      if (sub === "list" || sub === "ls") {
        const logins = store.getLogins();
        if (logins.length === 0) {
          console.log("No logins. Use 'tea login add' to add one.");
          return;
        }
        for (const l of logins) {
          const def = l.default ? " (default)" : "";
          console.log(`  ${l.name}  ${l.url}  ${l.user ?? ""}${def}`);
        }
        return;
      }
      if (sub === "default") {
        const name = args[1];
        if (!name) {
          console.error("Error: login default <name>");
          process.exit(1);
        }
        try {
          store.setDefaultLogin(name);
          console.log(`Default login set to ${name}`);
        } catch (e) {
          console.error((e as Error).message);
          process.exit(1);
        }
        return;
      }
      if (sub === "delete" || sub === "remove") {
        const name = args[1];
        if (!name) {
          console.error("Error: login delete <name>");
          process.exit(1);
        }
        try {
          store.deleteLogin(name);
          console.log(`Login ${name} removed`);
        } catch (e) {
          console.error((e as Error).message);
          process.exit(1);
        }
        return;
      }
      // no subcommand or unknown: list logins
      const logins = store.getLogins();
      if (logins.length === 0) {
        console.log("No logins. Use 'tea login add' to add one.");
        return;
      }
      console.log("Logins:");
      for (const l of logins) {
        const def = l.default ? " (default)" : "";
        console.log(`  ${l.name}  ${l.url}  ${l.user ?? ""}${def}`);
      }
    });

  cli
    .command("logout", "Log out (remove default or specified login)")
    .option("--name <name>", "Login to remove")
    .action((options: { name?: string }) => {
      const name = options.name ?? store.getDefaultLogin()?.name;
      if (!name) {
        console.log("No login to remove.");
        return;
      }
      try {
        store.deleteLogin(name);
        console.log(`Logged out: ${name}`);
      } catch (e) {
        console.error((e as Error).message);
        process.exit(1);
      }
    });
}
