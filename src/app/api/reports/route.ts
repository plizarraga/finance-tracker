import { NextResponse } from "next/server";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { parseDate } from "@/lib/format";
import {
  getReportSummary,
  getMonthlyTrends,
} from "@/features/reports/queries";

export async function GET(request: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const months = searchParams.get("months");

    // If months is provided, return monthly trends
    if (months) {
      const trends = await getMonthlyTrends(parseInt(months, 10));
      return NextResponse.json({ trends });
    }

    // Otherwise, return report summary for date range
    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing from or to date parameters" },
        { status: 400 }
      );
    }

    const dateRange = {
      from: parseDate(from),
      to: parseDate(to),
    };

    const summary = await getReportSummary(dateRange);

    return NextResponse.json(summary);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
