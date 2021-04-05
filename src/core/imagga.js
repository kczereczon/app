request = (url, data) => {
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

const uploadImage = async (image_base64) => {
    const data = new FormData();
    data.append('image_base64', image_base64);

    let request = request('v2/uploads')

    try {
        const response = await axios(config);
        return response.data.result.upload_id;
    } catch (error) {
        res.json(error.response.data);
    }
}