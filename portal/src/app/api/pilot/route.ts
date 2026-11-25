import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const pilotApplicationSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required"),
  accreditation: z.string().optional(),
  cityState: z.string().min(2, "City and state are required"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  roleTitle: z.string().min(2, "Designation / Role title is required"),
  email: z.string().email("Valid institutional email is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  pilotDuration: z.enum(["30_day", "60_day", "campus_evaluation"]),
  studentCount: z.string().min(1, "Expected student count is required"),
  teacherCount: z.string().min(1, "Expected faculty count is required"),
  kioskCount: z.string().min(1, "Target gate / kiosk count is required"),
  deploymentTimeline: z.enum(["immediate", "next_semester", "academic_year"]),
  notes: z.string().optional(),
  honeypot: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Anti-bot check
    if (body.honeypot && body.honeypot.trim().length > 0) {
      return NextResponse.json({ success: true, message: "Request received" });
    }

    const validatedData = pilotApplicationSchema.parse(body);

    const pilotPayload = {
      applicationId: `PILOT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      type: "CAMPUS_PILOT_APPLICATION",
      submittedAt: new Date().toISOString(),
      institution: {
        name: validatedData.institutionName,
        accreditation: validatedData.accreditation || "Not specified",
        location: validatedData.cityState,
        students: validatedData.studentCount,
        faculty: validatedData.teacherCount,
        kiosks: validatedData.kioskCount,
      },
      program: {
        duration: validatedData.pilotDuration,
        timeline: validatedData.deploymentTimeline,
      },
      applicant: {
        name: validatedData.contactPerson,
        role: validatedData.roleTitle,
        email: validatedData.email,
        phone: validatedData.phone,
      },
      notes: validatedData.notes || "",
      status: "UNDER_REVIEW",
      crmSource: "LANDING_REQUEST_PILOT_MODAL",
    };

    console.log("[CRM Pilot Capture] New Campus Pilot Application:", JSON.stringify(pilotPayload, null, 2));

    // Remote schema adaptation for backend demo/pilot handling
    const remotePayload = {
      ...pilotPayload,
      fullName: validatedData.contactPerson,
      email: validatedData.email,
      institution: validatedData.institutionName,
      campusSize: validatedData.studentCount,
      phone: validatedData.phone,
      notes: validatedData.notes || "",
    };

    const remoteApiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (remoteApiUrl) {
      try {
        const response = await fetch(`${remoteApiUrl.replace(/\/+$/, "")}/api/pilot`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": pilotPayload.applicationId,
          },
          body: JSON.stringify(remotePayload),
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          return NextResponse.json(
            {
              success: false,
              message:
                errData?.detail ||
                errData?.message ||
                `Remote pilot service returned status ${response.status}`,
            },
            { status: response.status >= 400 && response.status < 500 ? response.status : 502 }
          );
        }
      } catch (err: unknown) {
        console.error("[CRM] Remote pilot forward error:", err);
        return NextResponse.json(
          {
            success: false,
            message: "Unable to reach campus onboarding service. Please try again.",
          },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pilot program application received. Our engineering and campus onboarding team will contact you within 24 hours.",
        applicationId: pilotPayload.applicationId,
        data: pilotPayload,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Internal server error processing pilot application" },
      { status: 500 }
    );
  }
}
