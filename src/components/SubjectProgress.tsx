import { useNavigate } from "react-router-dom";
import { useTopicsBySubject } from "@/hooks/useTopics";
import { TrendingUp, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function SubjectProgress() {
  const { data: groups = [] } = useTopicsBySubject();
  const navigate = useNavigate();

  const overall = groups.length
    ? Math.round(groups.reduce((s, g) => s + g.pct, 0) / groups.length)
    : 0;
  const totalTopics = groups.reduce((s, g) => s + g.total, 0);
  const totalDone = groups.reduce((s, g) => s + g.completed, 0);

  const chartData = groups.map((g) => ({ name: g.subject.name, pct: g.pct }));

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> Subject Progress
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Click a subject to drill into chapters</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Overall Coverage" value={`${overall}%`} accent />
        <Stat label="Topics Completed" value={`${totalDone}/${totalTopics}`} />
        <Stat label="Subjects" value={groups.length} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
        <h3 className="font-semibold mb-3">Coverage by subject</h3>
        {chartData.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                <Bar dataKey="pct" fill="#3B7FEB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No data yet.</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map(({ subject, pct, completed, total }) => (
          <button
            type="button"
            key={subject.id}
            onClick={() => navigate(`/progress/${subject.id}`)}
            className="text-left rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:bg-white/10 hover:border-white/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg">{subject.name}</h3>
                {subject.language_type && <p className="text-xs text-muted-foreground">{subject.language_type}</p>}
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <div className="text-2xl font-bold text-primary">{pct}%</div>
                  <div className="text-xs text-muted-foreground">{completed}/{total}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Progress value={pct} className="h-2 mt-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-3xl font-bold mt-2 ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
