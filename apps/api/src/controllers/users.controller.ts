import type { Context } from "hono";
import type {
  CreateUser as CreateUserInput,
  UpdateUser as UpdateUserInput,
} from "@workspace/validators";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/utils/api-response.js";

export async function listUsers(c: Context) {
  return sendSuccess(c, { users: [] }, STATUS_CODES.OK);
}

export async function createUser(c: Context, payload: CreateUserInput) {
  return sendSuccess(c, { user: payload }, STATUS_CODES.CREATED);
}

export async function updateUser(c: Context, id: string, payload: UpdateUserInput) {
  return sendSuccess(c, { user: { id, ...payload } }, STATUS_CODES.OK);
}
