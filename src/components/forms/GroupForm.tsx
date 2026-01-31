"use client";

import * as React from "react";
import { Plus, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentGroup, Teacher } from "@/types";
import { Badge } from "@/components/ui/badge";

interface GroupFormProps {
    groups: StudentGroup[];
    setGroups: (groups: StudentGroup[]) => void;
    teachers: Teacher[];
}

export function GroupForm({ groups, setGroups, teachers }: GroupFormProps) {
    const [newGroupName, setNewGroupName] = React.useState("");

    const addGroup = () => {
        if (!newGroupName.trim()) return;
        const newGroup: StudentGroup = {
            id: crypto.randomUUID(),
            name: newGroupName,
            teacherIds: [],
        };
        setGroups([...groups, newGroup]);
        setNewGroupName("");
    };

    const removeGroup = (id: string) => {
        setGroups(groups.filter((g) => g.id !== id));
    };

    const addTeacherToGroup = (groupId: string, teacherId: string) => {
        if (!teacherId) return;
        setGroups(
            groups.map((g) => {
                if (g.id === groupId) {
                    if (g.teacherIds.includes(teacherId)) return g;
                    return { ...g, teacherIds: [...g.teacherIds, teacherId] };
                }
                return g;
            })
        );
    };

    const removeTeacherFromGroup = (groupId: string, teacherId: string) => {
        setGroups(
            groups.map((g) => {
                if (g.id === groupId) {
                    return { ...g, teacherIds: g.teacherIds.filter(id => id !== teacherId) };
                }
                return g;
            })
        );
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Skupiny (Oddíly)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Název skupiny (např. Oddíl 1)..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addGroup()}
                    />
                    <Button onClick={addGroup}>
                        <Plus className="w-4 h-4 mr-1" />
                        Přidat
                    </Button>
                </div>

                <div className="space-y-3">
                    {groups.map((group) => (
                        <div
                            key={group.id}
                            className="flex flex-col gap-2 p-3 border rounded-md bg-slate-50"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">{group.name}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-6 w-6"
                                    onClick={() => removeGroup(group.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                                {group.teacherIds.map(tid => {
                                    const t = teachers.find(teacher => teacher.id === tid);
                                    if (!t) return null;
                                    return (
                                        <Badge key={tid} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                            {t.name}
                                            <button
                                                onClick={() => removeTeacherFromGroup(group.id, tid)}
                                                className="ml-1 hover:text-red-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                                <select
                                    className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs flex-1"
                                    value=""
                                    onChange={(e) => addTeacherToGroup(group.id, e.target.value)}
                                >
                                    <option value="">+ Přidat vedoucího</option>
                                    {teachers.filter(t => !group.teacherIds.includes(t.id)).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                    {groups.length === 0 && (
                        <p className="text-center text-slate-500 py-4 italic text-sm">
                            Zatím žádné skupiny.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
