import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getReportSummary,
  getMonthlyTrends,
} from "@/features/reports/queries";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const months = searchParams.get("months");

    // If months is provided, return monthly trends
    if (months) {
      const trends = await getMonthlyTrends(
        session.user.id,
        parseInt(months, 10)
      );
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
      from: new Date(from),
      to: new Date(to),
    };

    const summary = await getReportSummary(session.user.id, dateRange);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
