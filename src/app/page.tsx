"use client";

import * as React from "react";
import { format } from "date-fns";
import { TeacherForm } from "@/components/forms/TeacherForm";
import { ScheduleConfigForm } from "@/components/forms/ScheduleConfigForm";
import { GroupForm } from "@/components/forms/GroupForm";
import { Teacher, Shift, StudentGroup } from "@/types";
import { ScheduleConfig } from "@/types/schedule";
import { Scheduler } from "@/lib/scheduler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Loader2, Sheet } from "lucide-react";
import { exportScheduleAction } from "@/app/actions/export";
import { cn } from "@/lib/utils";

export default function Home() {
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [groups, setGroups] = React.useState<StudentGroup[]>([]);
  const [scheduleConfig, setScheduleConfig] = React.useState<ScheduleConfig>({
    startDate: "",
    endDate: "",
    shiftsPerDay: [],
  });
  const [generatedSchedule, setGeneratedSchedule] = React.useState<Shift[]>([]);
  const [spreadsheetId, setSpreadsheetId] = React.useState("");
  const [isExporting, setIsExporting] = React.useState(false);

  const handleGenerate = () => {
    if (teachers.length === 0) {
      alert("Nejdříve přidejte učitele.");
      return;
    }
    if (!scheduleConfig.startDate || !scheduleConfig.endDate) {
      alert("Vyberte datum.");
      return;
    }

    const scheduler = new Scheduler(teachers, scheduleConfig, groups);
    const schedule = scheduler.generate();
    setGeneratedSchedule(schedule);
  };

  const handleExport = async () => {
    if (!spreadsheetId) {
      alert("Zadejte ID Google tabulky.");
      return;
    }
    setIsExporting(true);
    try {
      const result = await exportScheduleAction(generatedSchedule, teachers, spreadsheetId, groups);
      alert(result.message);
    } catch (e) {
      alert("Chyba při volání serveru.");
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Generátor Rozvrhu Služeb
          </h1>
          <p className="text-slate-500">
            Zadejte učitele, nastavte parametry a vygenerujte rozvrh.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="space-y-6">
            <TeacherForm teachers={teachers} setTeachers={setTeachers} />
            <GroupForm groups={groups} setGroups={setGroups} teachers={teachers} />
          </section>
          <section>
            <ScheduleConfigForm
              config={scheduleConfig}
              onChange={setScheduleConfig}
              onGenerate={handleGenerate}
            />
          </section>
        </div>

        {generatedSchedule.length > 0 && (
          <section className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold">Vygenerovaný rozvrh</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:w-64">
                  <Input
                    placeholder="Google Sheet ID"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sheet className="w-4 h-4 mr-2" />
                  )}
                  Exportovat do Sheets
                </Button>
              </div>
            </div>

            {/* MATRIX VIEW if groups exist */}
            {groups.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-3 border-r">Datum</th>
                      <th className="p-3 border-r">Skupina</th>
                      {/* Dynamic Shift Columns */}
                      {Array.from(new Set(generatedSchedule.map(s => s.type))).map(type => (
                        <th key={type} className="p-3">{type}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(new Set(generatedSchedule.map(s => s.date))).sort().map(date => {
                      const shiftTypes = Array.from(new Set(generatedSchedule.map(s => s.type)));

                      return groups.map((group, gIdx) => (
                        <tr key={`${date}-${group.id}`} className={cn("border-b hover:bg-slate-50", gIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                          {gIdx === 0 && (
                            <td rowSpan={groups.length} className="p-3 font-medium bg-white border-r">
                              {format(new Date(date), "d.M.")}
                            </td>
                          )}
                          <td className="p-3 font-medium text-slate-600 border-r">{group.name}</td>

                          {shiftTypes.map(type => {
                            // Find ALL shifts for this cell
                            const shifts = generatedSchedule.filter(s => s.date === date && s.groupId === group.id && s.type === type);

                            return (
                              <td key={type} className="p-3">
                                {shifts.length > 0 ? (
                                  <div className="flex flex-col gap-1">
                                    {shifts.map(shift => {
                                      const teacher = teachers.find(t => t.id === shift.teacherId);
                                      return (
                                        <span key={shift.id} className={cn(
                                          "px-2 py-1 rounded-md font-medium text-xs w-fit",
                                          type.toLowerCase().includes("noc") ? "bg-indigo-100 text-indigo-700" :
                                            "bg-amber-100 text-amber-800"
                                        )}>
                                          {teacher?.name || "?"}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* LIST VIEW fallback */
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Datum</th>
                      <th className="px-4 py-3">Čas</th>
                      <th className="px-4 py-3">Typ</th>
                      <th className="px-4 py-3">Službu koná</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedSchedule.map((shift) => {
                      const teacher = teachers.find((t) => t.id === shift.teacherId);
                      return (
                        <tr key={shift.id} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">
                            {format(new Date(shift.date), "d. M. yyyy")}
                          </td>
                          <td className="px-4 py-3">
                            {shift.startTime} - {shift.endTime}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${shift.type === 'Night'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-amber-100 text-amber-700'
                              }`}>
                              {shift.type === 'Night' ? 'Noční' : 'Denní'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {teacher?.name || "Neznámý"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
