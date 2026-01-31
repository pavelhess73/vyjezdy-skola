"use client";

import * as React from "react";
import { Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Teacher, ROLE_LABELS, Role } from "@/types";

interface TeacherFormProps {
    teachers: Teacher[];
    setTeachers: (teachers: Teacher[]) => void;
}

export function TeacherForm({ teachers, setTeachers }: TeacherFormProps) {
    const [newTeacherName, setNewTeacherName] = React.useState("");

    const addTeacher = () => {
        if (!newTeacherName.trim()) return;
        const newTeacher: Teacher = {
            id: crypto.randomUUID(),
            name: newTeacherName,
            roles: ["Teacher"],
            workload: 1.0,
        };
        setTeachers([...teachers, newTeacher]);
        setNewTeacherName("");
    };

    const removeTeacher = (id: string) => {
        setTeachers(teachers.filter((t) => t.id !== id));
    };

    const toggleRole = (teacherId: string, role: Role) => {
        setTeachers(
            teachers.map((t) => {
                if (t.id !== teacherId) return t;
                const hasRole = t.roles.includes(role);
                let newRoles = hasRole
                    ? t.roles.filter((r) => r !== role)
                    : [...t.roles, role];

                // Ensure always at least Teacher role if no other specific role? 
                // Or just let it be empty? Actually Teacher is a basic role.
                // If we remove 'Teacher' and list is empty, maybe default back?
                // For simplicity, let's just toggle.
                return { ...t, roles: newRoles };
            })
        );
    };

    const updateWorkload = (teacherId: string, workload: number) => {
        setTeachers(
            teachers.map((t) => (t.id === teacherId ? { ...t, workload } : t))
        );
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Seznam učitelů
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Jméno nového učitele..."
                        value={newTeacherName}
                        onChange={(e) => setNewTeacherName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTeacher()}
                    />
                    <Button onClick={addTeacher}>
                        <Plus className="w-4 h-4 mr-1" />
                        Přidat
                    </Button>
                </div>

                <div className="space-y-2">
                    {teachers.map((teacher) => (
                        <div
                            key={teacher.id}
                            className="flex items-center justify-between p-3 border rounded-md bg-slate-50"
                        >
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">{teacher.name}</span>
                                <div className="flex gap-2 text-xs">
                                    {Object.entries(ROLE_LABELS).map(([key, label]) => {
                                        const roleKey = key as Role;
                                        const isActive = teacher.roles.includes(roleKey);
                                        return (
                                            <button
                                                key={roleKey}
                                                onClick={() => toggleRole(teacher.id, roleKey)}
                                                className={`px-2 py-0.5 rounded-full border transition-colors ${isActive
                                                        ? "bg-blue-100 text-blue-700 border-blue-200"
                                                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">Úvazek:</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        className="w-20 h-8"
                                        value={teacher.workload}
                                        onChange={(e) =>
                                            updateWorkload(teacher.id, parseFloat(e.target.value) || 0)
                                        }
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => removeTeacher(teacher.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {teachers.length === 0 && (
                        <p className="text-center text-slate-500 py-4 italic">
                            Zatím žádní učitelé. Přidejte prvního výše.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
