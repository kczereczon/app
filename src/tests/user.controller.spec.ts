import { expect } from "chai";
import { describe } from "mocha";
import UserController from "../controllers/User";
import Application from "../Application";
import { Router } from "express";

describe('users controller', () => {
    const application = new Application();
    describe('register', () => {
        const userController = new UserController();
        it('register method exists', () => {
            expect(userController.register).not.equal(undefined);
        });
        it('register is present in router', () => {
            const router: Router = userController.router;
            expect(router.stack)
        })
    });
})