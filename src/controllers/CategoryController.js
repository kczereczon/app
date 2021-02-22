import { response } from "express";
import { Category } from "../models/CategoryModel";

export async function create(name) {
    return await Category.create({name: name
    });
}

export async function all() {
    return await Category.find();
}

export async function remove(id) {
    try {
        var response = await Category.remove({_id: id}, function (err) {
            if(err) {
                console.log(err);
            }
        });   
    } catch (error) {
        var response = {
            status: false,
            error: error
        };
    } finally {
        return response;
    }
}