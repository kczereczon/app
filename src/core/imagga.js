import axios from "axios";
import dotenv from "dotenv"
import FormData from "form-data"

dotenv.config();

const request = (url, data) => {
    return {
        method: 'post',
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

    var config = request('v2/uploads', data);

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

    var config = request('v2/categories/personal_photos', data)
    
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
    data.append('image_base64', image_base64);

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