import { Teacher, Shift, StudentGroup } from "@/types";
import { ScheduleConfig, ShiftTypeConfig } from "@/types/schedule";
import { addDays, differenceInHours, format, parseISO } from "date-fns";

export class Scheduler {
    private teachers: Teacher[];
    private config: ScheduleConfig;
    private groups: StudentGroup[];
    private schedule: Shift[] = [];

    // Track stats to balance workload
    private teacherStats: Map<string, { minutesWorked: number; lastShiftEnd: Date | null }> = new Map();

    constructor(teachers: Teacher[], config: ScheduleConfig, groups: StudentGroup[] = []) {
        this.teachers = teachers;
        this.config = config;
        this.groups = groups;

        // Initialize stats
        teachers.forEach(t => {
            this.teacherStats.set(t.id, { minutesWorked: 0, lastShiftEnd: null });
        });
    }

    public generate(): Shift[] {
        this.schedule = [];
        let currentDate = parseISO(this.config.startDate);
        const endDate = parseISO(this.config.endDate);

        while (currentDate <= endDate) {
            this.generateDay(currentDate);
            currentDate = addDays(currentDate, 1);
        }

        return this.schedule;
    }

    private generateDay(date: Date) {
        const dateStr = format(date, "yyyy-MM-dd");

        for (const shiftType of this.config.shiftsPerDay) {

            if (shiftType.isGroupShift && this.groups.length > 0) {
                // Generate one shift PER GROUP
                for (const group of this.groups) {
                    this.assignShift(dateStr, shiftType, group);
                }
            } else {
                // Standard shift
                this.assignShift(dateStr, shiftType);
            }
        }
    }

    private assignShift(dateStr: string, shiftType: ShiftTypeConfig, group?: StudentGroup) {

        // 1. Try to assign the Group Supervisor(s) first (if applicable)
        if (group && group.teacherIds && group.teacherIds.length > 0 && shiftType.assignStrategy === 'LEADER') {
            // STRICT ROTATION - Pick ONE valid supervisor from the list (fairness + constraints)

            const supervisors = this.teachers.filter(t => group.teacherIds.includes(t.id));

            // Sort by relative workload (minutes / capacity) to balance based on contracts
            supervisors.sort((a, b) => {
                const statsA = this.teacherStats.get(a.id);
                const statsB = this.teacherStats.get(b.id);

                const loadA = (statsA?.minutesWorked || 0) / (a.workload || 1.0);
                const loadB = (statsB?.minutesWorked || 0) / (b.workload || 1.0);

                return loadA - loadB;
            });

            // Find first who CAN work (respects rest, overlaps, etc.)
            for (const supervisor of supervisors) {
                if (this.canWork(supervisor, dateStr, shiftType)) {
                    this.createShift(supervisor, dateStr, shiftType, group);
                    return;
                }
            }

            return; // Strict Leader approach
        }

        // 2. Standard assignment (Role based)
        for (const role of shiftType.requiredRoles) {
            // If we are here for a Group Shift and missed the Supervisor (e.g. not assigned), we need SOMEONE.
            // But if we already assigned a supervisor above (return executed), we skip this.

            const candidate = this.findCandidate(dateStr, shiftType, role);
            if (candidate) {
                this.createShift(candidate, dateStr, shiftType, group);
                // If Group Shift, we generally just need 1 person (the supervisor).
                if (group) return;
            }
        }
    }

    private findCandidate(dateStr: string, shiftConfig: ShiftTypeConfig, role: string): Teacher | null {
        // Filter teachers by role
        // @ts-expect-error - role type string vs Role
        const qualifiedTeachers = this.teachers.filter(t => t.roles.includes(role));

        // Sort by relative workload (minutes / capacity)
        qualifiedTeachers.sort((a, b) => {
            const statsA = this.teacherStats.get(a.id);
            const statsB = this.teacherStats.get(b.id);

            const loadA = (statsA?.minutesWorked || 0) / (a.workload || 1.0);
            const loadB = (statsB?.minutesWorked || 0) / (b.workload || 1.0);

            return loadA - loadB;
        });

        // Try to find first valid candidate
        for (const teacher of qualifiedTeachers) {
            if (this.canWork(teacher, dateStr, shiftConfig)) {
                return teacher;
            }
        }

        return null;
    }

    private canWork(teacher: Teacher, dateStr: string, shiftConfig: ShiftTypeConfig, ignoreRest: boolean = false): boolean {
        const stats = this.teacherStats.get(teacher.id);
        if (!stats) return false;

        // Check 1: Rest period (skip if "natvrdo" / ignoreRest is true)
        if (!ignoreRest && stats.lastShiftEnd) {
            const shiftStart = new Date(`${dateStr}T${shiftConfig.startTime}:00`);
            const hoursSinceLastShift = differenceInHours(shiftStart, stats.lastShiftEnd);

            if (hoursSinceLastShift < 8) {
                return false;
            }
        }

        // Check 2: Already working this shift (or overlapping)?
        // This must ALWAYS hold.
        const shiftStart = new Date(`${dateStr}T${shiftConfig.startTime}:00`);
        let shiftEnd = new Date(`${dateStr}T${shiftConfig.endTime}:00`);
        if (shiftConfig.endTime < shiftConfig.startTime) shiftEnd = addDays(shiftEnd, 1);

        const isOverlapping = this.schedule.some(s => {
            if (s.teacherId !== teacher.id) return false;

            // Check overlaps
            const sStart = new Date(`${s.date}T${s.startTime}:00`);
            let sEnd = new Date(`${s.date}T${s.endTime}:00`);
            if (s.endTime < s.startTime) sEnd = addDays(sEnd, 1);

            return (shiftStart < sEnd && shiftEnd > sStart);
        });

        if (isOverlapping) return false;

        return true;
    }

    private createShift(teacher: Teacher, dateStr: string, shiftConfig: ShiftTypeConfig, group?: StudentGroup) {
        const shift: Shift = {
            id: crypto.randomUUID(),
            teacherId: teacher.id,
            date: dateStr,
            startTime: shiftConfig.startTime,
            endTime: shiftConfig.endTime,
            type: shiftConfig.name,
            groupId: group?.id
        };

        this.schedule.push(shift);

        // Update stats
        const shiftStart = new Date(`${dateStr}T${shiftConfig.startTime}:00`);
        let shiftEnd = new Date(`${dateStr}T${shiftConfig.endTime}:00`);
        if (shiftConfig.endTime < shiftConfig.startTime) {
            shiftEnd = addDays(shiftEnd, 1);
        }

        const durationMinutes = differenceInHours(shiftEnd, shiftStart) * 60; // Approximate

        const stats = this.teacherStats.get(teacher.id)!;
        stats.minutesWorked += durationMinutes;
        stats.lastShiftEnd = shiftEnd;
    }
}
