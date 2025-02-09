import { useQuery } from "@tanstack/react-query";
import { PickupRequest } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { WrenchIcon, CheckCircle2Icon, ClockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TechnicianDashboard() {
  const { data: repairTasks } = useQuery<PickupRequest[]>({
    queryKey: ["/api/repair-tasks"],
  });

  const updateTaskStatus = async (id: number, status: string) => {
    try {
      await apiRequest("PATCH", `/api/repair-tasks/${id}/status`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-tasks"] });
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const pendingTasks = repairTasks?.filter((t) => t.status === "PENDING") || [];
  const inProgressTasks = repairTasks?.filter((t) => t.status === "IN_PROGRESS") || [];
  const completedTasks = repairTasks?.filter((t) => t.status === "COMPLETED") || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WrenchIcon className="h-5 w-5" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inProgressTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2Icon className="h-5 w-5" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedTasks.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repair Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Item Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repairTasks?.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Badge variant={
                      task.status === "COMPLETED" ? "default" :
                      task.status === "IN_PROGRESS" ? "secondary" : "outline"
                    }>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.items[0]?.type}</TableCell>
                  <TableCell>{task.items[0]?.description}</TableCell>
                  <TableCell>
                    {task.status === "PENDING" && (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, "IN_PROGRESS")}
                      >
                        Start Repair
                      </Button>
                    )}
                    {task.status === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, "COMPLETED")}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
