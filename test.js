const chai = require('chai');
const mocha = require('mocha');
const chaiHttp = require('chai-http');
let sessionId;
chai.should();
chai.use(chaiHttp)
const host = 'http://0.0.0.0:8080';


describe('test cases for create-session ', () => {

    var path = '/create-session';
    it('should create a create-session successfully', (done) => {
        chai
            .request(host)
            .post(path)
            .send({
                "identifier": '123456',
                sessionDetails: {
                    createdBy: "789255",
                    sessionStartDate: "Wed Dec 19 2018 03:01:32 GMT+0530",
                    sessionEndDate: "Wed Dec 19 2018 04:01:32 GMT+0530"
                }
            })
            .end((err, resp, body) => {
                if (err) {
                    // console.log('something went wrong ', err);
                } else {
                    sessionId = String(resp.body.sessionId);
                    // console.log(sessionId, 'sessionId');
                    // console.log(resp.body, 'create session');
                    chai.expect(resp.body).to.have.property('message');
                    // console.log('checking sessions')
                    chai.expect(resp.body.message).to.equal('data successfully inserted to the database');
                    done();
                }
            })
    })

    it('should throw responseCode 400 json for  session-creation with invalid request object', (done) => {
        chai
            .request(host)
            .post(path)
            .send({
                "invalid": 456
            })
            .end((error, resp, body) => {
                // console.log(resp.body, "should err")
                chai.expect(resp.body).to.have.property('responseCode');
                chai.expect(resp.body.responseCode).to.equal(400);
                done();
            })

    })

    it('should not create a session if there is an overlap', (done) => {
        chai
            .request(host)
            .post(path)
            .send(
                {
                    identifier: '123456',
                    sessionDetails: {
                        createdBy: "789255",
                        sessionStartDate: "Wed Dec 19 2018 03:01:32 GMT+0530",
                        sessionEndDate: "Wed Dec 19 2018 04:01:32 GMT+0530"
                    }
                }
            )
            .end((error, resp, body) => {
                // console.log(resp.body, 's not')
                chai.expect(resp.body).to.have.property('message');
                chai.expect(resp.body.message).to.equal("cannot create session as you already have a session");
                done();
            })
    })
})




describe('testing update-session API', () => {

    let path = '/update-session'

    it('should uptdate the session information', (done) => {
        // console.log(sessionId);
        chai
            .request(host)
            .post(path)
            .send(
                {
                    identifier: '123456',
                    sessionDetails: {
                        createdBy: "789255",
                        sessionStartDate: "Wed Dec 19 2018 03:01:32 GMT+0530",
                        sessionEndDate: "Wed Dec 19 2018 05:01:32 GMT+0530",
                        sessionId: sessionId
                    }
                }
            )
            .end((error, resp, body) => {
                // console.log(resp.body, " update")
                chai.expect(resp.body).to.have.property('responseCode');
                chai.expect(resp.body.responseCode).to.equal(200);
                done();
            })
    })

    it('session updation confirmed', (done) => {
        path = '/single-session'
        // console.log(path);
        chai
            .request(host)
            .post(path)
            .send({
                'sessionId': sessionId
            })
            .end((error, resp, body) => {
                chai.expect(resp.body.sessionDetails.sessionEndDate).to.equal("Wed Dec 19 2018 05:01:32 GMT+0530");
                done();
            })
    })

    it('should respond with an response-code 400 for invalid request object', (done) => {
        path = '/update-session'
        // console.log(path);
        chai
            .request(host)
            .post(path)
            .send({
                "lkjdf": 'kjdf'
            })
            .end((error, resp, body) => {
                chai.expect(resp.body).to.have.property('responseCode');
                done();
            })
    })
})


describe('testing getsessions', () => {

    before(() => {
        path = "/getsessions"
    })

    it('should return responseCode 400 for invalid request body', (done) => {
        chai
            .request(host)
            .post(path)
            .send({
                "asdf": "adf"
            })
            .end((error, resp, body) => {
                chai.expect(resp.body).to.have.property('responseCode');
                chai.expect(resp.body.responseCode).to.equal(400);
                done();
            })
    })

    it('should return batch-sessions', (done) => {
        chai
            .request(host)
            .post(path)
            .send({
                batchId: '123456'
            })
            .end((error, resp, body) => {
                // console.log(resp.body);
                chai.expect(resp.body).to.have.property('sessions');
                chai.expect(resp.body.sessions.length).to.not.equal(0);
                done();
            })
    })

})


describe('testing single-session', () => {

    before(() => {
        path = "/single-session"
    })

    it('should return response code 400 for invalid request object', (done) => {
        chai
            .request(host)
            .post(path)
            .send({
                "lskdf": "lskfd"
            })
            .end((error, resp, body) => {
                chai.expect(resp.body).to.have.property('responseCode');
                chai.expect(resp.body.responseCode).to.equal(400);
                done();
            })
    })

    it('should return a single session object', (done) => {
        chai
            .request(host)
            .post(path)
            .send({
                "sessionId": sessionId
            })
            .end((error, resp, body) => {
                // console.log(JSON.stringify(resp.body), 'single session object');
                chai.expect(resp.body).to.have.property('sessionDetails');
                done();
            })

    })
})

describe('testing user-sessions', () => {

    before(() => {
        path = "/user-sessions";
    })

    it('should return responseCode 400 for invalid request body', (done) => {
        chai
            .request(host)
            .post(path)
            .send({
                "asdf": "adf"
            })
            .end((error, resp, body) => {
                chai.expect(resp.body).to.have.property('responseCode');
                chai.expect(resp.body.responseCode).to.equal(400);
                done();
            })
    })

    it('should return user sessions', (done) => {

        chai
            .request(host)
            .post(path)
            .send(
                {
                    userId: "789255"
                }
            )
            .end((error, resp, body) => {
                // console.log(JSON.stringify(resp.body), "user session response")
                // console.log(resp.body.sessions.length, "session length")
                chai.expect(resp.body).to.has.property('sessions');
                chai.expect(resp.body.sessions.length).to.not.equal(0);
                done();
            })

    })
})


describe('testing delete session', () => {

    it('should throw an response code of 400', (done) => {
        chai
            .request(host)
            .post(path)
            .send({
                "sf": "sdf"
            })
            .end((error, resp, body) => {
                chai.expect(resp.body).to.have.property('responseCode');
                chai.expect(resp.body.responseCode).to.equal(400);
                done();
            })
    })
})