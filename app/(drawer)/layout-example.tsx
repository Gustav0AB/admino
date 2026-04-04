/**
 * Layout Example — "User Ledger"
 * ─────────────────────────────────────────────────────────────────────────────
 * Demonstrates FeatureShell with:
 *   • Two URL-driven tabs: "Active Users" / "Archived"
 *   • Inline filter bar (desktop) → bottom-drawer (mobile)
 *   • Table action ("Add User") that transforms into a Bulk Action Bar
 *   • DataTable as the main content slot
 *   • Info cards in the sidebar (peek pattern on mobile)
 */

import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { FeatureShell, type TabConfig, type SaveAction } from "@/shared/components/shell";
import { useUrlState } from "@/shared/hooks/useUrlState";
import { useColors } from "@/shared/hooks/useColors";
import {
  Card,
  CustomButton,
  CustomSearch,
  CustomSelect,
  DataTable,
  StatusBadge,
  type Column,
} from "@/shared/components";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

// ─── Mock data ────────────────────────────────────────────────────────────────

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending" | "cancelled";
  joined: string;
};

const ACTIVE_USERS: User[] = [
  { id: "1", name: "Alice Martin",    email: "alice@acme.com",   role: "Admin",   status: "active",    joined: "Jan 12, 2024" },
  { id: "2", name: "Bob Torres",      email: "bob@acme.com",     role: "Editor",  status: "active",    joined: "Mar 3, 2024"  },
  { id: "3", name: "Carol Singh",     email: "carol@acme.com",   role: "Viewer",  status: "pending",   joined: "Apr 18, 2024" },
  { id: "4", name: "David Kim",       email: "david@acme.com",   role: "Editor",  status: "active",    joined: "May 1, 2024"  },
  { id: "5", name: "Eva Novak",       email: "eva@acme.com",     role: "Viewer",  status: "active",    joined: "Jun 9, 2024"  },
];

const ARCHIVED_USERS: User[] = [
  { id: "6", name: "Frank Liu",       email: "frank@acme.com",   role: "Editor",  status: "cancelled", joined: "Feb 7, 2023"  },
  { id: "7", name: "Grace Okonkwo",   email: "grace@acme.com",   role: "Viewer",  status: "cancelled", joined: "Aug 14, 2023" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Active",       value: "active" },
  { label: "Pending",      value: "pending" },
  { label: "Cancelled",    value: "cancelled" },
];

const ROLE_OPTIONS = [
  { label: "All Roles", value: "" },
  { label: "Admin",     value: "Admin" },
  { label: "Editor",    value: "Editor" },
  { label: "Viewer",    value: "Viewer" },
];

function UserFilters() {
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("");
  const [role,   setRole]     = useState("");

  return (
    <>
      <CustomSearch
        value={search}
        onChangeText={setSearch}
        placeholder="Search users…"
        style={{ flex: 1, minWidth: 180, maxWidth: 280 }}
      />
      <CustomSelect
        value={status}
        onChange={(v) => setStatus(String(v))}
        options={STATUS_OPTIONS}
        placeholder="Status"
        style={{ minWidth: 140 }}
      />
      <CustomSelect
        value={role}
        onChange={(v) => setRole(String(v))}
        options={ROLE_OPTIONS}
        placeholder="Role"
        style={{ minWidth: 120 }}
      />
    </>
  );
}

function UserSidebarCards() {
  const c = useColors();
  return (
    <>
      {/* Summary card */}
      <Card variant="elevated" style={styles.sidebarCard}>
        <Text style={[styles.cardTitle, { color: c.textMuted }]}>Total Users</Text>
        <Text style={[styles.cardStat, { color: c.text }]}>
          {ACTIVE_USERS.length + ARCHIVED_USERS.length}
        </Text>
        <Text style={[styles.cardSub, { color: c.textMuted }]}>
          {ACTIVE_USERS.length} active · {ARCHIVED_USERS.length} archived
        </Text>
      </Card>

      {/* Role breakdown card */}
      <Card variant="outlined" style={styles.sidebarCard}>
        <Text style={[styles.cardTitle, { color: c.textMuted }]}>By Role</Text>
        {["Admin", "Editor", "Viewer"].map((r) => {
          const count = ACTIVE_USERS.filter((u) => u.role === r).length;
          return (
            <View key={r} style={styles.cardRow}>
              <Text style={[styles.cardRowLabel, { color: c.text }]}>{r}</Text>
              <Text style={[styles.cardRowValue, { color: c.textMuted }]}>{count}</Text>
            </View>
          );
        })}
      </Card>

      {/* Quick tip card */}
      <Card variant="filled" style={styles.sidebarCard}>
        <Text style={[styles.cardTitle, { color: c.textMuted }]}>Tip</Text>
        <Text style={[styles.cardBody, { color: c.text }]}>
          Select rows to reveal bulk actions like export or batch delete.
        </Text>
      </Card>
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const TABS: TabConfig[] = [
  { key: "active",   label: "Active Users",  badge: ACTIVE_USERS.length   },
  { key: "archived", label: "Archived",      badge: ARCHIVED_USERS.length },
];

const SAVE_ACTIONS: SaveAction[] = [
  { label: "Export CSV", onClick: () => alert("Exporting…"),      type: "secondary" },
  { label: "Add User",   onClick: () => alert("Opening form…"),   type: "primary"   },
];

const USER_COLUMNS: Column<User>[] = [
  { key: "name",   header: "Name",   flex: 2 },
  { key: "email",  header: "Email",  flex: 3 },
  { key: "role",   header: "Role",   flex: 1 },
  {
    key: "status",
    header: "Status",
    flex: 1,
    render: (value) => (
      <StatusBadge status={value as User["status"]} />
    ),
  },
  { key: "joined", header: "Joined", flex: 2 },
];

export default function LayoutExampleScreen() {
  const c = useColors();

  const [activeTab, setActiveTab] = useUrlState("view", "active");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const currentData = activeTab === "archived" ? ARCHIVED_USERS : ACTIVE_USERS;

  const toggleRow = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const bulkActions = (
    <>
      <CustomButton
        variant="ghost"
        size="sm"
        onPress={() => { alert(`Exporting ${selectedIds.size} users…`); setSelectedIds(new Set()); }}
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" }}
      >
        <Text style={{ color: "#fff", fontSize: 14 }}>Export</Text>
      </CustomButton>
      <CustomButton
        variant="ghost"
        size="sm"
        onPress={() => { alert(`Deleting ${selectedIds.size} users…`); setSelectedIds(new Set()); }}
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" }}
      >
        <Text style={{ color: "#fff", fontSize: 14 }}>Delete</Text>
      </CustomButton>
      <CustomButton
        variant="ghost"
        size="sm"
        onPress={() => setSelectedIds(new Set())}
      >
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>Clear</Text>
      </CustomButton>
    </>
  );

  return (
    <FeatureShell
      // ── Row 1
      title="User Ledger"
      saveActions={SAVE_ACTIONS}
      // ── Row 2
      tabs={TABS}
      tabUrlKey="view"
      activeTab={activeTab}
      onTabChange={(key) => { setActiveTab(key); setSelectedIds(new Set()); }}
      // ── Row 3
      filters={<UserFilters />}
      // ── Row 4 — only visible when rows are selected
      selectedCount={selectedIds.size}
      bulkActions={bulkActions}
      // ── Row 5 sidebar
      sidebarCards={<UserSidebarCards />}
    >
      {/* ── Row 5 main — DataTable */}
      <DataTable
        data={currentData}
        columns={USER_COLUMNS}
        keyExtractor={(u) => u.id}
        emptyText={
          activeTab === "archived"
            ? "No archived users found."
            : "No active users found."
        }
        renderActions={(user) => (
          <View style={styles.rowActions}>
            <CustomButton
              variant={selectedIds.has(user.id) ? "primary" : "outline"}
              size="sm"
              onPress={() => toggleRow(user.id)}
            >
              {selectedIds.has(user.id) ? "✓ Selected" : "Select"}
            </CustomButton>
            <CustomButton
              variant="ghost"
              size="sm"
              onPress={() => alert(`Edit ${user.name}`)}
            >
              Edit
            </CustomButton>
          </View>
        )}
      />
    </FeatureShell>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Sidebar cards — fixed width so the mobile peek works correctly
  sidebarCard: {
    width: 220,
    gap: SPACING.xs,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  cardStat: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    letterSpacing: -1,
  },
  cardSub: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  cardRowLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  cardRowValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  cardBody: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.5,
  },
  rowActions: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
});
