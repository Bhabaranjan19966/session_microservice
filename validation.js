
/*
this functions will be used to validate the request.body 
object to make sure no garbage object is going to the database
*/

validateCreateSession = (userDetails) => {
    if (userDetails.hasOwnProperty('identifier') &&
        userDetails.sessionDetails.hasOwnProperty('sessionStartDate') &&
        userDetails.sessionDetails.hasOwnProperty('sessionEndDate')) {
        console.log('create session validated');
        return true;
    } else {
        console.log('create session Not Valid');
        return false;
    }
}

validateUpdateSession = (userDetails) => {
    console.log(JSON.stringify(userDetails));
    if (userDetails.hasOwnProperty('identifier') &&
        userDetails.sessionDetails.hasOwnProperty('sessionStartDate') &&
        userDetails.sessionDetails.hasOwnProperty('sessionEndDate') &&
        userDetails.sessionDetails.hasOwnProperty('sessionId')) {
        return true;
    } else {
        return false;
    }
}

validateDeleteSession = (userDeatils) => {
    if (userDeatils.hasOwnProperty.sessionDetails('sessionId')) {
        return true;
    } else {
        return false;
    }
}

validateGetSessions = (userDeatils) => {
    if (userDeatils.hasOwnProperty('batchId')) {
        return true;
    } else {
        return false;
    }
}

validateUserSessions = (userDeatils) => {
    if (userDeatils.hasOwnProperty('userId')) {
        return true;
    } else {
        return false;
    }
}

validateSingleSession = (userDeatils) => {
    if (userDeatils.hasOwnProperty('sessionId')) {
        return true;
    } else {
        return false;
    }
}


module.exports = {
    validateCreateSession,
    validateUpdateSession,
    validateDeleteSession,
    validateGetSessions,
    validateUserSessions,
    validateSingleSession
}
