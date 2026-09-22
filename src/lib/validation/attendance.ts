import { z } from "zod";

export const attendanceSessionSchema = z
  .object({
    division_id: z.string().uuid().nullable().optional(),
    class_id: z.string().uuid().nullable().optional(),
    course_id: z.string().uuid().nullable().optional(),
    title: z.string().min(3).max(100).default("Attendance Session"),
    started_at: z.string().datetime({ offset: true }),
    ended_at: z.string().datetime({ offset: true }),
    latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
    longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
    radius_meters: z.coerce.number().int().min(10).max(5000).nullable().optional(),
    status: z.enum(["OPEN", "CLOSED", "CANCELLED"]).default("OPEN"),
  })
  .refine((d) => new Date(d.ended_at) > new Date(d.started_at), {
    message: "ended_at harus > started_at",
    path: ["ended_at"],
  })
  .refine(
    (d) => {
      const hasLat = d.latitude !== null && d.latitude !== undefined;
      const hasLon = d.longitude !== null && d.longitude !== undefined;
      const hasRadius = d.radius_meters !== null && d.radius_meters !== undefined;
      if (hasLat || hasLon || hasRadius) {
        return hasLat && hasLon && hasRadius;
      }
      return true;
    },
    { message: "latitude, longitude, radius harus diisi bersama (geofence optional)", path: ["latitude"] }
  );

export const checkInSchema = z.object({
  session_id: z.string().uuid(),
  qr_token: z.string().min(1),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

export const correctAttendanceSchema = z.object({
  record_id: z.string().uuid(),
  new_status: z.enum(["PRESENT", "LATE", "PERMITTED", "SICK", "ABSENT"]),
  reason: z.string().min(3).max(500),
});

export type AttendanceSessionInput = z.infer<typeof attendanceSessionSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
