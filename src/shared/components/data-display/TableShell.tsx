import { type ReactNode } from "react";
import { Platform, ScrollView, View } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { tableStyles } from "./tableStyles";

/**
 * TableShell — visual chrome for any table in the app.
 *
 * Provides the outer border, sticky column header, scrollable body,
 * optional toolbar and footer — all with shared styles from tableStyles.ts.
 *
 * You own the content of every slot; the shell just arranges and styles them.
 *
 * Usage:
 *   <TableShell
 *     toolbar={<MyToolbar />}           // optional — buttons, filters, search
 *     header={<MyHeaderRow />}          // column headers
 *     footer={<MyPagination />}         // optional — pagination, summary
 *   >
 *     {rows.map(r => <MyRow key={r.id} row={r} />)}
 *   </TableShell>
 */

type TableShellProps = {
  /** Rendered above the table border — toolbar, search, bulk actions, etc. */
  toolbar?: ReactNode;
  /** Sticky column header rendered inside the border */
  header?: ReactNode;
  /** Table rows — rendered in a scrollable body */
  children: ReactNode;
  /** Rendered below the rows, inside the border — pagination, totals, etc. */
  footer?: ReactNode;
  /** Remove the outer border + border-radius (e.g. when nested inside a Card) */
  borderless?: boolean;
};

const isWeb = Platform.OS === "web";

export function TableShell({
  toolbar,
  header,
  children,
  footer,
  borderless = false,
}: TableShellProps) {
  const c = useColors();

  return (
    <View>
      {/* Toolbar lives outside the table border */}
      {toolbar && (
        <View
          style={[
            tableStyles.toolbar,
            { borderBottomColor: c.border, backgroundColor: c.background },
          ]}
        >
          {toolbar}
        </View>
      )}

      {/* Table border */}
      <View
        style={[
          !borderless && tableStyles.wrapper,
          !borderless && { borderColor: c.border },
        ]}
        // @ts-ignore — web-only ARIA
        role={isWeb ? "table" : undefined}
        accessibilityLabel="Table"
      >
        <ScrollView
          stickyHeaderIndices={header ? [0] : undefined}
          showsVerticalScrollIndicator={false}
        >
          {/* Sticky header */}
          {header && (
            <View
              style={[
                tableStyles.headerRow,
                {
                  backgroundColor: c.backgroundStrong,
                  borderBottomColor: c.border,
                },
              ]}
              // @ts-ignore
              role={isWeb ? "row" : undefined}
            >
              {header}
            </View>
          )}

          {/* Rows */}
          {children}
        </ScrollView>

        {/* Footer (pagination, totals) */}
        {footer && (
          <View style={[tableStyles.pagination, { borderTopColor: c.border }]}>
            {footer}
          </View>
        )}
      </View>
    </View>
  );
}
