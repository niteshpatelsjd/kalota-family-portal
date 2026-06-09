const redis = require("../config/RedisConfig");
const jwtUtil = require("../utils/JwtUtil");
const buildResponse = require("../utils/response");
const memberRepo = require("../repositories/MemberRepository");
const familyRepo = require("../repositories/FamilyRepository");
const memberSessionRepo = require("../repositories/MemberSessionRepository");


async function requestOtp(mobileNumber) {
  try {
    if (!mobileNumber) return buildResponse(400, "mobileNumber is required", null);
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      return buildResponse(400, "Valid Indian mobileNumber is required", null);
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    await redis.set(`member_otp:${mobileNumber}`, otp, "EX", 60 * 5);

    return buildResponse(200, "OTP sent successfully", otp);
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function verifyOtp({ mobileNumber, otp, deviceType, deviceToken }) {
  try {
    if (!mobileNumber || !otp) {
      return buildResponse(400, "mobileNumber and otp are required", null);
    }

    const key = `member_otp:${mobileNumber}`;
    const storedOtp = await redis.get(key);
    if (!storedOtp || storedOtp !== otp) {
      await memberSessionRepo.createSession({
        deviceType,
        deviceToken,
        eventType: "LOGIN_FAILED",
        description: "Invalid or expired OTP",
      });
      return buildResponse(401, "Invalid or expired OTP", null);
    }

    await redis.del(key);

    const member = await memberRepo.findByMobileNumber(mobileNumber);
    if (!member) {
      return buildResponse(200, "OTP verified. Registration required.", {
        isRegistered: false,
        mobileNumber,
      });
    }

    if (member.approvalStatus === "PENDING") {
      return buildResponse(202, "Your registration is pending approval.", {
        isRegistered: true,
        approvalStatus: member.approvalStatus,
      });
    }

    if (member.approvalStatus === "REJECTED") {
      return buildResponse(403, member.rejectionReason || "Your registration was rejected.", {
        isRegistered: true,
        approvalStatus: member.approvalStatus,
      });
    }

    if (member.status !== 1) {
      return buildResponse(403, "Your account is inactive. Please contact administrator.", null);
    }

    const token = jwtUtil.generate({
      memberId: member._id,
      mobileNumber: member.mobileNumber,
      type: "MEMBER",
    });

    await memberSessionRepo.createSession({
      memberId: member._id,
      sessionToken: token,
      deviceType,
      deviceToken,
      loginAt: new Date(),
      isActive: true,
      eventType: "LOGIN_SUCCESS",
      description: "Member login successfully",
    });

    return buildResponse(200, "Login successfully", {
      isRegistered: true,
      accessToken: token,
      memberResponse: buildMemberResponse(member),
    });
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function registerMember(data) {
  try {
    const required = ["mobileNumber", "name", "gender", "district", "tehsil", "village", "familyId"];
    const missing = required.filter((field) => !data?.[field]);
    if (missing.length) return buildResponse(400, `${missing.join(", ")} required`, null);

    const existingMobile = await memberRepo.findByMobileNumber(data.mobileNumber);
    if (existingMobile) {
      return buildResponse(409, "This mobile number is already registered", buildMemberResponse(existingMobile));
    }

    const family = await familyRepo.findByFamilyId(data.familyId);
    if (!family) return buildResponse(404, "Selected familyId not found", null);

    const matchedProfile = await findBestProfileMatch(data);
    const femaleFamilyCheck = await validateMarriedFemaleFamilySelection(data, matchedProfile);
    if (femaleFamilyCheck) return femaleFamilyCheck;

    if (matchedProfile) {
      const approvedDuplicate = await memberRepo.findApprovedByMatchedProfileId(matchedProfile._id);
      if (approvedDuplicate) {
        return buildResponse(409, "This family profile is already linked with another approved member", null);
      }
    }

    const isFamilyHead = matchedProfile?.relationToHead === "HEAD" || data.isFamilyHead === true;
    const profileMobile = matchedProfile?.mobileNumber || "";
    const mobileMismatch = Boolean(matchedProfile && profileMobile && profileMobile !== data.mobileNumber);
    let matchType = "MANUAL_REVIEW";

    if (matchedProfile && !mobileMismatch) matchType = "EXACT_PROFILE_MATCH";
    if (matchedProfile && mobileMismatch) matchType = isFamilyHead ? "HEAD_PROFILE_MOBILE_MISMATCH" : "PROFILE_MOBILE_MISMATCH";

    const member = await memberRepo.create({
      ...data,
      matchedProfileId: matchedProfile?._id || null,
      isFamilyHead,
      mobileMismatch,
      matchType,
      approvalStatus: "PENDING",
      status: 1,
    });

    return buildResponse(201, "Registration submitted successfully. Waiting for admin approval.", buildMemberResponse(member));
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function approveMember(id) {
  try {
    const member = await memberRepo.findById(id);
    if (!member) return buildResponse(404, "Member not found", null);

    if (member.matchedProfileId) {
      const approvedDuplicate = await memberRepo.findApprovedByMatchedProfileId(member.matchedProfileId);
      if (approvedDuplicate && String(approvedDuplicate._id) !== String(member._id)) {
        return buildResponse(409, "This family profile is already linked with another approved member", null);
      }
    }

    const updated = await memberRepo.update(id, {
      approvalStatus: "APPROVED",
      rejectionReason: "",
      approvedAt: new Date(),
      rejectedAt: null,
    });

    if (updated.matchedProfileId) {
      await familyProfileRepo.update(updated.matchedProfileId, {
        linkedMemberId: updated._id,
      });
    }

    return buildResponse(200, "Member approved successfully", buildMemberResponse(updated));
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function rejectMember(id, rejectionReason) {
  try {
    const member = await memberRepo.update(id, {
      approvalStatus: "REJECTED",
      rejectionReason: rejectionReason || "Registration rejected by admin",
      rejectedAt: new Date(),
      approvedAt: null,
    });

    if (!member) return buildResponse(404, "Member not found", null);
    return buildResponse(200, "Member rejected successfully", buildMemberResponse(member));
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function getMemberProfile(id) {
  try {
    const member = await memberRepo.findById(id);
    if (!member) return buildResponse(404, "Member not found", null);
    return buildResponse(200, "Member fetched successfully", buildMemberResponse(member));
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function getAllMembers({ pageIndex = 0, pageSize = 10, approvalStatus, searchText }) {
  try {
    const query = { status: { $ne: 0 } };
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (searchText && searchText.trim()) {
      query.$or = [
        { name: { $regex: searchText.trim(), $options: "i" } },
        { mobileNumber: { $regex: searchText.trim(), $options: "i" } },
        { familyId: { $regex: searchText.trim(), $options: "i" } },
      ];
    }

    const skip = pageIndex * pageSize;
    const [members, totalRecords] = await Promise.all([
      memberRepo.findAll(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      memberRepo.countDocuments(query),
    ]);

    if (!members.length) return buildResponse(404, "No records found", null);

    return buildResponse(200, "Members fetched successfully", {
      content: members.map(buildMemberResponse),
      pageIndex,
      pageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      hasNext: pageIndex + 1 < Math.ceil(totalRecords / pageSize),
      hasPrevious: pageIndex > 0,
    });
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function logout(token) {
  try {
    const session = await memberSessionRepo.closeSessionByToken(token);
    if (!session) return buildResponse(401, "Invalid or expired session", null);

    session.eventType = "LOGOUT";
    session.description = "Member logout successfully";
    session.logoutAt = new Date();
    session.isActive = false;
    await session.save();

    return buildResponse(200, "Logout successful", null);
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function findBestProfileMatch(data) {
  if (data.matchedProfileId) {
    return await familyProfileRepo.findById(data.matchedProfileId);
  }

  const fatherName = data.gender === "FEMALE" && data.isMarried
    ? data.sasurName || data.fatherName
    : data.fatherName;

  const possible = await familyProfileRepo.findPossibleProfileMatch({
    familyId: data.familyId,
    name: data.name,
    fatherName,
    dob: data.dob,
  });

  if (possible) return possible;

  if (data.isFamilyHead) {
    return await familyProfileRepo.findHeadByFamilyId(data.familyId);
  }

  return null;
}

async function validateMarriedFemaleFamilySelection(data, matchedProfile) {
  if (data.gender !== "FEMALE" || data.isMarried !== true) return null;

  if (matchedProfile && ["DAUGHTER", "SISTER"].includes(matchedProfile.relationToHead)) {
    if (matchedProfile.spouseFamilyId && matchedProfile.spouseFamilyId !== data.familyId) {
      return buildResponse(400, "You selected your father's family. Please select your spouse family ID.", {
        suggestedFamilyId: matchedProfile.spouseFamilyId,
      });
    }

    return buildResponse(400, "You selected your father's family. Please select your spouse family ID.", null);
  }

  const fatherSideProfile = await FamilyProfile.findOne({
    name: { $regex: `^${escapeRegex(data.name)}$`, $options: "i" },
    relationToHead: { $in: ["DAUGHTER", "SISTER"] },
    isMarried: true,
    status: { $ne: 0 },
    $or: [
      { fatherName: { $regex: `^${escapeRegex(data.fatherName || "")}$`, $options: "i" } },
      { "spouseDetails.name": { $regex: `^${escapeRegex(data.sasurName || "")}$`, $options: "i" } },
    ],
  });

  if (fatherSideProfile && fatherSideProfile.familyId === data.familyId) {
    return buildResponse(400, "You selected your father's family. Please select your spouse family ID.", {
      suggestedFamilyId: fatherSideProfile.spouseFamilyId || "",
    });
  }

  return null;
}

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMemberResponse(member) {
  if (!member) return null;
  return {
    id: member._id,
    mobileNumber: member.mobileNumber,
    name: member.name,
    email: member.email,
    gender: member.gender,
    isMarried: member.isMarried,
    fatherName: member.fatherName,
    grandFatherName: member.grandFatherName,
    sasurName: member.sasurName,
    grandSasurName: member.grandSasurName,
    district: member.district,
    tehsil: member.tehsil,
    village: member.village,
    familyId: member.familyId,
    matchedProfileId: member.matchedProfileId,
    isFamilyHead: member.isFamilyHead,
    mobileMismatch: member.mobileMismatch,
    matchType: member.matchType,
    approvalStatus: member.approvalStatus,
    rejectionReason: member.rejectionReason,
    status: member.status,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

module.exports = {
  requestOtp,
  verifyOtp,
  registerMember,
  approveMember,
  rejectMember,
  getMemberProfile,
  getAllMembers,
  logout,
  buildMemberResponse,
};
