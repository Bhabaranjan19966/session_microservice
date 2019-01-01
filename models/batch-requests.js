const batchUpdateReq = {
    courseId: String,
    batchId: String,
    createdById: String,
    mentorsPresent: [],
    mentorWhoUpdated : String,
    mentorsAdded: [],
    mentorsDeleted : [],
}

const batchFetchReq = {
    batchId: String,
}

module.exports = batchUpdateReq;
module.exports = batchFetchReq;
