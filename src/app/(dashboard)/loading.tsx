import { SkeletonSummaryCard, SkeletonAccountCard } from "@/components/shared/skeleton-card"
import { SkeletonTable } from "@/components/shared/skeleton-table"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonSummaryCard key={i} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />
        ))}
      </div>

      {/* Account Balances */}
      <div className="space-y-4">
        <div className="h-6 w-40 bg-muted animate-pulse rounded-md" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonAccountCard key={i} />
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-muted animate-pulse rounded-md" />
        <SkeletonTable rows={5} columns={4} />
      </div>
    </div>
  )
}
