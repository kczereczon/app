import axios from "axios";
import dotenv from "dotenv"
import FormData from "form-data"

dotenv.config();

const request = (url, data, method) => {
    return {
        method: method,
        url: `https://api.imagga.com/${url}`,
        headers: {
            'Authorization': `Basic ${process.env.IMAGGA_API_KEY}`,
            ...data.getHeaders()
        },
        data: data
    }
};

export const uploadImage = async (image_base64) => {
    const data = new FormData();
    data.append('image_base64', image_base64);

    var config = request('v2/uploads', data, 'post');

    try {
        const response = await axios(config);
        return response.data.result.upload_id;
    } catch (error) {
        console.error(error.response.data);
    }
}

export const categorize = async (image_base64) => {
    const data = new FormData();
    data.append('image_base64', image_base64);

    var config = request('v2/categories/personal_photos', data, 'post')

    try {
        const response = await axios(config);
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error.response.data);
        throw new Error(error);
    }

    return null;
}

export const taggorize = async (image_base64) => {
    const data = new FormData();
    data.append('image_base64', image_base64, 'post');

    let config = request('v2/tags', data);
    console.log(config)

    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(error.response.data);
        throw new Error(error);
    }

    return null;
}

export const taggorizeUrl = async (image_url) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const response = await axios.get(`https://api.imagga.com/v2/tags`, {
            params: { image_url: image_url },
            headers: {
                'Authorization': `Basic ${process.env.IMAGGA_API_KEY}`
            }
        });
        console.log((response.data));
        return response.data;
    } catch (error) {
        console.error(error.response.data);
        throw new Error(error);
    }

    return null;
}