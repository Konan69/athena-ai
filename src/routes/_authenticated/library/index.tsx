import { createFileRoute } from "@tanstack/react-router";
import { LibraryPage } from "../../../routes/library/-library-page";

export const Route = createFileRoute("/_authenticated/library/")({
  component: LibraryPage,
});
