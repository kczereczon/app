import axios from "axios";
import { response, Router } from "express";
import dotenv from "dotenv"
import FormData from "form-data"
import got from "got"

dotenv.config();

let imaggaRouter = new Router();

imaggaRouter.post('/categorize', async (req, res) => {
    const data = new FormData();
    data.append('image_base64', req.body.image_base64);

    var config = {
        method: 'post',
        url: 'https://api.imagga.com/v2/categories/personal_photos',
        headers: { 
          'Authorization': `Basic ${process.env.IMAGGA_API_KEY}`, 
          ...data.getHeaders()
        },
        data : data
      };

    try {
        const response = await axios(config);
        res.json(response.data)
    } catch (error) {
        res.json(error.response.data);
    }
})

imaggaRouter.post('/tags', async (req, res) => {
    const data = new FormData();
    data.append('image_base64', req.body.image_base64);

    var config = {
        method: 'post',
        url: 'https://api.imagga.com/v2/tags',
        headers: { 
          'Authorization': `Basic ${process.env.IMAGGA_API_KEY}`, 
          ...data.getHeaders()
        },
        data : data
      };

    try {
        const response = await axios(config);
        res.json(response.data)
    } catch (error) {
        res.json(error.response.data);
    }
})

export { imaggaRouter };