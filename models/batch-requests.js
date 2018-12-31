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
    courseId: String,
    batchId: String,
}

module.exports = batchUpdateReq;
module.exports = batchFetchReq;
