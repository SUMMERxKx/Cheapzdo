import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "./GeneralSettings";
import { StatusEditor } from "./StatusEditor";
import { TypeEditor } from "./TypeEditor";
import { DangerZone } from "./DangerZone";
import { MembersPanel } from "@/features/members/MembersPanel";
import { TeamsPanel } from "@/features/members/TeamsPanel";
import { usePermissions } from "@/features/members/usePermissions";

export default function BoardSettingsPage() {
  const { boardId } = useParams();
  const { isOwner } = usePermissions(boardId);
  if (!boardId) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Board settings</h1>
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
          {isOwner && <TabsTrigger value="danger">Danger</TabsTrigger>}
        </TabsList>
        <TabsContent value="general" className="pt-5">
          <GeneralSettings boardId={boardId} />
        </TabsContent>
        <TabsContent value="members" className="pt-5">
          <MembersPanel boardId={boardId} />
        </TabsContent>
        <TabsContent value="teams" className="pt-5">
          <TeamsPanel boardId={boardId} />
        </TabsContent>
        <TabsContent value="statuses" className="pt-5">
          <StatusEditor boardId={boardId} />
        </TabsContent>
        <TabsContent value="types" className="pt-5">
          <TypeEditor boardId={boardId} />
        </TabsContent>
        {isOwner && (
          <TabsContent value="danger" className="pt-5">
            <DangerZone boardId={boardId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
