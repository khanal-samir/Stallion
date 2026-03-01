import { webEnvSchema } from "@workspace/validators";

const rawEnv = {
  NEXT_PUBLIC_API_URL: process.env["NEXT_PUBLIC_API_URL"],
};

const parsedEnv = webEnvSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => {
      const key = issue.path.length > 0 ? issue.path.join(".") : "env";
      return `${key}: ${issue.message}`;
    })
    .join("\n");

  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsedEnv.data;
export type Env = typeof env;
