
const chai = require('chai');
const mocha = require('mocha');
const chaiHttp = require('chai-http');
let batchId;
chai.should();
chai.use(chaiHttp)
const host = 'http://0.0.0.0:8080';
const testObject_1 = {
    request:{
    courseId:"test125",
    batchId:"test100",
    createdById:"creator123",
    mentorsPresent:["maddy123","suar123"],
    mentorWhoUpdated:"maddy123",
    mentorsAdded: ["kiki123","momo123"],
    mentorsDeleted :[]
}
}
const testObject_3 = {
    request:{
    courseId:"test125",
    batchId:"test101",
    createdById:"creator123",
    mentorsPresent:[],
    mentorWhoUpdated:"creator123",
    mentorsAdded: ["kiki123","momo123"],
    mentorsDeleted :[]
}
}

const testObject_2 = {
    request:{
    courseId:"test125",
    batchId:"test102",
    createdById:"creator123",
    mentorsPresent:["maddy123","pop123","kuku123","chorizo123"],
    mentorWhoUpdated:"maddy123",
    mentorsAdded: ["nom123"],
    mentorsDeleted :["chorizo123"]
}
}
const testObject_4 = {
    request:{
    batchId:"test101",
}
}
const testObject_5 = {
    request:{
    batchId:"test105",
}
}
describe('Test Case for update batch additional details', () => {
    const path = '/updateBatch';
    it('Test 1: Post if absent, update if existing When mentors are already present', (done) => {
        chai
            .request(host)
            .post(path)
            .send(testObject_1)
            .end((err, res, body) => {
                if (err) {
                    console.log('Something went wrong', err);
                } else {
                    console.log(res.body)
                    chai.expect(res.body).to.have.property('responseCode');
                    chai.expect(res.body.result.data).to.have.property(testObject_1.request.createdById).with.lengthOf(testObject_1.request.mentorsAdded.length+testObject_1.request.mentorsPresent.length);
                    if(res.body.responseCode === '201'){
                        chai.expect(Object.keys(res.body.result.data)).with.lengthOf(testObject_1.request.mentorsAdded.length+testObject_1.request.mentorsPresent.length+4);
                    }
                    if(res.body.responseCode === '200'){
                        chai.expect(Object.keys(res.body.result.data)).with.lengthOf(testObject_1.request.mentorsAdded.length+testObject_1.request.mentorsPresent.length+3);
                    }

                    done();
                }
            })
    })
    it('Test 2: Post if absent, update if existing When mentors are deleted', (done) => {
        chai
            .request(host)
            .post(path)
            .send(testObject_2)
            .end((err, res, body) => {
                if (err) {
                    console.log('Something went wrong', err);
                } else {
                    console.log(res.body)
                    chai.expect(res.body).to.have.property('responseCode');
                    chai.expect(res.body.result.data).to.have.property(testObject_2.request.createdById).with.lengthOf(testObject_2.request.mentorsAdded.length+testObject_2.request.mentorsPresent.length-testObject_2.request.mentorsDeleted.length);
                    if(res.body.responseCode === '201'){
                        chai.expect(Object.keys(res.body.result.data)).with.lengthOf(testObject_2.request.mentorsAdded.length+testObject_2.request.mentorsPresent.length-testObject_2.request.mentorsDeleted.length+4);
                    }
                    if(res.body.responseCode === '200'){
                        chai.expect(Object.keys(res.body.result.data)).with.lengthOf(testObject_2.request.mentorsAdded.length+testObject_2.request.mentorsPresent.length-testObject_2.request.mentorsDeleted.length+3);
                    }
                    done();
                }
            })
    })
    it('Test 3: Post if absent, update if existing When mentors are already present', (done) => {
        chai
            .request(host)
            .post(path)
            .send(testObject_3)
            .end((err, res, body) => {
                if (err) {
                    console.log('Something went wrong', err);
                } else {
                    console.log(res.body)
                    chai.expect(res.body).to.have.property('responseCode');
                    chai.expect(res.body.result.data).to.have.property(testObject_3.request.createdById).with.lengthOf(testObject_3.request.mentorsAdded.length);
                    if(res.body.responseCode === '201'){
                        chai.expect(Object.keys(res.body.result.data)).with.lengthOf(testObject_3.request.mentorsAdded.length+4);
                    }
                    if(res.body.responseCode === '200'){
                        chai.expect(Object.keys(res.body.result.data)).with.lengthOf(testObject_3.request.mentorsAdded.length+3);
                    }
                    done();
                }
            })
    })
    it('Test Error: Invalid syntax', (done) => {
        chai
            .request(host)
            .post(path)
            .send({
                "invalid": 456
            })
            .end((error, resp, body) => {
                console.log(resp.body, "should err")
                // chai.expect(resp.body).to.have.property('responseCode');
                // chai.expect(resp.body.responseCode).to.equal(400);
                done();
            })
            
    })
})

describe('Test Case for fetch batch additional details', () => {
    const path = '/fetchBatch';
    it('Test 4: If Present', (done) => {
        chai
            .request(host)
            .post(path)
            .send(testObject_4)
            .end((err, res, body) => {
                if (err) {
                    console.log('Something went wrong', err);
                } else {
                    chai.expect(res.body).to.have.property('responseCode');
                    chai.expect(res.body.responseCode).to.equal('200');
                    done();
                }
            })
    })
    it('Test 4: If Absent', (done) => {
        chai
            .request(host)
            .post(path)
            .send(testObject_5)
            .end((err, res, body) => {
                if (err) {
                    console.log('Something went wrong', err);
                } else {
                    chai.expect(res.body).to.have.property('responseCode');
                    chai.expect(res.body.responseCode).to.equal('404');
                    done();
                }
            })
    })
    it('Test Error: Invalid Syntax', (done) => {
        chai
            .request(host)
            .post(path)
            .send({
                "invalid": 456
            })
            .end((error, resp, body) => {
                console.log(resp.body, "should err")
                // chai.expect(resp.body).to.have.property('responseCode');
                // chai.expect(resp.body.responseCode).to.equal(400);
                done();
            })
            
    })
})
