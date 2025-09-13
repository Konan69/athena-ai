import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { trpc } from "@/integrations/tanstack-query/root-provider"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { LibraryTable } from "@/components/library-table"
import InputModal from "@/components/input-modal"
import { AgentAssignmentDialog } from "@/components/agent-assignment-dialog"
import { useQueryErrorResetBoundary } from "@tanstack/react-query"
import {
  Upload,
  BookOpen,
  BookHeartIcon,
  Users,
} from "lucide-react"

export const Route = createFileRoute("/_authenticated/library")({
  loader: async ({ context }) => {
    const trpc = context.trpc
    const qc = context.queryClient
    const data = await qc.ensureQueryData(
      trpc.library.getLibraryItems.queryOptions()
    )
    return { data }
  },
  pendingComponent: () => <div>Loading...</div>,
  errorComponent: ({ error, reset }) => {
    const router = useRouter()
    const queryErrorResetBoundary = useQueryErrorResetBoundary()

    useEffect(() => {
      queryErrorResetBoundary.reset()
    }, [queryErrorResetBoundary])
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              router.invalidate()
              reset()
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  },
  component: () => <LibraryPage />,
})

export function LibraryPage() {
  const { data: initial } = Route.useLoaderData()
  const itemsQuery = useQuery(trpc.library.getLibraryItems.queryOptions())
  const items = itemsQuery.data ?? initial
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false)
  const [selectedItemsForAssignment, setSelectedItemsForAssignment] = useState<string[]>([])

  // Mock agents for now - in real implementation, this would come from API
  const [agents] = useState([
    { id: "1", name: "Support Agent", agentType: "support", isActive: true },
    { id: "2", name: "WhatsApp Bot", agentType: "whatsapp", isActive: true },
  ])

  const handleUploadComplete = (newItem: {
    title: string
    description: string
    fileSize: number
    tags?: string[]
    uploadLink: string
  }) => {
    // The modal handles the query invalidation
    setIsModalOpen(false)
  }

  const handleDelete = async (itemIds: string[]) => {
    // TODO: Implement delete functionality
    console.log("Deleting items:", itemIds)
  }

  const handleEdit = (item: any) => {
    // TODO: Implement edit functionality
    console.log("Editing item:", item)
  }

  const handleDownload = (item: any) => {
    // TODO: Implement download functionality
    console.log("Downloading item:", item)
  }

  const handleAssignToAgent = (itemIds: string[], agentId: string) => {
    // TODO: Implement agent assignment functionality
    console.log("Assigning items", itemIds, "to agent", agentId)
  }

  const handleBulkAssign = (agentIds: string[], itemIds: string[]) => {
    // TODO: Implement bulk agent assignment functionality
    console.log("Bulk assigning items", itemIds, "to agents", agentIds)
  }

  if (items.length === 0) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <EmptyState
              title="No documents in your library"
              description="Upload your first document to start building your knowledge base. PDF, DOCX, TXT, and MD files up to 10MB are supported."
              icons={[BookOpen, BookHeartIcon, Users]}
              action={{
                label: "Upload Document",
                onClick: () => setIsModalOpen(true),
              }}
            />
          </div>
        </div>
        <InputModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onComplete={handleUploadComplete}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex-1 ">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Library</h1>
              <p className="text-muted-foreground mt-2">
                Manage your knowledge base and assign documents to AI agents
              </p>
            </div>
          </div>

          {/* Library Table */}
          <LibraryTable
            items={items}
            onUploadClick={() => setIsModalOpen(true)}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onDownload={handleDownload}
            onAssignToAgent={(itemIds, agentId) => {
              setSelectedItemsForAssignment(itemIds)
              setIsAgentDialogOpen(true)
            }}
          />
        </div>
      </div>

      {/* Upload Modal */}
      <InputModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onComplete={handleUploadComplete}
      />

      {/* Agent Assignment Dialog */}
      <AgentAssignmentDialog
        isOpen={isAgentDialogOpen}
        onOpenChange={setIsAgentDialogOpen}
        agents={agents}
        selectedItems={selectedItemsForAssignment}
        onAssign={handleBulkAssign}
      />
    </>
  )
}