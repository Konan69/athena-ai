import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/invitations/$invitationId/accept")({
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { invitationId } = Route.useParams();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Organization Invitation</CardTitle>
          <CardDescription>
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Invitation ID: {invitationId}</p>
          </div>

          <div className="space-y-2">
            <Button className="w-full">Accept Invitation</Button>
            <Button variant="outline" className="w-full">
              Decline Invitation
            </Button>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




