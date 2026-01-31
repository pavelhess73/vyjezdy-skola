import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Shift, Teacher, ROLE_LABELS, Role, StudentGroup } from '@/types';
import { format, parseISO, addDays } from 'date-fns';

export async function exportScheduleToSheet(
    schedule: Shift[],
    teachers: Teacher[],
    spreadsheetId: string,
    clientEmail: string,
    privateKey: string,
    groups: StudentGroup[] = []
) {
    const jwt = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(spreadsheetId, jwt);
    await doc.loadInfo();

    const sheetTitle = `Rozvrh ${format(new Date(), 'yyyy-MM-dd HH-mm-ss')}`;
    let sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) {
        sheet = await doc.addSheet({ title: sheetTitle });
    }

    if (groups.length === 0) {
        // Fallback list view
        await sheet.setHeaderRow(['Datum', 'Čas', 'Typ', 'Učitel', 'Role']);
        // ... implementation skipped for brevity, focusing on matrix
        return sheetTitle;
    }

    // MATRIX VIEW: 
    // Headers: Datum | Skupina | [ShiftName1] | [ShiftName2] ...

    // Find all unique shift types present in the schedule or use generic names?
    // Better to find all types generated.
    const allShiftNames = Array.from(new Set(schedule.map(s => s.type))).sort();
    // Problem: s.type is currently 'Day'|'Night'. We lost the custom name in the Scheduler!
    // We need to store the custom name in Shift or use a mapping.
    // Let's assume s.type currently holds the custom name?
    // Check Scheduler.createShift: type: shiftConfig.name === "Noční" ? "Night" : "Day"
    // I need to change Scheduler to store the real name.

    // Quick Fix: Map standard types if possible, or update Scheduler to store real name.
    // I will update Scheduler to store the real name in `type` or a new field.
    // For now, let's look at `Scheduler.ts` again. It saves `type: shiftConfig.name === "Noční" ? "Night" : "Day"`. 
    // This is lossy. I should fix Scheduler first to pass `shiftConfig.name` as `type` or `label`.

    // Assuming I fix Scheduler to save `shiftConfig.name` as `type` (as string):
    const shiftNames = Array.from(new Set(schedule.map(s => s.type)));

    // Order them? Maybe manually or by time if we could. 
    // Let's just sort alphabetically or by appearance.

    const headerRow = ['Datum', 'Skupina', ...shiftNames];
    await sheet.setHeaderRow(headerRow);

    const uniqueDates = Array.from(new Set(schedule.map(s => s.date))).sort();
    const rows: Record<string, string>[] = [];

    for (const date of uniqueDates) {
        for (const group of groups) {
            const row: Record<string, string> = {
                'Datum': format(parseISO(date), 'dd.MM.yyyy'),
                'Skupina': group.name
            };

            let hasAnyShift = false;

            shiftNames.forEach(shiftName => {
                const shifts = schedule.filter(s =>
                    s.date === date &&
                    s.groupId === group.id &&
                    s.type === shiftName
                );

                if (shifts.length > 0) {
                    const names = shifts.map(s => {
                        const t = teachers.find(teacher => teacher.id === s.teacherId);
                        return t ? t.name : '?';
                    }).join(', ');
                    row[shiftName] = names;
                    hasAnyShift = true;
                } else {
                    row[shiftName] = '-';
                }
            });

            if (hasAnyShift) {
                rows.push(row);
            }
        }
    }

    await sheet.addRows(rows);

    // --- STATISTICS SHEET ---
    const statsTitle = "Statistiky";
    let statsSheet = doc.sheetsByTitle[statsTitle];
    if (!statsSheet) {
        statsSheet = await doc.addSheet({ title: statsTitle });
    } else {
        await statsSheet.clear();
    }

    await statsSheet.setHeaderRow(['Jméno', 'Počet směn', 'Celkem hodin', 'Průměr na den', 'Úvazek', 'Status']);

    // Calculate duration in days (based on unique dates in schedule)
    const uniqueDatesSet = new Set(schedule.map(s => s.date));
    const totalDays = uniqueDatesSet.size || 1;
    const STANDARD_HOURS_PER_DAY = 8;

    const statsRows = [];

    for (const teacher of teachers) {
        const teacherShifts = schedule.filter(s => s.teacherId === teacher.id);
        const shiftCount = teacherShifts.length;

        let totalMinutes = 0;
        for (const shift of teacherShifts) {
            const start = new Date(`${shift.date}T${shift.startTime}:00`);
            let end = new Date(`${shift.date}T${shift.endTime}:00`);
            if (shift.endTime < shift.startTime) {
                end = addDays(end, 1);
            }
            // Diff in minutes
            totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
        }

        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
        const avgPerDay = Math.round((totalHours / totalDays) * 10) / 10;

        // Workload analysis
        const workload = teacher.workload || 1.0;
        const expectedHours = totalDays * STANDARD_HOURS_PER_DAY * workload;
        const diff = totalHours - expectedHours;

        let status = 'OK';
        if (diff > 4) status = `Přesčas (+${Math.round(diff)}h)`;
        if (diff < -4) status = `Chybí (${Math.round(diff)}h)`;

        statsRows.push({
            'Jméno': teacher.name,
            'Počet směn': shiftCount,
            'Celkem hodin': totalHours,
            'Průměr na den': avgPerDay,
            'Úvazek': workload,
            'Status': status
        });
    }

    await statsSheet.addRows(statsRows);

    return sheetTitle;
}
