const { google } = require('googleapis');
const { OAuth2 } = google.auth;

const createGoogleMeet = async (interviewDetails) => {
    try {
        const oAuth2Client = new OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oAuth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        const event = {
            summary: interviewDetails.subject || `Interview with ${interviewDetails.candidate.name}`,
            description: interviewDetails.emailBody || 'Interview scheduled',
            start: {
                dateTime: `${interviewDetails.date}T${interviewDetails.startTime}:00`,
                timeZone: interviewDetails.timezone,
            },
            end: {
                dateTime: `${interviewDetails.date}T${addMinutes(interviewDetails.startTime, interviewDetails.duration)}:00`,
                timeZone: interviewDetails.timezone,
            },
            conferenceData: {
                createRequest: {
                    requestId: `interview-${Date.now()}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            },
            attendees: [
                { email: interviewDetails.candidate.email },
                ...interviewDetails.interviewers.map(i => ({ email: i.email }))
            ]
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
        });

        return response.data.hangoutLink;
    } catch (error) {
        console.error('Error creating Google Meet:', error);
        throw error;
    }
};

function addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + Number(minutes);
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

module.exports = { createGoogleMeet };