const axios = require('axios');
const msal = require('@azure/msal-node');

const createTeamsMeeting = async (interviewDetails) => {
    try {
        const msalConfig = {
            auth: {
                clientId: process.env.MS_CLIENT_ID,
                authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}`,
                clientSecret: process.env.MS_CLIENT_SECRET
            }
        };

        const cca = new msal.ConfidentialClientApplication(msalConfig);
        
        const tokenRequest = {
            scopes: ["https://graph.microsoft.com/.default"]
        };

        const authResponse = await cca.acquireTokenByClientCredential(tokenRequest);
        
        const meetingResponse = await axios.post('https://graph.microsoft.com/v1.0/me/onlineMeetings', {
            startDateTime: `${interviewDetails.date}T${interviewDetails.startTime}:00`,
            endDateTime: `${interviewDetails.date}T${addMinutes(interviewDetails.startTime, interviewDetails.duration)}:00`,
            subject: interviewDetails.subject || `Interview with ${interviewDetails.candidate.name}`,
            participants: {
                attendees: [
                    {
                        upn: interviewDetails.candidate.email,
                        role: "presenter"
                    },
                    ...interviewDetails.interviewers.map(i => ({
                        upn: i.email,
                        role: "presenter"
                    }))
                ]
            }
        }, {
            headers: {
                'Authorization': `Bearer ${authResponse.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return meetingResponse.data.joinWebUrl;
    } catch (error) {
        console.error('Error creating Teams meeting:', error);
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

module.exports = { createTeamsMeeting };