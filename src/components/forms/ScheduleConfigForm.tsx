"use client";

import * as React from "react";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon, Settings, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScheduleConfig, ShiftTypeConfig } from "@/types/schedule";
import { ROLE_LABELS, Role } from "@/types";

interface ScheduleConfigFormProps {
    config: ScheduleConfig;
    onChange: (config: ScheduleConfig) => void;
    onGenerate: () => void;
}

const DEFAULT_SHIFTS: ShiftTypeConfig[] = [
    { name: "Dopoledne", startTime: "07:00", endTime: "13:00", requiredRoles: ["Teacher"], isGroupShift: true, assignStrategy: 'LEADER' },
    { name: "Odpoledne", startTime: "13:00", endTime: "19:00", requiredRoles: ["Teacher"], isGroupShift: true, assignStrategy: 'LEADER' },
    { name: "Večer", startTime: "19:00", endTime: "22:00", requiredRoles: ["Teacher"], isGroupShift: true, assignStrategy: 'LEADER' }, // User set evening to Leader in history
    { name: "Noc", startTime: "22:00", endTime: "07:00", requiredRoles: ["Teacher"], isGroupShift: true, assignStrategy: 'LEADER' },
];

export function ScheduleConfigForm({ config, onChange, onGenerate }: ScheduleConfigFormProps) {
    const [date, setDate] = React.useState<{ from: Date; to: Date } | undefined>({
        from: new Date(),
        to: addDays(new Date(), 7),
    });

    React.useEffect(() => {
        if (date?.from && date?.to) {
            onChange({
                ...config,
                startDate: format(date.from, "yyyy-MM-dd"),
                endDate: format(date.to, "yyyy-MM-dd"),
                shiftsPerDay: config.shiftsPerDay.length > 0 ? config.shiftsPerDay : DEFAULT_SHIFTS
            });
        }
    }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

    const addShift = () => {
        const newShift: ShiftTypeConfig = {
            name: "Nová směna",
            startTime: "12:00",
            endTime: "16:00",
            requiredRoles: ["Teacher"],
            isGroupShift: true,
            assignStrategy: 'LEADER'
        };
        onChange({ ...config, shiftsPerDay: [...config.shiftsPerDay, newShift] });
    };

    const removeShift = (index: number) => {
        const newShifts = [...config.shiftsPerDay];
        newShifts.splice(index, 1);
        onChange({ ...config, shiftsPerDay: newShifts });
    };

    const updateShift = (index: number, field: keyof ShiftTypeConfig, value: any) => {
        const newShifts = [...config.shiftsPerDay];
        newShifts[index] = { ...newShifts[index], [field]: value };
        onChange({ ...config, shiftsPerDay: newShifts });
    };

    return (
        <Card className="w-full max-w-2xl mx-auto border-blue-200 shadow-sm">
            <CardHeader className="bg-blue-50/50">
                <CardTitle className="text-xl flex items-center gap-2 text-blue-900">
                    <Settings className="w-5 h-5 text-blue-600" />
                    Nastavení generování
                </CardTitle>
                <CardDescription>
                    Vyberte období a definujte směny.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="grid gap-2">
                    <Label htmlFor="date-range">Období akce</Label>
                    <div className={cn("grid gap-2")}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "d.M.yyyy")} -{" "}
                                                {format(date.to, "d.M.yyyy")}
                                            </>
                                        ) : (
                                            format(date.from, "d.M.yyyy")
                                        )
                                    ) : (
                                        <span>Vyberte datum</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={(range: any) => setDate(range)}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Směny</p>
                        <Button size="sm" variant="outline" onClick={addShift} className="h-8">
                            <Plus className="w-3 h-3 mr-1" /> Přidat směnu
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {config.shiftsPerDay.map((shift, idx) => (
                            <div key={idx} className="flex flex-col gap-3 p-3 border rounded-md bg-slate-50 relative">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-2 right-2 h-6 w-6 text-red-400 hover:text-red-600"
                                    onClick={() => removeShift(idx)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>

                                <div className="grid grid-cols-3 gap-2 pr-8">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Název</Label>
                                        <Input
                                            value={shift.name}
                                            onChange={(e) => updateShift(idx, 'name', e.target.value)}
                                            className="h-8"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Od</Label>
                                        <Input
                                            type="time"
                                            value={shift.startTime}
                                            onChange={(e) => updateShift(idx, 'startTime', e.target.value)}
                                            className="h-8"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Do</Label>
                                        <Input
                                            type="time"
                                            value={shift.endTime}
                                            onChange={(e) => updateShift(idx, 'endTime', e.target.value)}
                                            className="h-8"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t pt-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`group-${idx}`}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={!!shift.isGroupShift}
                                            onChange={(e) => updateShift(idx, 'isGroupShift', e.target.checked)}
                                        />
                                        <Label htmlFor={`group-${idx}`} className="text-sm font-medium">Pro každou skupinu</Label>
                                    </div>

                                    {shift.isGroupShift && (
                                        <div className="space-y-1">
                                            <Label className="text-xs">Kdo slouží?</Label>
                                            <select
                                                className="w-full h-8 rounded-md border border-slate-300 bg-white text-xs px-2"
                                                value={shift.assignStrategy || 'ANY'}
                                                onChange={(e) => updateShift(idx, 'assignStrategy', e.target.value)}
                                            >
                                                <option value="LEADER">Vedoucí skupiny</option>
                                                <option value="ANY">Kdokoli (náhodně)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Button onClick={onGenerate} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Generovat rozvrh
                </Button>
            </CardContent>
        </Card>
    );
}
