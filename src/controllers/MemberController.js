const memberService = require("../services/MemberService");
const familyService = require("../services/FamilyService");

exports.requestOtp = async (req, res) => {
  const result = await memberService.requestOtp(req.body.mobileNumber);
  res.status(200).json(result);
};

exports.verifyOtp = async (req, res) => {
  const result = await memberService.verifyOtp(req.body);
  res.status(200).json(result);
};

exports.registerMember = async (req, res) => {
  const result = await memberService.registerMember(req.body);
  res.status(200).json(result);
};

exports.getMyProfile = async (req, res) => {
  const result = await memberService.getMemberProfile(req.member.memberId);
  res.status(200).json(result);
};

exports.getMyFamilyDetails = async (req, res) => {
  const memberResult = await memberService.getMemberProfile(req.member.memberId);
  if (memberResult.responseCode !== 200) return res.status(200).json(memberResult);

  const result = await familyService.getFamilyDetails(memberResult.responseBody.familyId);
  res.status(200).json(result);
};

exports.logout = async (req, res) => {
  const token = req.query.token || getBearerToken(req);
  const result = await memberService.logout(token);
  res.status(200).json(result);
};

exports.getAllMembers = async (req, res) => {
  const { pageIndex = 0, pageSize = 10, approvalStatus, searchText } = req.query;
  const result = await memberService.getAllMembers({
    pageIndex: parseInt(pageIndex, 10),
    pageSize: parseInt(pageSize, 10),
    approvalStatus,
    searchText,
  });
  res.status(200).json(result);
};

exports.getPendingMembers = async (req, res) => {
  const { pageIndex = 0, pageSize = 10, searchText } = req.query;
  const result = await memberService.getAllMembers({
    pageIndex: parseInt(pageIndex, 10),
    pageSize: parseInt(pageSize, 10),
    approvalStatus: "PENDING",
    searchText,
  });
  res.status(200).json(result);
};

exports.approveMember = async (req, res) => {
  const result = await memberService.approveMember(req.body.id);
  res.status(200).json(result);
};

exports.rejectMember = async (req, res) => {
  const result = await memberService.rejectMember(req.body.id, req.body.rejectionReason);
  res.status(200).json(result);
};

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}
