import * as React from "react";

export function EventReminderTemplate({
  eventTitle,
  eventAt,
  location,
}: {
  eventTitle: string;
  eventAt: string;
  location?: string;
}) {
  return (
    <div style={{ fontFamily: "sans-serif", lineHeight: "1.5" }}>
      <h2>Event Reminder: {eventTitle}</h2>
      <p>
        Pengingat event <strong>{eventTitle}</strong> pada <strong>{eventAt}</strong>
        {location ? ` di ${location}` : ""}.
      </p>
    </div>
  );
}

export function EventCreatedTemplate({ eventTitle, eventAt }: { eventTitle: string; eventAt: string }) {
  return (
    <div style={{ fontFamily: "sans-serif", lineHeight: "1.5" }}>
      <h2>New Event: {eventTitle}</h2>
      <p>Event baru dijadwalkan pada {eventAt}.</p>
    </div>
  );
}
