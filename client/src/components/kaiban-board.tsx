import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  Pause, 
  RotateCcw,
  Users,
  Activity,
  ArrowRight,
  Bot,
  Eye,
  Trash2
} from 'lucide-react';

interface KaibanTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  agent?: string;
  startedAt?: string;
  completedAt?: string;
  progress?: number;
}

interface KaibanAgent {
  name: string;
  role: string;
  status: 'idle' | 'busy' | 'completed';
  currentTask?: string;
}

interface KaibanWorkflowState {
  currentTask?: string;
  activeTasks: string[];
  completedTasks: string[];
  failedTasks: string[];
}

interface KaibanBoardProps {
  jobId: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  workflowStatus?: KaibanWorkflowState;
  onCancel?: (jobId: string) => void;
  onViewResults?: (jobId: string) => void;
  config?: {
    focusTopic?: string;
    topic?: string;
    type?: string;
  };
}

const WORKFLOW_STAGES = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 border-gray-300' },
  { id: 'inprogress', title: 'In Progress', color: 'bg-blue-100 border-blue-300' },
  { id: 'review', title: 'Review', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'done', title: 'Done', color: 'bg-green-100 border-green-300' }
];

const AGENTS: KaibanAgent[] = [
  { name: 'NewsResearcher', role: 'AI News Research Specialist', status: 'idle' },
  { name: 'KnowledgeResearcher', role: 'Latest Knowledge Research Specialist', status: 'idle' },
  { name: 'ContentGenerator', role: 'AI Content Creation Specialist', status: 'idle' },
  { name: 'ContentReviewer', role: 'Quality Assurance Specialist', status: 'idle' },
  { name: 'ContentEnhancer', role: 'Content Optimization Specialist', status: 'idle' }
];

export const KaibanBoard: React.FC<KaibanBoardProps> = ({
  jobId,
  status,
  progress,
  workflowStatus,
  onCancel,
  onViewResults,
  config
}) => {
  const [tasks, setTasks] = useState<KaibanTask[]>([]);
  const [agents, setAgents] = useState<KaibanAgent[]>(AGENTS);

  // Update tasks based on workflow status
  useEffect(() => {
    if (!workflowStatus) return;

    const newTasks: KaibanTask[] = [];
    
    // Add completed tasks
    workflowStatus.completedTasks.forEach((taskTitle, index) => {
      newTasks.push({
        id: `completed-${index}`,
        title: taskTitle,
        description: `Completed task: ${taskTitle}`,
        status: 'completed',
        completedAt: new Date().toISOString()
      });
    });

    // Add active tasks
    workflowStatus.activeTasks.forEach((taskTitle, index) => {
      newTasks.push({
        id: `active-${index}`,
        title: taskTitle,
        description: `Currently executing: ${taskTitle}`,
        status: 'active',
        startedAt: new Date().toISOString(),
        progress: Math.min(progress + 10, 95) // Estimate progress
      });
    });

    // Add failed tasks
    workflowStatus.failedTasks.forEach((taskTitle, index) => {
      newTasks.push({
        id: `failed-${index}`,
        title: taskTitle,
        description: `Failed task: ${taskTitle}`,
        status: 'failed'
      });
    });

    setTasks(newTasks);

    // Update agent status
    const updatedAgents = AGENTS.map(agent => {
      const isWorking = workflowStatus.activeTasks.some(task => 
        task.toLowerCase().includes(agent.name.toLowerCase().replace('researcher', '').replace('generator', '').replace('reviewer', '').replace('enhancer', ''))
      );
      
      return {
        ...agent,
        status: isWorking ? 'busy' as const : 
                workflowStatus.completedTasks.length > 0 && status === 'completed' ? 'completed' as const : 
                'idle' as const,
        currentTask: isWorking ? workflowStatus.currentTask : undefined
      };
    });

    setAgents(updatedAgents);
  }, [workflowStatus, progress, status]);

  const getTasksForStage = (stageId: string): KaibanTask[] => {
    switch (stageId) {
      case 'todo':
        return tasks.filter(task => task.status === 'pending');
      case 'inprogress':
        return tasks.filter(task => task.status === 'active');
      case 'review':
        return tasks.filter(task => task.title.toLowerCase().includes('review'));
      case 'done':
        return tasks.filter(task => task.status === 'completed');
      default:
        return [];
    }
  };

  const getStatusIcon = (taskStatus: string) => {
    switch (taskStatus) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'active':
        return <Activity className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAgentStatusColor = (agentStatus: string) => {
    switch (agentStatus) {
      case 'busy':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-lg">
                  KaibanJS Workflow: {config?.topic || config?.focusTopic || 'AI Content Generation'}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Job ID: {jobId.substring(0, 8)}... • Status: {status} • Progress: {progress}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status === 'completed' && onViewResults && (
                <Button variant="outline" size="sm" onClick={() => onViewResults(jobId)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Results
                </Button>
              )}
              {status === 'active' && onCancel && (
                <Button variant="outline" size="sm" onClick={() => onCancel(jobId)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            
            {/* Current Task Indicator */}
            {workflowStatus?.currentTask && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Activity className="h-4 w-4 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Currently executing: {workflowStatus.currentTask}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agents Status Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            AI Agents Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div key={agent.name} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getAgentStatusColor(agent.status)}`} />
                    <span className="font-medium text-sm">{agent.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {agent.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {agent.role}
                </p>
                {agent.currentTask && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Working on: {agent.currentTask}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Board</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time visualization of task progress through the content generation pipeline
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {WORKFLOW_STAGES.map((stage) => {
              const stageTasks = getTasksForStage(stage.id);
              
              return (
                <div key={stage.id} className={`p-4 rounded-lg border-2 ${stage.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{stage.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {stageTasks.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {stageTasks.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-xs">
                        No tasks
                      </div>
                    ) : (
                      stageTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 bg-white dark:bg-gray-800 rounded border shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium">{task.title}</span>
                            {getStatusIcon(task.status)}
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {task.description}
                          </p>
                          
                          {task.progress !== undefined && (
                            <Progress value={task.progress} className="h-1 mb-2" />
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            {task.agent && (
                              <span className="flex items-center gap-1">
                                <Bot className="h-3 w-3" />
                                {task.agent}
                              </span>
                            )}
                            {task.completedAt && (
                              <span>
                                {new Date(task.completedAt).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Timeline */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Execution Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks
                .sort((a, b) => {
                  const aTime = a.completedAt || a.startedAt || '';
                  const bTime = b.completedAt || b.startedAt || '';
                  return new Date(bTime).getTime() - new Date(aTime).getTime();
                })
                .map((task, index) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      {getStatusIcon(task.status)}
                      {index < tasks.length - 1 && (
                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{task.title}</span>
                        <span className="text-xs text-gray-500">
                          {task.completedAt && new Date(task.completedAt).toLocaleTimeString()}
                          {task.startedAt && !task.completedAt && `Started ${new Date(task.startedAt).toLocaleTimeString()}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {task.description}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KaibanBoard;
