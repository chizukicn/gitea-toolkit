import type { Issue, PullRequest } from "./types";

export function prIndex(pr: PullRequest): number {
  return pr.index ?? pr.number ?? pr.id;
}

export function issueIndex(issue: Issue): number {
  return issue.index ?? issue.number ?? issue.id;
}
