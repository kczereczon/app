import { expect } from "chai";
import { describe } from "mocha";
import Application from "../Application";

describe('Application', () => {
    describe('application initialization', () => {
        it('application getter exists', () => {
            const application = new Application();
            expect(application.getApplication).not.equal(undefined);
        });

        it('controllers getter exists', () => {
            const application = new Application();
            expect(application.getControllers).not.equal(undefined);
        });
        it('construction initializes application param', () => {
            const application = new Application();
            expect(application.getApplication()).not.equal(null);
            expect(application.getApplication()).not.equal(undefined);
        })
    })

    describe('routes initialization', () => {
        it('controller initialization method exists', () => {
            const application = new Application();
            const controllerInitMethod = application.initControllers;

            expect(controllerInitMethod).not.equal(undefined);
        });

        it('controller initialization method registers controllers', () => {
            const application = new Application();
            const controllers = application.getControllers();

            expect(controllers).not.equal(undefined);
            expect(controllers).not.equal(null);
            expect(controllers).not.equal(0);
        });
    });

    describe('application start stop', () => {
        it('start method exists', () => {
            const application = new Application();
            const startApplicationMethod = application.start;

            expect(startApplicationMethod).not.equal(undefined);
        })

        it('stop method exists', () => {
            const application = new Application();
            const stopApplicationMethod = application.stop;

            expect(stopApplicationMethod).not.equal(undefined);
        })
    })
})