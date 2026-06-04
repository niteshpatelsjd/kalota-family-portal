const MemberSession = require("../models/MemberSession");

async function createSession(data) {
  return await new MemberSession(data).save();
}

async function closeSessionByToken(token) {
  return await MemberSession.findOne({
    sessionToken: token,
    isActive: true,
  });
}

module.exports = {
  createSession,
  closeSessionByToken,
};
