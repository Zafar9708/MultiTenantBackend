const axios = require('axios');

const createZoomMeeting = async (interviewDetails) => {
    try {
        const payload = {
            iss: process.env.ZOOM_CLIENT_ID,
            exp: ((new Date()).getTime() + 5000)
        };
        
        const token = jwt.sign(payload, process.env.ZOOM_CLIENT_SECRET);

        const meetingResponse = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
            topic: interviewDetails.subject || `Interview with ${interviewDetails.candidate.name}`,
            type: 2, 
            start_time: `${interviewDetails.date}T${interviewDetails.startTime}:00`,
            duration: interviewDetails.duration,
            timezone: interviewDetails.timezone,
            settings: {
                join_before_host: false,
                participant_video: true,
                host_video: true,
                auto_recording: 'none',
                waiting_room: true
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return meetingResponse.data.join_url;
    } catch (error) {
        console.error('Error creating Zoom meeting:', error);
        throw error;
    }
};

module.exports = { createZoomMeeting };