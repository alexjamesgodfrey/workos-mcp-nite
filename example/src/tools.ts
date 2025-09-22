import { tool } from "ai";
import { z } from "zod";

export const tools = {
  searchVenues: tool({
    description: "Search for available event venues at WorkOS HQ",
    inputSchema: z.object({
      capacity: z.number().describe("Required capacity"),
      date: z.string().describe("Event date (MM/DD format)"),
      startTime: z.string().describe("Start time"),
      endTime: z.string().describe("End time"),
    }),
    execute: async ({ capacity, date, startTime, endTime }) => {
      // Mock venue search results
      const venues = [
        {
          id: "main-auditorium",
          name: "Main Auditorium",
          capacity: 250,
          amenities: ["A/V system", "Stage", "Microphones"],
          hourlyRate: 500,
          available: true,
        },
        {
          id: "conference-hall-a",
          name: "Conference Hall A",
          capacity: 180,
          amenities: ["Projector", "Sound system"],
          hourlyRate: 300,
          available: false,
        },
        {
          id: "event-space-b",
          name: "Event Space B",
          capacity: 220,
          amenities: ["A/V system", "Catering prep area"],
          hourlyRate: 400,
          available: true,
        },
      ];

      const available = venues.filter(
        (v) => v.available && v.capacity >= capacity
      );
      return `Found ${
        available.length
      } available venues for ${capacity} people on ${date} ${startTime}-${endTime}: ${available
        .map((v) => `${v.name} (${v.capacity} capacity, $${v.hourlyRate}/hr)`)
        .join(", ")}`;
    },
  }),

  checkVenueAvailability: tool({
    description: "Check specific venue availability and get detailed info",
    inputSchema: z.object({
      venueId: z.string(),
      date: z.string(),
      startTime: z.string(),
      endTime: z.string(),
    }),
    execute: async ({ venueId, date, startTime, endTime }) => {
      // Mock availability check
      const venueDetails = {
        "main-auditorium": {
          available: true,
          conflicts: [],
          setupTime: "30 minutes before event",
          cleanupTime: "30 minutes after event",
        },
        "event-space-b": {
          available: true,
          conflicts: ["5:00-5:15 PM setup for previous event"],
          setupTime: "45 minutes before event",
          cleanupTime: "30 minutes after event",
        },
      };

      const details = venueDetails[venueId as keyof typeof venueDetails] || {
        available: false,
        conflicts: ["Venue not found"],
      };
      return `Venue ${venueId} on ${date} ${startTime}-${endTime}: ${
        details.available ? "AVAILABLE" : "NOT AVAILABLE"
      }. ${
        details.conflicts.length
          ? `Conflicts: ${details.conflicts.join(", ")}`
          : "No conflicts"
      }. Setup: ${details.setupTime || "N/A"}, Cleanup: ${
        details.cleanupTime || "N/A"
      }`;
    },
  }),

  bookVenue: tool({
    description: "Book a venue for the event",
    inputSchema: z.object({
      venueId: z.string(),
      eventName: z.string(),
      date: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      attendeeCount: z.number(),
      contactEmail: z.string().optional(),
    }),
    execute: async ({
      venueId,
      eventName,
      date,
      startTime,
      endTime,
      attendeeCount,
      contactEmail,
    }) => {
      const bookingId = `BK-${Date.now()}`;
      return `✅ Successfully booked ${venueId} for "${eventName}" on ${date} ${startTime}-${endTime} for ${attendeeCount} attendees. Booking ID: ${bookingId}. Confirmation sent to ${
        contactEmail || "event organizer"
      }.`;
    },
  }),

  setupCatering: tool({
    description: "Arrange catering for the event",
    inputSchema: z.object({
      attendeeCount: z.number(),
      eventType: z
        .string()
        .describe("Type of event (networking, presentation, etc.)"),
      dietaryRestrictions: z.array(z.string()).optional(),
      budget: z.number().optional(),
    }),
    execute: async ({
      attendeeCount,
      eventType,
      dietaryRestrictions,
      budget,
    }) => {
      const cateringOptions = [
        "Light appetizers and drinks package ($25/person)",
        "Tech meetup package: pizza, drinks, coffee ($18/person)",
        "Premium networking package: appetizers, wine, coffee ($35/person)",
      ];

      const estimated =
        attendeeCount * (budget ? Math.min(budget / attendeeCount, 30) : 25);
      return `Catering arranged for ${attendeeCount} people. Recommended: ${
        cateringOptions[1]
      } for ${eventType}. ${
        dietaryRestrictions?.length
          ? `Accommodating: ${dietaryRestrictions.join(", ")}`
          : "Standard menu"
      }. Estimated cost: $${estimated}`;
    },
  }),

  bookAVEquipment: tool({
    description: "Reserve audio/visual equipment",
    inputSchema: z.object({
      equipment: z.array(z.string()).describe("List of required A/V equipment"),
      venueId: z.string(),
      eventDate: z.string(),
    }),
    execute: async ({ equipment, venueId, eventDate }) => {
      const availableEquipment = {
        microphone: "Wireless microphone system",
        projector: "4K laser projector",
        screen: "120-inch projection screen",
        speakers: "Professional sound system",
        recording: "Event recording setup",
        livestream: "Live streaming equipment",
      };

      const booked = equipment.filter(
        (e) =>
          availableEquipment[e.toLowerCase() as keyof typeof availableEquipment]
      );
      return `A/V Equipment reserved for ${venueId} on ${eventDate}: ${booked
        .map(
          (e) =>
            availableEquipment[
              e.toLowerCase() as keyof typeof availableEquipment
            ]
        )
        .join(", ")}. Setup will be completed 1 hour before event start.`;
    },
  }),

  sendEventInvitations: tool({
    description: "Send invitations to attendees",
    inputSchema: z.object({
      eventName: z.string(),
      eventDate: z.string(),
      eventTime: z.string(),
      venue: z.string(),
      recipientList: z.string().describe("Description of recipient list"),
      rsvpDeadline: z.string().optional(),
    }),
    execute: async ({
      eventName,
      eventDate,
      eventTime,
      venue,
      recipientList,
      rsvpDeadline,
    }) => {
      return `📧 Invitations sent for "${eventName}" on ${eventDate} at ${eventTime} (${venue}) to ${recipientList}. ${
        rsvpDeadline ? `RSVP deadline: ${rsvpDeadline}` : "Open RSVP"
      }. Invitation includes event details, venue info, and parking instructions.`;
    },
  }),

  confirmEventDetails: tool({
    description: "Confirm all event arrangements and generate summary",
    inputSchema: z.object({
      bookingId: z.string().optional(),
      eventName: z.string(),
    }),
    execute: async ({ bookingId, eventName }) => {
      console.log("✅ confirmEventDetails called with:", {
        bookingId,
        eventName,
      });

      const result = `✅ Event confirmation for "${eventName}":
      📍 Venue: Booked and confirmed
      🍕 Catering: Arranged and confirmed  
      🎤 A/V Equipment: Reserved and confirmed
      📧 Invitations: Sent to attendee list
      📋 Booking ID: ${bookingId || "BK-" + Date.now()}
      
      All arrangements confirmed for MCP Night. Contact events@workos.com for any changes.`;

      console.log("✅ confirmEventDetails result:", result);
      return result;
    },
  }),

  checkEventRequirements: tool({
    description: "Verify all requirements are met for the event",
    inputSchema: z.object({
      eventType: z.string(),
      attendeeCount: z.number(),
      venueCapacity: z.number(),
    }),
    execute: async ({ eventType, attendeeCount, venueCapacity }) => {
      const requirements = {
        networking: ["Name badges", "Registration table", "Networking areas"],
        "tech-meetup": [
          "Presentation setup",
          "Demo area",
          "Power outlets for laptops",
        ],
        "mcp-night": [
          "MCP demo stations",
          "Developer networking area",
          "Swag table",
          "Live streaming setup",
        ],
      };

      const capacityCheck = venueCapacity >= attendeeCount * 1.1; // 10% buffer
      const eventReqs =
        requirements[eventType.toLowerCase() as keyof typeof requirements] ||
        requirements["networking"];

      return `Event requirements check:
      ✅ Capacity: ${
        capacityCheck ? "SUFFICIENT" : "INSUFFICIENT"
      } (${venueCapacity} capacity for ${attendeeCount} attendees)
      📋 Required items: ${eventReqs.join(", ")}
      ${
        capacityCheck
          ? "All requirements can be accommodated."
          : "⚠️ Consider larger venue or reduce attendee count."
      }`;
    },
  }),
};
