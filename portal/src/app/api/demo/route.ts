import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const demoLeadSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required"),
  principalName: z.string().min(2, "Principal / Dean name is required"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  email: z.string().email("Valid institutional email is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  studentCount: z.string().min(1, "Student count is required"),
  teacherCount: z.string().min(1, "Teacher count is required"),
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

    const validatedData = demoLeadSchema.parse(body);

    const HIGH_PRIORITY_COHORTS = new Set(["3000-8000", "8000-plus", "4000-plus"]);
    const isHighPriority = HIGH_PRIORITY_COHORTS.has(validatedData.studentCount);

    const leadPayload = {
      leadId: `DEMO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      type: "COLLEGE_DEMO_REQUEST",
      submittedAt: new Date().toISOString(),
      institution: {
        name: validatedData.institutionName,
        principal: validatedData.principalName,
        students: validatedData.studentCount,
        teachers: validatedData.teacherCount,
      },
      contact: {
        person: validatedData.contactPerson,
        email: validatedData.email,
        phone: validatedData.phone,
      },
      notes: validatedData.notes || "",
      status: "NEW_LEAD",
      priority: isHighPriority ? "HIGH" : "STANDARD",
      crmSource: "LANDING_BOOK_DEMO_MODAL",
    };

    // Log CRM-ready payload on server
    console.log("[CRM Lead Capture] New College Demo Booking:", JSON.stringify(leadPayload, null, 2));

    // Remote schema adaptation for backend demoRequestSchema
    const remotePayload = {
      ...leadPayload,
      fullName: validatedData.contactPerson,
      email: validatedData.email,
      institution: validatedData.institutionName,
      campusSize: validatedData.studentCount,
      phone: validatedData.phone,
      notes: validatedData.notes || "",
    };

    // Forward to remote backend if API_URL is configured and reachable
    const remoteApiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (remoteApiUrl) {
      try {
        const response = await fetch(`${remoteApiUrl.replace(/\/+$/, "")}/api/demo`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Request-ID": leadPayload.leadId,
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
                      `Remote demo service returned status ${response.status}`,
                  },
            { status: response.status >= 400 && response.status < 500 ? response.status : 502 }
                );
              }
            } catch (err: unknown) {
              console.error("[CRM] Remote backend forward error:", err);
              return NextResponse.json(
                {
                  success: false,
                  message: "Unable to reach collegiate demo scheduling service. Please try again.",
                },
                { status: 504 }
              );
            }
          }

    return NextResponse.json(
            {
              success: true,
              message: "Campus demo requested successfully. Our collegiate solutions director will contact you within 24 hours.",
              leadId: leadPayload.leadId,
              data: leadPayload,
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
            { success: false, message: "Internal server error processing demo request" },
            { status: 500 }
          );
        }
      }
