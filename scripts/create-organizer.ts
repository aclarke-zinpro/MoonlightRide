import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { createOrganizer } from "../src/server/services/organizer";

/** Usage: npm run organizer:create -- --email you@example.com --name "Adam Clarke" */
function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

/** Reads answers without echoing them. One reader serves every prompt so piped input works too. */
function hiddenPrompter() {
  let muted = false;
  const output = new Writable({
    write(chunk, _encoding, callback) {
      if (!muted) process.stdout.write(chunk);
      callback();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
  const lines: string[] = [];
  const waiting: ((line: string) => void)[] = [];
  rl.on("line", (line) => {
    const next = waiting.shift();
    if (next) next(line);
    else lines.push(line);
  });
  return {
    ask(question: string): Promise<string> {
      muted = false;
      process.stdout.write(question);
      muted = true;
      const buffered = lines.shift();
      if (buffered !== undefined) {
        process.stdout.write("\n");
        return Promise.resolve(buffered);
      }
      return new Promise((resolve) =>
        waiting.push((line) => {
          process.stdout.write("\n");
          resolve(line);
        }),
      );
    },
    close: () => rl.close(),
  };
}

async function main() {
  const email = arg("email");
  const name = arg("name");
  if (!email || !name) {
    console.error('Usage: npm run organizer:create -- --email you@example.com --name "Your Name"');
    process.exit(1);
  }
  const prompt = hiddenPrompter();
  const password = await prompt.ask("Password (at least 12 characters): ");
  const confirm = await prompt.ask("Repeat password: ");
  prompt.close();
  if (password !== confirm) {
    console.error("Passwords do not match.");
    process.exit(1);
  }
  const organizer = await createOrganizer({ email, name, password });
  console.log(`Created organizer account for ${organizer.email}.`);
  process.exit(0);
}

main().catch((error) => {
  // Database errors include query parameters (such as the password hash), so only print ours.
  const message = error instanceof Error && !/Failed query/i.test(error.message) ? error.message : "database error";
  console.error(`Could not create organizer: ${message}`);
  process.exit(1);
});
