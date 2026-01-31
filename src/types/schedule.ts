import { Shift } from './index';

export interface ShiftTypeConfig {
    name: string;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    requiredRoles: string[]; // Role[] keys
    isGroupShift?: boolean;
    assignStrategy?: 'LEADER' | 'ANY';
}

export interface ScheduleConfig {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    shiftsPerDay: ShiftTypeConfig[];
}

export type GeneratedSchedule = Shift[];
