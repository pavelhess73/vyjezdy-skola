// Basic types for the application

export type Role = 'Teacher' | 'HeadTeacher' | 'Medic';

export interface Teacher {
    id: string;
    name: string;
    roles: Role[];
    workload: number; // 0.0 to 1.0 (e.g. 1.0 = full time)
}

export interface StudentGroup {
    id: string;
    name: string;
    teacherIds: string[];
}

export interface Shift {
    id: string;
    teacherId: string;
    date: string; // ISO date string YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    type: string; // Custom shift name
    groupId?: string;
}

export const ROLE_LABELS: Record<Role, string> = {
    Teacher: "Učitel",
    HeadTeacher: "Hlavní vedoucí",
    Medic: "Zdravotník",
};
