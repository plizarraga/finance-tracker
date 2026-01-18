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

    const shouldIncludeTrends = Boolean(months);
    const shouldIncludeSummary = Boolean(from && to);
    const monthsValue = months ? parseInt(months, 10) : 0;
    const normalizedMonths = Number.isFinite(monthsValue) ? monthsValue : 0;
    const trendsPromise = shouldIncludeTrends
      ? getMonthlyTrends(normalizedMonths || 12)
      : Promise.resolve(null);

    if (shouldIncludeSummary) {
      const dateRange = {
        from: parseDate(from!),
        to: parseDate(to!),
      };
      const [summary, trends] = await Promise.all([
        getReportSummary(dateRange),
        trendsPromise,
      ]);
      return NextResponse.json({
        summary,
        ...(trends ? { trends } : {}),
      });
    }

    if (shouldIncludeTrends) {
      const trends = await trendsPromise;
      return NextResponse.json({ trends });
    }

    return NextResponse.json(
      { error: "Missing from/to or months parameters" },
      { status: 400 }
    );
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
