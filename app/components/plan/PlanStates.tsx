import { useT } from "@agent-native/core/client/i18n";
import { Link } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";

export function PlanSkeleton() {
  return (
    <div className="grid h-full grid-cols-1 gap-3 p-3 lg:grid-cols-[15rem_minmax(0,1fr)_17rem]">
      <Skeleton className="hidden rounded-lg lg:block" />
      <Skeleton className="min-h-[22rem] rounded-lg" />
      <Skeleton className="hidden rounded-lg lg:block" />
    </div>
  );
}

export function PlanNotFound({ message }: { message: string | undefined }) {
  const t = useT();
  return (
    <main className="p-6 text-sm">
      <p className="text-muted-foreground">{message ?? t("plan.notFound")}</p>
      <Link className="mt-3 inline-block underline" to="/events">
        {t("plan.backToEvents")}
      </Link>
    </main>
  );
}
