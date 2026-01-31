"use server";

import { Shift, Teacher, StudentGroup } from "@/types";
import { exportScheduleToSheet } from "@/lib/google-sheets";

export async function exportScheduleAction(
    schedule: Shift[],
    teachers: Teacher[],
    spreadsheetId: string,
    groups: StudentGroup[] = []
) {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        return {
            success: false,
            message: "Server chybí konfigurace (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY)."
        };
    }

    try {
        const sheetTitle = await exportScheduleToSheet(
            schedule,
            teachers,
            spreadsheetId,
            clientEmail,
            privateKey,
            groups
        );
        return {
            success: true,
            message: `Rozvrh byl úspěšně exportován do listu: ${sheetTitle}`
        };
    } catch (error: any) {
        console.error("Export failed:", error);
        return {
            success: false,
            message: `Chyba při exportu: ${error.message}`
        };
    }
}
