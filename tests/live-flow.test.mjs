import assert from "node:assert/strict";
import test from "node:test";

const API_URL = process.env.ADMINO_API_URL ?? "http://localhost:3000/api/v1";
const ADMIN_USER = process.env.ADMINO_ADMIN_USER ?? "superadmin";
const ADMIN_PASSWORD = process.env.ADMINO_ADMIN_PASSWORD ?? "Admin1234!";
const createdAccountIds = new Set();

async function api(path, options = {}, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} -> ${res.status}: ${text}`);
  }
  return body?.data ?? body;
}

async function createAccount(adminToken, prefix) {
  const slug = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const account = await api("/admin/clients", {
    method: "POST",
    body: {
      name: slug,
      slug,
      tipo: "gym",
      ownerName: "Smoke Owner",
      ownerPassword: "Owner1234!",
      clientPermissions: ["athlete_dashboard", "athlete_tracker"],
      memberPermissions: ["athlete_tracker"],
    },
  }, adminToken);
  createdAccountIds.add(account.id);
  const owner = await api("/auth/login", {
    method: "POST",
    body: { username: slug, password: "Owner1234!" },
  });
  assert.equal(account.slug, slug);
  assert.equal(owner.user.role, "OWNER");
  return { account, owner, slug };
}

async function loginAdmin() {
  const admin = await api("/auth/login", {
    method: "POST",
    body: { username: ADMIN_USER, password: ADMIN_PASSWORD },
  });
  assert.equal(admin.user.role, "SYSTEM_ADMIN");
  return admin;
}

test.after(async () => {
  if (createdAccountIds.size === 0) return;
  const admin = await loginAdmin();
  for (const id of createdAccountIds) {
    await api(`/admin/clients/${id}`, { method: "DELETE" }, admin.token).catch(() => {});
  }
});

test("live account, plan assignment, and athlete activity flow", async () => {
  const stamp = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const admin = await loginAdmin();
  const { owner, slug } = await createAccount(admin.token, "smoke");

  const rawAthleteUsername = `athlete${stamp}`;
  const athlete = await api("/members", {
    method: "POST",
    body: {
      name: "Smoke",
      lastname: "Athlete",
      birthdate: "2000-01-01",
      username: rawAthleteUsername,
      password: "Athlete1234!",
    },
  }, owner.token);
  assert.equal(athlete.username, `${slug}-${rawAthleteUsername}`);

  const plan = await api("/training-plans", {
    method: "POST",
    body: {
      name: "Smoke Plan",
      cells: { [today]: "Fuerza\nSentadilla 4x8\nPress 3x10\ntrote 20min" },
    },
  }, owner.token);

  await api("/training-plans/assign", {
    method: "POST",
    body: { memberId: athlete.id, planId: plan.id },
  }, owner.token);

  const athleteLogin = await api("/auth/login", {
    method: "POST",
    body: { username: athlete.username, password: "Athlete1234!" },
  });
  await api("/workout-checks", {
    method: "POST",
    body: { date: today, itemIndex: 0, completed: true },
  }, athleteLogin.token);
  await api("/workout-feedback", {
    method: "POST",
    body: { date: today, rpe: 7, notes: "Smoke notes" },
  }, athleteLogin.token);

  const activity = await api(`/training-plans/activity/${athlete.id}?date=${today}`, {}, owner.token);
  assert.equal(activity.plan.name, "Smoke Plan");
  assert.equal(activity.checks.filter((check) => check.completed).length, 1);
  assert.equal(activity.feedback.rpe, 7);
  assert.equal(activity.feedback.notes, "Smoke notes");
});

test("training plan assignment rejects cross-account members", async () => {
  const admin = await loginAdmin();
  const a = await createAccount(admin.token, "tenant-a");
  const b = await createAccount(admin.token, "tenant-b");
  const athlete = await api("/members", {
    method: "POST",
    body: {
      name: "Tenant",
      lastname: "A",
      birthdate: "2000-01-01",
      username: "athlete",
      password: "Athlete1234!",
    },
  }, a.owner.token);
  const foreignPlan = await api("/training-plans", {
    method: "POST",
    body: { name: "Tenant B Plan", cells: {} },
  }, b.owner.token);

  await assert.rejects(
    () => api("/training-plans/assign", {
      method: "POST",
      body: { memberId: athlete.id, planId: foreignPlan.id },
    }, b.owner.token),
    /403/,
  );
});
