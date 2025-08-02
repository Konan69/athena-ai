import { createFileRoute } from "@tanstack/react-router";
import { LibraryPage } from "./library/-library-page";
import { useTRPC } from "@/config/trpc";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/library")({
  component: () => <LibraryPage />,
});
