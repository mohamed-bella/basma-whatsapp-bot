const axios = require('axios');

// WordPress Configuration
const WP_SITE_URL = 'https://moroccotravelexperts.com';
const WP_REST_ENDPOINT = `${WP_SITE_URL}/wp-json/wp/v2/mte_story`;
const WP_USERNAME = 'bellaxcode';
const WP_APP_PASSWORD = '9uOu fE7x pmcz mG6e ARXO 4A0u';

// Base64 encode the credentials for Basic Auth
const authToken = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

/**
 * Creates a story in WordPress with the provided details.
 * @param {Object} data - The story data (title, content, subtitle, reading_time)
 */
async function createStory(data) {
    const storyPayload = {
        title: data.title,
        status: 'publish', // Or 'draft'
        content: data.content, // Set standard content to provided content
        featured_media: data.hero_image, // Add to standard WP Featured Image
        acf: {
            subtitle: data.subtitle,
            author_name: 'Basma Bot', 
            reading_time: data.reading_time,
            hero_image: data.hero_image, // Use the dynamically provided ID
            story_content: data.content 
        }
    };

    try {
        console.log('Sending Story Payload to WordPress...');
        const response = await axios.post(WP_REST_ENDPOINT, storyPayload, {
            headers: {
                'Authorization': `Basic ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            id: response.data.id,
            link: response.data.link
        };

    } catch (error) {
        console.error('❌ Failed to create story!');
        let errorMsg = error.message;
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error Data:', error.response.data);
            errorMsg = JSON.stringify(error.response.data);
        }
        return {
            success: false,
            error: errorMsg
        };
    }
}

module.exports = { createStory };
