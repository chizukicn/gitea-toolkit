#!/usr/bin/env node
/**
 * tea - TypeScript CLI for Gitea
 * Compatible with https://gitea.com/gitea/tea
 */

import { LocalFileConfigStore } from "@gitea-toolkit/core";
import { cac } from "cac";
import pkg from "../package.json";
import { registerIssuesCommands } from "./commands/issues";
import { registerLoginCommands } from "./commands/login";
import { registerOpenCommand } from "./commands/open";
import { registerPullsCommands } from "./commands/pulls";
import { registerWhoamiCommand } from "./commands/whoami";

const cli = cac("tea");

cli
  .version(pkg.version)
  .help();

const store = new LocalFileConfigStore();
registerLoginCommands(cli, store);
registerWhoamiCommand(cli, store);
registerIssuesCommands(cli, store);
registerPullsCommands(cli, store);
registerOpenCommand(cli, store);

cli.parse();
