import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowUpRight, CheckCircle, Clock, Code, Cpu, Database, GitBranch, Play, Server, Shield, Terminal, Zap } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { name: '00:00', tasks: 4, agents: 2 },
  { name: '04:00', tasks: 3, agents: 1 },
  { name: '08:00', tasks: 12, agents: 5 },
  { name: '12:00', tasks: 25, agents: 8 },
  { name: '16:00', tasks: 18, agents: 6 },
  { name: '20:00', tasks: 9, agents: 3 },
  { name: '23:59', tasks: 5, agents: 2 },
];

export default function Overview() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">SYSTEM OVERVIEW</h2>
          <p className="text-muted-foreground font-mono mt-1">Status: OPERATIONAL | Uptime: 14d 2h 15m</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Terminal className="w-4 h-4" />
            View Logs
          </Button>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Play className="w-4 h-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono">ACTIVE AGENTS</CardTitle>
            <Cpu className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              <span className="text-primary flex items-center gap-1 inline-flex">
                <ArrowUpRight className="w-3 h-3" /> +2
              </span> from last hour
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-2 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono">TASKS COMPLETED</CardTitle>
            <CheckCircle className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              <span className="text-chart-2 flex items-center gap-1 inline-flex">
                <ArrowUpRight className="w-3 h-3" /> +15%
              </span> from yesterday
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-3 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono">API LATENCY</CardTitle>
            <Zap className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45ms</div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              <span className="text-chart-3 flex items-center gap-1 inline-flex">
                <ArrowUpRight className="w-3 h-3" /> -12ms
              </span> improvement
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-4 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono">KNOWLEDGE BASE</CardTitle>
            <Database className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15.4GB</div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              <span className="text-chart-4 flex items-center gap-1 inline-flex">
                <ArrowUpRight className="w-3 h-3" /> +1.2GB
              </span> new data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart & Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card/50 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle className="font-mono flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              SYSTEM ACTIVITY
            </CardTitle>
            <CardDescription>Real-time agent execution metrics</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAgents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      borderColor: 'var(--border)',
                      fontFamily: 'monospace'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tasks" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTasks)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="agents" 
                    stroke="var(--chart-2)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAgents)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card/50 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle className="font-mono flex items-center gap-2">
              <Server className="w-5 h-5 text-chart-2" />
              RECENT OPERATIONS
            </CardTitle>
            <CardDescription>Latest system events and logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { icon: Code, color: "text-primary", title: "Code Generation", desc: "Generated API endpoints for user module", time: "2m ago" },
                { icon: Shield, color: "text-chart-3", title: "Security Scan", desc: "Vulnerability check completed: 0 issues", time: "15m ago" },
                { icon: GitBranch, color: "text-chart-4", title: "Git Operation", desc: "Committed changes to feature/auth", time: "1h ago" },
                { icon: Database, color: "text-chart-5", title: "DB Migration", desc: "Successfully applied migration v1.2.0", time: "2h ago" },
                { icon: Clock, color: "text-muted-foreground", title: "Scheduled Task", desc: "Daily backup completed", time: "4h ago" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className={`mt-1 p-1.5 bg-background border border-border ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium font-mono leading-none">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{item.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Agents */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { name: "Planner Agent", role: "Strategy", status: "Active", task: "Analyzing requirements", progress: 75 },
          { name: "Coder Agent", role: "Development", status: "Working", task: "Implementing auth middleware", progress: 45 },
          { name: "Reviewer Agent", role: "QA", status: "Idle", task: "Waiting for code submission", progress: 0 },
        ].map((agent, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-mono">{agent.name}</CardTitle>
                <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                  agent.status === "Active" || agent.status === "Working" 
                    ? "border-primary text-primary bg-primary/10" 
                    : "border-muted text-muted-foreground bg-muted/10"
                }`}>
                  {agent.status.toUpperCase()}
                </span>
              </div>
              <CardDescription className="font-mono text-xs">{agent.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Current Task:</span>
                  <span className="font-mono">{agent.progress}%</span>
                </div>
                <p className="text-sm truncate">{agent.task}</p>
                <div className="h-1.5 w-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${agent.progress}%` }} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
